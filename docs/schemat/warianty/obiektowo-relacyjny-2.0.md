# PROMT 2.0 – model obiektowo-relacyjny (PostgreSQL 18)

Diagram: `obiektowo-relacyjny-2.0.drawio` (3 strony: diagram ER · mechanizmy i decyzje · zmiany i otwarte kwestie).
Kod: `backend/app/<moduł>/adapter/outbound/object_relational_db/schema/`, lista obiektów w
`backend/app/object_relational_schema.py`, komenda `migrate_or`, testy w `backend/app/tests/object_relational/`.
Punkt wyjścia: 22 tabele na `main` (wariant relacyjny). Zastępuje szkic `obiektowo-relacyjny.md`.

---

## 1. Czym jest model obiektowo-relacyjny

1. To **baza relacyjna** (tabele, klucze obce, SQL, transakcje) **plus elementy obiektowe** ze standardu SQL:1999.
2. Komórka może przechowywać **wartość złożoną**: obiekt z polami, tablicę obiektów albo własny typ z regułami.
   1NF łamiemy tylko tam, gdzie część nie istnieje bez całości (kwota bez waluty, punkt checklisty bez zadania).
3. Obiekty upraszczają **wnętrze agregatu**. Powiązania **między** agregatami zostają relacyjne (id + FK),
   bo PostgreSQL nie ma typu `REF` z Oracle.
4. Używamy: `ENUM`, `DOMAIN`, typów złożonych, tablic typów; `jsonb` bez zmian; funkcje i trigger tylko jako ochrona danych.
5. Koszt: ORM Django tego nie zna, więc schemat to obiekty Pythona z SQL (`migrate_or`), a repozytoria będą na psycopg.

| Oracle (podręcznik) | PostgreSQL | U nas |
|---|---|---|
| `CREATE TYPE … AS OBJECT` z metodami | `CREATE TYPE … AS (…)`, bez metod | `money_t`, `checklist_item_t`, `attachment_t` |
| constructor / CHECK w typie | `DOMAIN` (także na typie złożonym) | każdy typ złożony opakowany domeną |
| `VARRAY`, `NESTED TABLE` | tablica `typ[]` | `task.checklist`, `*.attachments` |
| `REF` / `DEREF` | brak | zwykłe `bigint` + FK |
| `UNDER` | `INHERITS` | nie używamy |

## 2. Najważniejsza zasada: nie ostrzej niż relacyjny

Warianty mają być przełączalne bez utraty danych. Każdy wiersz, który przyjmuje baza relacyjna, musi przejść
także tutaj. Dlatego obiekty OR **zastępują istniejące reguły** (`CHECK IN` → ENUM, CHECK kolumny → DOMAIN),
ale **nie dokładają nowych**. Pilnuje tego test `test_not_stricter_than_relational`.

Świadomie **nie ma** w bazie (są w relacyjnym tylko jako reguły aplikacji, więc i tu tak zostaje):
katalogu 33 kodów uprawnień, formatu e-maila, wymaganych kluczy i kształtu `jsonb`, sprawdzenia, że
`task.project_funding` należy do tego samego projektu.

Jedyny wyjątek to trigger append-only na `activity_log`. Nie odrzuca żadnego wiersza przy przenoszeniu danych
(blokuje `UPDATE`/`DELETE`/`TRUNCATE`, nie `INSERT`), więc przełączanie baz nic nie traci.

## 3. Gdzie to leży w architekturze (main, dc52156)

| Miejsce | Zawartość |
|---|---|
| `app/shared/adapter/outbound/object_relational_db/schema/objects.py` | bloki `EnumType`, `Domain`, `Statement`, `Table` (podklasa `Statement`); `missing_dependencies` |
| `app/shared/.../schema/domains.py`, `composite_types.py` | domeny i typy używane przez kilka modułów |
| `app/shared/.../object_relational_db/migrate.py` | `connect_from_env`, `apply_migrations` (tabela `schema_version`, blokada) |
| `app/<moduł>/adapter/outbound/object_relational_db/schema/<tabela>.py` | tabela modułu i obiekty używane tylko przez nią |
| `app/object_relational_schema.py` | `SCHEMA_OBJECTS` w kolejności tworzenia + `MIGRATIONS` (jak `app/models.py`) |
| `app/management/commands/migrate_or.py` | komenda tworząca schemat |

