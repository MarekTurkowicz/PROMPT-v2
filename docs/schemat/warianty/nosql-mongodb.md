# PROMT 2.0 – projekt bazy NoSQL (MongoDB)

Diagram: `nosql-mongodb.drawio` (kolekcje, pola osadzone `↳`, odwołania – linie przerywane).

## 1. Założenia

Model dokumentowy projektuje się **pod sposób odczytu danych**, a nie pod normalizację:

- **Agregat = dokument.** Dane czytane zawsze razem trafiają do jednego dokumentu (projekt z etapami, zadanie z checklistą).
- **Osadzanie** – gdy część nie istnieje bez całości i jest ograniczona liczebnie (etapy projektu, punkty checklisty, szablony grantu).
- **Odwołanie (ObjectId)** – gdy dane rosną bez ograniczeń albo są współdzielone (zadania projektu, wpisy czasu, komentarze, historia).
- **Kopie danych** (np. nazwa statusu w zadaniu, imię autora w komentarzu) – świadoma denormalizacja, żeby lista nie wymagała dodatkowych zapytań.
- **Klucz podziału (shard key):** `organization_id` – dane jednej firmy trafiają do tej samej partycji.

## 2. Kolekcje

| Kolekcja | Osadza | Odwołuje się do | Uzasadnienie |
|---|---|---|---|
| `users` | – | – | konto globalne |
| `organizations` | `settings`, `statuses[]`, `roles[]` | – | słowniki firmy są małe i czytane razem z firmą |
| `members` | `profile`, `roles[]` (nadania ról), `group_ids[]` | organizations, users | profil osoby w firmie + jej role w jednym odczycie |
| `groups` | `member_ids[]`, `roles[]` | organizations, projects, groups | hierarchia przez `parent_id` |
| `projects` | `milestones[]`, `fundings[]`, `statuses[]`, `stats` | organizations, members, fundings | widok projektu jednym odczytem |
| `fundings` | `amount`, `templates[]` | organizations | szablony należą do grantu |
| `tasks` | `status` (kopia), `assignees[]`, `checklist[]`, `attachments[]` | projects, fundings, tasks, groups | karta zadania i Kanban bez łączenia kolekcji |
| `time_entries` | – | tasks, members | rośnie bez ograniczeń – osobna kolekcja |
| `comments` | `author` (kopia), `attachments[]` | tasks / projects | wątki mogą być długie |
| `expenses` | `amount`, `attachments[]` | projects, tasks | raporty budżetu agregacją |
| `activity` | `actor`, `entity` (kopie) | organizations | dziennik zdarzeń – tylko dopisywanie |
| `notifications` | `content` | members, activity | skrzynka osoby, indeks TTL usuwa stare |

**Odwzorowanie z modelu relacyjnego:** 22 tabele → 12 kolekcji. Znikają tabele łączące i podrzędne: `task_status` i `role` (osadzone w `organizations`), `milestone` i `project_funding` (w `projects`), `task_template` (w `fundings`), `checklist_item` i `task_assignment` (w `tasks`), `group_member` (`member_ids[]`), `role_assignment` (`roles[]` w `members` i `groups`).

## 3. Przykładowe dokumenty

