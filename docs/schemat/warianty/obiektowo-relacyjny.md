# PROMT 2.0 – projekt bazy obiektowo-relacyjnej (PostgreSQL)

Diagram: `obiektowo-relacyjny.drawio` – tabele, typy użytkownika (`«type»`, `«enum»`, `«domain»`),
dziedziczenie (trójkąt) i użycie typów (linia kropkowana).

## 1. Założenia

Ten sam zakres danych co w modelu relacyjnym, ale z mechanizmami obiektowymi PostgreSQL:

| Mechanizm | Zastosowanie w PROMT | Co zastępuje |
|---|---|---|
| **ENUM** | `status_category_t`, `member_status_t`, `project_status_t` | słowniki i `CHECK IN (…)` |
| **DOMAIN** | `priority_t` (1–5), `email_t` (format adresu) | powtarzane reguły CHECK |
| **Typ złożony** | `money_t` (kwota + waluta), `contact_t` (e-mail, telefon, avatar) | pary kolumn powtarzane w wielu tabelach |
| **Tablica typu złożonego** | `task.checklist checklist_item_t[]`, `attachments attachment_t[]` | tabele `checklist_item`, `attachment` |
| **Tablica prosta** | `role.permissions text[]`, `member_group.member_ids bigint[]`, `project.hidden_status_ids bigint[]` | tabele łączące |
| **Zakres** | `period daterange`, `allocation daterange`, `work_period tstzrange` | pary kolumn od–do |
| **Dziedziczenie tabel** | `project`, `milestone`, `task` INHERITS `work_item` | powtarzane kolumny (tytuł, opis, okres, daty) |
| **jsonb** | `organization.settings`, `work_item.custom_fields`, `activity_log.changes`, `notification.content` | tabele klucz–wartość |

## 2. Definicje typów

```sql
CREATE TYPE status_category_t AS ENUM ('todo', 'in_progress', 'done', 'cancelled');
CREATE TYPE member_status_t   AS ENUM ('invited', 'active', 'suspended', 'left');
CREATE TYPE project_status_t  AS ENUM ('planned', 'active', 'on_hold', 'done', 'cancelled');

CREATE DOMAIN priority_t AS smallint CHECK (VALUE BETWEEN 1 AND 5);
CREATE DOMAIN email_t    AS varchar(254) CHECK (VALUE ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

CREATE TYPE money_t   AS (amount numeric(14,2), currency char(3));
CREATE TYPE contact_t AS (email email_t, phone varchar(32), avatar_url varchar(500));
CREATE TYPE checklist_item_t AS (checklist_title varchar(120), element varchar(300), position smallint,
                                 done_by_id bigint, done_at timestamptz);
CREATE TYPE attachment_t AS (file varchar(500), original_name varchar(255), mime_type varchar(100),
                             size_bytes bigint);
```

## 3. Dziedziczenie

```sql
CREATE TABLE work_item (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    organization_id bigint NOT NULL REFERENCES organization,
    title           varchar(200) NOT NULL,
    description     text NOT NULL DEFAULT '',
    period          daterange,
    custom_fields   jsonb NOT NULL DEFAULT '{}',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE project (
    owner_id          bigint REFERENCES organization_member,
    status            project_status_t NOT NULL DEFAULT 'planned',
    hidden_status_ids bigint[] NOT NULL DEFAULT '{}'
) INHERITS (work_item);

CREATE TABLE task (
    project_id  bigint REFERENCES project,
    status_id   bigint NOT NULL REFERENCES task_status,
    priority    priority_t NOT NULL DEFAULT 3,
    checklist   checklist_item_t[] NOT NULL DEFAULT '{}',
    attachments attachment_t[] NOT NULL DEFAULT '{}'
    -- …
) INHERITS (work_item);
```

`SELECT * FROM work_item` zwraca wszystkie projekty, etapy i zadania jednym zapytaniem
(np. kalendarz terminów), a `SELECT * FROM ONLY work_item` – tylko wiersze rodzica.

**Ograniczenia dziedziczenia w PostgreSQL** (do omówienia w sprawozdaniu):

- `PRIMARY KEY`, `UNIQUE` i klucze obce **nie są dziedziczone** – trzeba je założyć w każdej tabeli potomnej.
- Klucz obcy do `work_item` nie widzi wierszy z `project` i `task` – dlatego komentarze i wydatki wskazują
  konkretne tabele potomne.
- Unikalność `id` w całej hierarchii zapewnia wspólna sekwencja, a nie ograniczenie.

## 4. Przykładowe zapytania

```sql
-- punkty checklisty zadania jako wiersze
SELECT t.id, ci.checklist_title, ci.element, ci.done_at
FROM task t, unnest(t.checklist) AS ci
WHERE t.id = 42;

-- odhaczenie punktu (podmiana elementu tablicy)
UPDATE task
SET checklist[2].done_at = now(), checklist[2].done_by_id = 7
WHERE id = 42;

-- grant nie może być przypisany do projektu w nakładających się okresach
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- porównanie "=" na liczbach w indeksie GiST
ALTER TABLE project_funding
    ADD EXCLUDE USING gist (project_id WITH =, funding_id WITH =, allocation WITH &&);

-- suma wydatków w walucie
SELECT (e.amount).currency, sum((e.amount).amount)
FROM expense e
WHERE e.project_id = 1
GROUP BY (e.amount).currency;

-- czy rola daje uprawnienie
SELECT EXISTS (SELECT 1 FROM role WHERE id = 3 AND permissions @> ARRAY['expense.create']);
```

## 5. Porównanie z modelem relacyjnym (wariant 1)

| Kryterium | Relacyjny | Obiektowo-relacyjny |
|---|---|---|
| Liczba tabel | 22 | 20 tabel + 9 typów |
| Powtarzane kolumny | kwota + waluta, okresy od–do w wielu tabelach | jeden typ (`money_t`, `daterange`) |
| Checklista, załączniki | osobne tabele, JOIN | tablica w wierszu zadania, `unnest` |
| Integralność elementów tablic | klucze obce | brak FK w tablicach – pilnuje aplikacja / trigger |
| Wspólne cechy projektu, etapu, zadania | powtórzone kolumny | dziedziczenie z `work_item` |
| Zgodność z ORM (Django) | pełna | częściowa – typy złożone i dziedziczenie wymagają `RunSQL` |