Moduły: `access` (user, role, role_assignment), `organization` (4 tabele), `project` (project, task_status, milestone),
`finance` (funding, project_funding, task_template, expense), `task` (task, task_assignment, time_entry, comment),
`activity` (activity_log, notification).

Repozytoria OR (implementacje tych samych portów co `relational_db`) to następny krok: `object_relational_db/repositories/`
+ `mappers/` w każdym module i `OBJECT_RELATIONAL_DB_REPOSITORIES` w `dependencies_container.py`.

## 4. Obiekty schematu (53 obiekty, 20 tabel)

### 4.1 ENUM (8) – zastępują `CHECK … IN (TextChoices)`

| Typ | Wartości (kolejność ma znaczenie) | Kolumna |
|---|---|---|
| `member_status_t` | invited, active, suspended, left | `organization_member.status` |
| `project_status_t` | planned, active, closed, cancelled, archived | `project.status` |
| `status_category_t` | todo, in_progress, done, cancelled | `task_status.category` |
| `milestone_status_t` | planned, active, done | `milestone.status` |
| `funding_type_t` | grant, sponsorship, donation, internal | `funding.type` |
| `expense_type_t` | travel, courses, external_services, equipment, other | `expense.type` |
| `entity_type_t` | 18 wartości `EntityType` | `activity_log.entity_type` |
| `activity_action_t` | 24 wartości `ActivityAction` | `activity_log.action` |

`ADD VALUE` działa, usunąć wartości się nie da – dlatego ENUM tylko dla list stałych. Test porównuje każdy ENUM
z `TextChoices` (wartości i kolejność) i z `pg_enum` na żywej bazie.

### 4.2 DOMAIN (10) – zastępują CHECK na jednej kolumnie

| Domena | Definicja | Zastępuje | Kolumny |
|---|---|---|---|
| `login_email_d` | `varchar(254) CHECK (VALUE = lower(VALUE))` | `user_email_lowercase` | `user.email` |
| `position_d` | `smallint CHECK (VALUE >= 0)` | `PositiveSmallIntegerField` | `task_status`, `milestone`, pole checklisty |
| `priority_d` | `smallint CHECK (VALUE BETWEEN 1 AND 5)` | `*_priority_range` | `task`, `task_template` |
| `est_hours_d` | `numeric(6,2) CHECK (VALUE > 0)` | `*_est_hours_positive` | `task`, `task_template` |
| `hours_d` | `numeric(5,2) CHECK (VALUE > 0)` | `time_entry_hours_positive` | `time_entry` |
| `due_days_d` | `integer CHECK (VALUE >= 0)` | `task_template_due_days_not_negative` | `task_template` |
| `color_d` | `varchar(7) CHECK (VALUE ~ '^#[0-9A-Fa-f]{6}$')` | `task_status_color_hex` | `task_status` |
| `currency_d` | `char(3) CHECK (VALUE ~ '^[A-Z]{3}$')` | `*_currency_code` | pole `money_t` |
| `file_size_d` | `bigint CHECK (VALUE > 0 AND VALUE <= 52428800)` | `attachment_size_in_range` | pole `attachment_t` |
| `nonempty_text_d` | `text CHECK (VALUE <> '')` | `comment_content_not_empty` | `comment.content` |

### 4.3 Typy złożone (3), każdy opakowany domeną

Pola typu złożonego nie mogą mieć `NOT NULL` ani `CHECK`, a pole NULL pomija CHECK swojej domeny.
Domena opakowująca powtarza więc wszystkie reguły.