```json
// projects
{
  "_id": "P1",
  "organization_id": "O1",
  "owner_id": "M7",
  "name": "Termomodernizacja szkoły",
  "status": "active",
  "period": { "start": "2026-11-01", "end": "2027-06-30" },
  "milestones": [
    { "_id": "MS1", "name": "Projekt budowlany", "status": "done", "due_date": "2026-12-15", "position": 1 },
    { "_id": "MS2", "name": "Wykonawstwo", "status": "active", "due_date": "2027-05-31", "position": 2 }
  ],
  "fundings": [ { "funding_id": "F3", "allocation": { "start": "2026-11-01", "end": "2027-06-30" }, "is_primary": true } ],
  "hidden_status_ids": [],
  "stats": { "todo": 12, "in_progress": 5, "done": 30, "cancelled": 1 }
}

// tasks
{
  "_id": "T42",
  "organization_id": "O1",
  "project_id": "P1",
  "milestone_id": "MS2",
  "status": { "_id": "S3", "name": "In Development", "category": "in_progress" },
  "priority": 4,
  "title": "Odbiór instalacji",
  "due_date": "2027-03-10",
  "assignees": [ { "member_id": "M7", "name": "Anna Nowak", "assigned_at": "2026-11-05" } ],
  "checklist": [
    { "checklist_title": "Dokumenty", "element": "Protokół odbioru", "done_by": null, "done_at": null }
  ],
  "attachments": [ { "file": "s3://…/protokol.pdf", "original_name": "protokol.pdf", "size_bytes": 182344 } ],
  "logged_hours": 14.5
}
```

## 4. Indeksy

| Kolekcja | Indeks | Po co |
|---|---|---|
| `members` | `{ organization_id: 1, user_id: 1 }` unikalny | członkostwo raz na firmę |
| `tasks` | `{ project_id: 1, "status.category": 1, priority: -1 }` | Kanban i listy |
| `tasks` | `{ "assignees.member_id": 1, due_date: 1 }` (multikey) | „moje zadania” |
| `tasks` | `{ organization_id: 1, due_date: 1 }` częściowy: `status.category ∈ {todo, in_progress}` | zaległe |
| `time_entries` | `{ member_id: 1, work_date: -1 }` | karta czasu |
| `expenses` | `{ project_id: 1, spent_on: -1 }` | raport kosztów |
| `activity` | `{ "entity.type": 1, "entity.id": 1, created_at: -1 }` | historia obiektu |
| `notifications` | `{ recipient_id: 1, read_at: 1 }`, TTL na `created_at` (np. 180 dni) | skrzynka, automatyczne sprzątanie |

## 5. Typowe zapytania

```js
// Kanban projektu – jeden odczyt, bez łączenia kolekcji
db.tasks.find({ project_id: "P1" }).sort({ "status.category": 1, priority: -1 })

// Budżet grantu: suma wydatków w podziale na projekt
db.expenses.aggregate([
  { $match: { project_funding_id: { $in: ["PF1", "PF2"] } } },
  { $group: { _id: "$project_id", spent: { $sum: "$amount.value" } } }
])

// Odhaczenie punktu checklisty – zmiana w dokumencie zadania
db.tasks.updateOne(
  { _id: "T42", "checklist.element": "Protokół odbioru" },
  { $set: { "checklist.$.done_by": "M7", "checklist.$.done_at": new Date() } }
)
```

## 6. Spójność kopii danych

- Zmiana nazwy statusu: `updateMany` na `tasks` z `"status._id": S3` – rzadka operacja, akceptowalny koszt.
- Imię autora w komentarzach i historii to **zdjęcie stanu z chwili zdarzenia** – nie aktualizujemy.
- `projects.stats` i `tasks.logged_hours` aktualizowane operatorem `$inc` przy każdej zmianie (albo przez zdarzenie z outboxa).
- Walidacja struktury: `$jsonSchema` na każdej kolekcji (typy, wymagane pola, dozwolone wartości kategorii).

## 7. Relacyjny vs dokumentowy – podsumowanie

| Kryterium | PostgreSQL (wariant 1) | MongoDB |
|---|---|---|
| Spójność | klucze obce, CHECK, transakcje | walidacja schematu, spójność dokumentu; kopie trzeba utrzymywać |
| Odczyt karty zadania | kilka JOIN-ów | jeden dokument |
| Raporty przekrojowe | SQL, JOIN, GROUP BY | potok agregacji, czasem `$lookup` |
| Zmiana struktury | migracja | nowe pole w dokumencie |
| Skalowanie poziome | trudniejsze | sharding po `organization_id` |