| Typ → domena | Pola | Zastępuje |
|---|---|---|
| `money_t` → `money_d` | `amount numeric(14,2)`, `currency currency_d` | pary `amount_total`+`currency` (`funding`) i `amount`+`currency` (`expense`) |
| `checklist_item_t` → `checklist_item_d` | id, checklist_title, element, "order", done_by_id, done_at, created_at, updated_at | tabelę `checklist_item` → `task.checklist checklist_item_d[]` |
| `attachment_t` → `attachment_d` | id, file, original_name, mime_type, size_bytes, uploaded_by_id, created_at | tabelę `attachment` → `attachments attachment_d[]` w `task`, `comment`, `expense` |

Reguły w domenach są dokładnie te z relacyjnego: kwota > 0 i waluta, `done_by` i `done_at` razem albo wcale,
rozmiar 1 B – 50 MiB, wymagane pola. Kolumny zachowują nazwy z relacyjnego (`amount_total`, `amount`).

### 4.4 Funkcje i trigger

| Obiekt | Rola |
|---|---|
| `checklist_ids_unique(checklist_item_d[])` | `CHECK` w `task`: id punktów bez powtórzeń (w relacyjnym to były PK) |
| `attachment_ids_unique(attachment_d[])` | `CHECK` w `task`, `comment`, `expense` |
| `activity_log_guard()` + 2 triggery | historia tylko do dopisywania (FR-HIST-03) |

```sql
-- retencja (#115): jedyny sposób na usunięcie historii
BEGIN;
SET LOCAL promt.retention = 'on';
DELETE FROM activity_log WHERE organization_id = $1 AND created_at < $2;
COMMIT;
```

`TRUNCATE` nie odpala triggerów wierszowych, dlatego jest drugi trigger `BEFORE TRUNCATE`.
`SET LOCAL` wygasa z końcem transakcji, więc furtka nie zostaje otwarta na połączeniu z puli.

### 4.5 Partial uniques

W relacyjnym to `UniqueConstraint` z warunkiem; w PostgreSQL może to być tylko indeks, więc są to obiekty
`Statement`: `task_status_one_default_in_org`, `project_funding_unique`, `project_funding_one_primary`,
`task_template_once_per_project_funding`. `role_assignment_unique` i `task_status_name_unique` to
`UNIQUE NULLS NOT DISTINCT` (PostgreSQL 15+), jak `nulls_distinct=False` w Django.

## 5. Zmiany tabela po tabeli (main → OR)

Wszystkie kolumny, klucze, nazwy constraintów i reguły `ON DELETE` z `main` zostają (`PROTECT` = `ON DELETE RESTRICT`).
Bez `DEFAULT` – wartości domyślne ustawia domena. Indeksy to osobny etap.

| Tabela | Zmiana w OR |
|---|---|
| `organization`, `member_group`, `member_group_member`, `role`, `role_assignment`, `project_funding`, `task_assignment`, `notification` | bez zmian |
| `user` | `email login_email_d` |
| `organization_member` | `status member_status_t` |
| `project` | `status project_status_t` |
| `task_status` | `category status_category_t`, `color color_d`, `position position_d` |
| `milestone` | `status milestone_status_t`, `position position_d` |
| `funding` | `type funding_type_t`, `amount_total money_d` (zamiast 2 kolumn) |
| `task_template` | `default_priority priority_d`, `default_est_hours est_hours_d`, `default_due_days due_days_d` |
| `task` | `priority priority_d`, `est_hours est_hours_d`, **+** `checklist checklist_item_d[]`, **+** `attachments attachment_d[]` |
| `time_entry` | `hours hours_d` |
| `comment` | `content nonempty_text_d`, **+** `attachments attachment_d[]` |
| `expense` | `type expense_type_t`, `amount money_d` (zamiast 2 kolumn), **+** `attachments attachment_d[]` |
| `activity_log` | `entity_type entity_type_t`, `action activity_action_t`, trigger append-only |
| `checklist_item` | **znika** → `task.checklist[]` (te same pola i id) |
| `attachment` | **znika** → `attachments[]` w `task`, `comment`, `expense` |

Liczba tabel: 22 → 20.

## 6. Ograniczenia modelu i jak je obchodzimy

| Ograniczenie | Decyzja |
|---|---|
| pola typu złożonego bez `NOT NULL` / `CHECK` | każdy typ opakowany domeną |
| `ROW(10, NULL)` nie jest ani `IS NULL`, ani `IS NOT NULL` | domena sprawdza każde pole osobno |
| brak FK do elementów tablicy (`done_by_id`, `uploaded_by_id`; na main `PROTECT`) | sprawdza serwis, jak w MongoDB |
| brak `UNIQUE` wewnątrz tablicy | `CHECK` z funkcją `*_ids_unique` |
| odhaczenie punktu przepisuje cały wiersz zadania | adapter: atomowy `UPDATE` elementu albo `version` |
| ENUM: nie da się usunąć wartości | ENUM tylko dla list stałych |
| ORM nie zna typów i domen | schemat w `schema/`, repozytoria na psycopg |

## 7. Uruchomienie

Baza ma własny kontener `prompt_ordb` w profilu Compose `object_relational`, więc samo `docker compose up` go nie uruchamia.

```sh
docker compose --env-file .env.example --profile object_relational up -d --build ordb migrate_or
docker logs prompt_ordb_migrate          # Applied versions: [1]  (kolejne uruchomienie: … up to date)
```

| Zmienna | Domyślnie | Znaczenie |
|---|---|---|
| `OR_DB_NAME` | `promt_or` | nazwa bazy |
| `OR_DB_HOST` / `OR_DB_PORT` | `localhost` / `27016` | z hosta; w Dockerze compose ustawia `ordb:27016` |
| `OR_DB_USER` / `OR_DB_PASSWORD` | jak `DB_USER` / `DB_PASSWORD` | |

Lokalnie (z `backend/`, kontener `prompt_ordb` działa):

```sh
python manage.py migrate_or
OR_DB_PASSWORD=mt123 pytest app/tests/object_relational
```

Testy tworzą własną bazę `<OR_DB_NAME>_test` i usuwają ją na końcu – danych w `promt_or` nie ruszają.
Testy na żywej bazie wymagają działającego kontenera `prompt_ordb` (jak testy MongoDB – bez pomijania).
Nowa zmiana schematu = nowa wersja w `MIGRATIONS` z poleceniami `ALTER`.

## 8. Bilans

| | Relacyjny | Obiektowo-relacyjny | MongoDB |
|---|---|---|---|
| tabele / kolekcje | 22 | 20 | 11 + counters |
| obiekty poza tabelami | – | 8 ENUM · 10 DOMAIN + 3 opakowujące · 3 typy złożone · 2 funkcje · 1 trigger | walidatory |
| FK między agregatami | tak | tak | nie |
| FK wewnątrz agregatu | tak | nie – serwis | nie – serwis |
| historia append-only w bazie | nie | tak | nie |
| karta zadania | 3 tabele | 1 wiersz | 1 dokument |
| definicja schematu | migracje Django | obiekty `schema/` + `migrate_or` | `init_mongo` |

## 9. Do decyzji zespołu

1. Zmiany PRD Z1–Z14 (#85): do OR razem z relacyjnym.
2. `organization.settings`: wymagane klucze – reguła domeny we wszystkich bazach?
3. `modified_at` vs `updated_at` w `organization`.
4. Katalog uprawnień: dziś sprawdza tylko aplikacja. Jeśli kiedyś w bazie, to we wszystkich 3 wariantach.
5. `project.hidden_status_ids` bez powtórzeń – reguła domeny czy bazy.
6. `notification`: `kind`, `dedup_key`, `organization_id` (#72, D7).
7. Aktywny członek ⇒ `joined_at` – reguła domeny.
8. Limity tablic (maxItems z MongoDB) – reguła domeny czy tylko Mongo.
9. `expense`: XOR projekt / podpięcie (main) vs Z14.
10. Psycopg 3 przy repozytoriach OR – przełącza też sterownik Django.
11. `task.project_funding` z tego samego projektu – reguła aplikacji we wszystkich bazach.
12. Port repozytorium `activity_log`: tylko dopisywanie + retencja (trigger jest tylko w OR).
