# PRD – PROMT 2.0: warstwa danych (modele backendu)

| | |
|---|---|
| Produkt | PROMT – Plan • Run • Optimise Management Tool, wersja 2.0 |
| Zakres dokumentu | **wyłącznie modele danych backendu** (Django 5.2, PostgreSQL) – bez API, bez frontendu |
| Wersja dokumentu | 1.1 (robocza) |
| Właściciel | Marek Turkowicz |
| Zespół | Jakub Jakacki, Jakub Kazimiruk, Marek Turkowicz |
| Źródło prawdy | `docs/schemat/warianty/er-1-relacyjny.drawio` – wariant 1, 22 tabele, 53 relacje |
| Powiązane | `docs/wymagania.md` (FR/NFR), `docs/przypadki-uzycia/` (przypadki użycia) |

---

## 1. Cel i priorytet

Priorytetem bieżącego etapu jest **implementacja modeli danych** – 22 modeli Django odpowiadających
diagramowi wariantu 1, wraz z ograniczeniami bazy, walidacją i metodami domenowymi.

Implementacja modeli jest jednocześnie **weryfikacją projektu bazy**: przejście każdego przypadku użycia
przez modele pokaże, czy schemat zawiera wszystkie potrzebne dane i reguły, czy czegoś nie pominięto
na etapie projektowania. Wykryte braki trafiają do rejestru (rozdział 10) i – po decyzji zespołu – do
diagramu.

Kolejne etapy (poza tym dokumentem):
1. **Modele (ten dokument)** – schemat, ograniczenia, walidacja, testy modeli.
2. API REST – pełny backend testowalny bez interfejsu (np. `curl`, testy API).
3. Warianty badawcze – odwzorowanie tych samych modeli w bazie obiektowo-relacyjnej i MongoDB.

## 2. Zakres

### 2.1 W zakresie
- 22 modele zgodne z diagramem: pola, typy, NULL, wartości domyślne, klucze obce i `on_delete`,
- ograniczenia bazy: klucze główne, unikalności, CHECK, klucze złożone, indeksy,
- walidacja na poziomie modelu (`clean()`) dla reguł, których nie da się wyrazić ograniczeniem,
- metody domenowe modeli i menedżery (np. efektywne role, postęp, zaległość),
- migracje od zera (pusta baza),
- dane testowe (`seed`) i testy modeli.

### 2.2 Poza zakresem
- endpointy API, serializery, uwierzytelnianie HTTP,
- jakiekolwiek elementy interfejsu użytkownika,
- katalog uprawnień jako tabela (rola przechowuje listę kodów `permissions`),
- grupy projektowe, zatwierdzanie wydatków, preferencje powiadomień, osoby kontaktowe,
- automatyczne usuwanie starych powiadomień.

### 2.3 Zmiany względem obecnego kodu

Obecne modele w `backend/api/models/` są wersją pośrednią i nie odpowiadają diagramowi.
Etap modeli obejmuje ich przepisanie:

| Obecnie w kodzie | Wariant 1 (docelowo) |
|---|---|
| `UserProfile` (rola globalna) | usunięty → `OrganizationMember` + role |
| `TaskScope` | usunięty → kolumny kontekstu w `Task` |
| `FundingTask` | `TaskTemplate` |
| `Team`, `TeamMember` | `MemberGroup`, `MemberGroupMember` |
| `Permission`, `RolePermission` | usunięte → `Role.permissions` (lista kodów) |
| `Checklist` + `ChecklistItem` | tylko `ChecklistItem` z `checklist_title` |
| `Comment`, `Attachment`, `Expense`, `ActivityLog` z relacją generyczną (`content_type`) | zwykłe klucze obce zgodnie z diagramem |
| `Organization.slug`, `contact_email` | brak – pola zgodne z diagramem |
| `User` (logowanie e-mailem) | zostaje, zgodny z diagramem |

## 3. Zasady wspólne dla wszystkich modeli

- Nazwy tabel (`Meta.db_table`) i kolumn zgodne z diagramem (np. `user`, `organization_member`).
- Klucze główne `bigint` (`BigAutoField`); `MemberGroupMember` ma złożony klucz główny
  (`CompositePrimaryKey("group", "member")`).
- Każda reguła „dokładnie jedno z” jest ograniczeniem `CheckConstraint` w bazie, nie tylko walidacją.
- Znaczniki czasu: `created_at` = `auto_now_add`, `updated_at` / `modified_at` = `auto_now`.
- Typy specyficzne dla PostgreSQL (`JSONField`, `ArrayField`) są dozwolone, ale ich użycie jest opisane,
  bo wpływa na odwzorowanie w innych bazach.
- Usuwanie: domyślnie `PROTECT` dla danych biznesowych (projekt, finansowanie, zadanie z historią),
  `CASCADE` tylko dla elementów zależnych (punkt checklisty, przypisanie, wpis czasu).
- Typy pól podlegają mypy w trybie strict (django-stubs).

## 4. Modele – specyfikacja i kryteria akceptacji

Kolumny w tabelach są zgodne 1:1 z diagramem `er-1-relacyjny.drawio` (nazwy i NULL). Wiersze pisane kursywą
z oznaczeniem ⚠ **może brakuje** to propozycje uzupełnień – nie ma ich na diagramie i nie są implementowane
bez decyzji zespołu (zbiorczo w rejestrze, rozdział 10).

Oznaczenia kryteriów akceptacji (AK): weryfikowane testem modelu (pytest-django) – próbą zapisu
poprawnych i niepoprawnych danych. *IntegrityError* = odrzucenie przez bazę, *ValidationError* = przez
`full_clean()`.

### 4.1 Organizacja, ludzie i role

#### `User` – tabela `user`
Konto osoby; jedno niezależnie od liczby organizacji. Logowanie e-mailem.

| Pole | Typ | Uwagi |
|---|---|---|
| email | varchar, UNIQUE | zapisywany małymi literami |
| password | varchar | skrót hasła |
| first_name, last_name | varchar | |
| is_active, is_staff, is_superuser | bool | `is_active = false` – konto zablokowane |
| last_login | timestamptz NULL | |
| date_joined | timestamptz | |

- AK1: Dwa konta z adresem różniącym się wielkością liter → IntegrityError.
- AK2: `create_user` zapisuje skrót hasła; `check_password` działa, hasło jawne nie występuje w bazie.

#### `Organization` – tabela `organization`
Właściciel wszystkich danych poza kontem.

| Pole | Typ | Uwagi |
|---|---|---|
| name | varchar | |
| tax_id | varchar NULL | NIP, unikalny gdy podany |
| is_active | bool | `false` – organizacja zablokowana |
| settings | jsonb | strefa czasowa, waluta, nazwy 5 poziomów priorytetu |
| created_at, modified_at | timestamptz | |

- AK1: Dwie organizacje z tym samym NIP → IntegrityError; wiele organizacji bez NIP – dozwolone.
- AK2: `settings` jest walidowane schematem (Pydantic) – brak wymaganych kluczy → ValidationError.
- AK3: Zapis zmienia `modified_at`.

#### `OrganizationMember` – tabela `organization_member`
Członkostwo osoby w organizacji z danymi służbowymi.

| Pole | Typ | Uwagi |
|---|---|---|
| organization | FK → organization | PROTECT |
| user | FK → user | PROTECT |
| email, phone, job_title, avatar_url | varchar NULL | dane służbowe |
| status | varchar | invited / active / suspended / left (CHECK) |
| joined_at | timestamptz NULL | ustawiane przy przejściu na active |
| *invited_at* | *timestamptz NULL* | ⚠ **może brakuje** – brak na diagramie; bez niej nie wiadomo, kiedy wysłano zaproszenie (`joined_at` jest puste do przyjęcia) |

- AK1: Drugie członkostwo tej samej osoby w tej samej organizacji → IntegrityError.
- AK2: Status spoza listy → IntegrityError.
- AK3: Metoda `activate()` ustawia `status = active` i `joined_at`.
- AK4: Zawieszenie lub odejście ostatniego aktywnego administratora organizacji → ValidationError
  (reguła w metodzie zmiany statusu).

#### `MemberGroup` – tabela `member_group`
Grupa członków organizacji z hierarchią.

| Pole | Typ | Uwagi |
|---|---|---|
| organization | FK → organization NULL | PROTECT (patrz rejestr, pkt 1) |
| parent | FK → member_group NULL | SET_NULL |
| name | varchar | unikalna w organizacji |
| description | text NULL | |
| created_at | timestamptz | |

- AK1: Dwie grupy o tej samej nazwie w organizacji → IntegrityError.
- AK2: Grupa nadrzędna wskazująca samą siebie lub tworząca cykl → ValidationError.
- AK3: Grupa nadrzędna z innej organizacji → ValidationError.
- AK4: Metoda `ancestors()` zwraca wszystkie grupy nadrzędne (do korzenia).

#### `MemberGroupMember` – tabela `member_group_member`
Przynależność członka do grupy (M:N). Klucz główny złożony (group, member).

| Pole | Typ | Uwagi |
|---|---|---|
| group | FK → member_group, PK | CASCADE |
| member | FK → organization_member, PK | CASCADE |
| added_at | timestamptz | |

- AK1: Ponowne dodanie tej samej osoby do grupy → IntegrityError.
- AK2: Członek z innej organizacji niż grupa → ValidationError.

#### `Role` – tabela `role`
Nazwany zestaw uprawnień.

| Pole | Typ | Uwagi |
|---|---|---|
| organization | FK → organization | CASCADE |
| name | varchar | unikalna w organizacji |
| permissions | varchar[] | kody uprawnień |

- AK1: Dwie role o tej samej nazwie w organizacji → IntegrityError.
- AK2: Kod spoza stałej listy w kodzie (`Permission` jako `TextChoices`) → ValidationError.

#### `RoleAssignment` – tabela `role_assignment`
Nadanie roli osobie albo grupie, w organizacji albo w projekcie.

| Pole | Typ | Uwagi |
|---|---|---|
| role | FK → role | CASCADE |
| member | FK → organization_member NULL | CASCADE |
| group | FK → member_group NULL | CASCADE |
| project | FK → project NULL | CASCADE; NULL = cała organizacja |
| created_at, updated_at | timestamptz | |

- AK1: Wypełnione oba lub żadne z (member, group) → IntegrityError (CHECK „dokładnie jedno”).
- AK2: Duplikat nadania (ta sama rola, podmiot i projekt, także z NULL) → IntegrityError
  (`UniqueConstraint(nulls_distinct=False)`).
- AK3: Rola, osoba, grupa i projekt z różnych organizacji → ValidationError.
- AK4: `OrganizationMember.effective_roles(project=None)` zwraca role własne, grup i grup nadrzędnych,
  z poziomu organizacji i podanego projektu – jednym zapytaniem do bazy.

### 4.2 Statusy

#### `TaskStatus` – tabela `task_status`
Status zadania organizacji albo projektu z jedną z 4 stałych kategorii.

| Pole | Typ | Uwagi |
|---|---|---|
| organization | FK → organization | CASCADE |
| project | FK → project NULL | CASCADE; NULL = status całej organizacji |
| category | varchar | todo / in_progress / done / cancelled (CHECK) |
| name | varchar | unikalna w (organizacja, projekt) |
| color | varchar | format `#RRGGBB` |
| position | smallint | kolejność |
| is_default, is_active | bool | |

- AK1: Kategoria spoza listy → IntegrityError.
- AK2: Dwa statusy o tej samej nazwie w tej samej organizacji i projekcie → IntegrityError.
- AK3: Drugi status domyślny w organizacji → IntegrityError (unikalność częściowa
  `WHERE is_default AND project_id IS NULL`).
- AK4: Usunięcie statusu, w którym są zadania → ProtectedError (`Task.status` z PROTECT).
- AK5: Status projektu z organizacji innej niż organizacja projektu → ValidationError.

### 4.3 Projekty i finansowanie

#### `Project` – tabela `project`

| Pole | Typ | Uwagi |
|---|---|---|
| organization | FK → organization | PROTECT |
| owner | FK → organization_member | PROTECT |
| name | varchar | |
| description | text | |
| status | varchar | lista stała (CHECK), np. planned / active / closed / cancelled / archived |
| start_date, end_date | date NULL | |
| hidden_status_ids | bigint[] | statusy organizacji ukryte w projekcie |
| created_at, updated_at | timestamptz | |

- AK1: `end_date < start_date` → IntegrityError.
- AK2: Właściciel z innej organizacji → ValidationError.
- AK3: `hidden_status_ids` może zawierać tylko statusy organizacji projektu, w których nie ma zadań
  projektu → ValidationError.
- AK4: `visible_statuses()` zwraca statusy organizacji bez ukrytych + statusy projektu, wg `position`.
- AK5: Usunięcie projektu z zadaniami, wydatkami lub finansowaniem → ProtectedError.

#### `Milestone` – tabela `milestone`

| Pole | Typ | Uwagi |
|---|---|---|
| project | FK → project | CASCADE |
| name | varchar | |
| status | varchar | lista stała (CHECK) |
| due_date | date NULL | |
| position | smallint | |
| created_at, updated_at | timestamptz | |

- AK1: `progress()` = odsetek zadań etapu w kategorii done, z pominięciem cancelled; 0 dla etapu bez zadań.

#### `Funding` – tabela `funding`

| Pole | Typ | Uwagi |
|---|---|---|
| organization | FK → organization | PROTECT |
| type, name, funder, program, agreement_number | varchar | |
| amount_total | numeric(14,2) | > 0 (CHECK) |
| currency | char(3) | 3 wielkie litery (CHECK) |
| start_date, end_date, reporting_deadline | date NULL | `end_date ≥ start_date` (CHECK) |
| description | text | |
| created_at | timestamptz | |

- AK1: Kwota ≤ 0 lub niepoprawna waluta → IntegrityError.

#### `ProjectFunding` – tabela `project_funding`
Powiązanie projektu z finansowaniem (M:N z danymi).

| Pole | Typ | Uwagi |
|---|---|---|
| project | FK → project | PROTECT |
| funding | FK → funding | PROTECT |
| allocation_start, allocation_end | date NULL | `end ≥ start` (CHECK) |
| is_primary | bool | najwyżej jedno główne na projekt |
| note | text | |
| created_at | timestamptz | |

- AK1: Ta sama para projekt–finansowanie drugi raz → IntegrityError.
- AK2: Drugie finansowanie główne projektu → IntegrityError (unikalność częściowa `WHERE is_primary`).
- AK3: Projekt i finansowanie z różnych organizacji → ValidationError.
- AK4: Para (id, project_id) jest unikalna – cel złożonego klucza obcego z `Task`.

#### `TaskTemplate` – tabela `task_template`
Szablon zadania wymaganego przez finansowanie.

| Pole | Typ | Uwagi |
|---|---|---|
| funding | FK → funding | CASCADE |
| title | varchar | |
| description | text | |
| default_status | FK → task_status NULL | SET_NULL |
| default_priority | smallint | 1–5 (CHECK) |
| default_est_hours | numeric(6,2) NULL | > 0 |
| default_due_days | int NULL | ≥ 0 |
| mandatory | bool | |

- AK1: Priorytet spoza 1–5 → IntegrityError.
- AK2: Metoda serwisowa `ProjectFunding.create_tasks_from_templates()` tworzy po jednym zadaniu na szablon
  (`template`, `project`, `project_funding`, status szablonu albo domyślny organizacji, termin = początek
  alokacji + `default_due_days`) – w jednej transakcji; błąd przy dowolnym zadaniu wycofuje wszystkie.
- AK3: Zmiana szablonu po utworzeniu zadań nie zmienia tych zadań.

### 4.4 Zadania

#### `Task` – tabela `task`

| Pole | Typ | Uwagi |
|---|---|---|
| project | FK → project NULL | PROTECT |
| funding | FK → funding NULL | PROTECT |
| project_funding | FK → project_funding NULL | PROTECT; zgodny z projektem |
| milestone | FK → milestone NULL | SET_NULL |
| parent | FK → task NULL | CASCADE (podzadania) |
| template | FK → task_template NULL | SET_NULL |
| status | FK → task_status | PROTECT |
| group | FK → member_group NULL | SET_NULL |
| title | varchar | |
| description | text | |
| priority | smallint | 1–5 (CHECK) |
| start_date, due_date | date NULL | `due ≥ start` (CHECK) |
| est_hours | numeric(6,2) NULL | > 0 |
| created_at, updated_at | timestamptz | |
| *created_by* | *FK → organization_member* | ⚠ **może brakuje** – brak na diagramie; bez niej autor zadania jest znany tylko z dziennika zdarzeń |

- AK1: Wypełnione oba lub żadne z (project, funding) → IntegrityError.
- AK2: `project_funding` należący do innego projektu → IntegrityError (złożony klucz obcy
  `(project_funding_id, project_id) → project_funding(id, project_id)`; w Django jako ograniczenie
  dodane migracją `RunSQL`, bo ORM nie obsługuje złożonych FK).
- AK3: Priorytet spoza 1–5 → IntegrityError.
- AK4: Etap z innego projektu, status niewidoczny w projekcie, grupa z innej organizacji, zadanie
  nadrzędne z innego projektu lub cykl podzadań → ValidationError.
- AK5: `is_overdue` = termin minął, a kategoria statusu to todo lub in_progress.
- AK6: Menedżer `Task.objects.for_member(member)` zwraca zadania przypisane do osoby we wszystkich
  projektach jej organizacji („Moje zadania”).
- AK7: Usunięcie zadania z szablonu obowiązkowego bez uzasadnienia → ValidationError (metoda
  `delete_with_reason(reason, actor)` zapisuje uzasadnienie w dzienniku zdarzeń).

#### `TaskAssignment` – tabela `task_assignment`

| Pole | Typ | Uwagi |
|---|---|---|
| task | FK → task | CASCADE |
| member | FK → organization_member | PROTECT |
| assigned_by | FK → organization_member NULL | SET_NULL |
| assigned_at | timestamptz | |
| started_at, finished_at | timestamptz NULL | `finished ≥ started` (CHECK) |

- AK1: Ta sama osoba przypisana drugi raz do zadania → IntegrityError.
- AK2: Osoba spoza organizacji zadania lub nieaktywna → ValidationError.
- AK3: `start()` i `finish()` ustawiają odpowiednie pola; `finish()` przed `start()` → ValidationError.

#### `TimeEntry` – tabela `time_entry`

| Pole | Typ | Uwagi |
|---|---|---|
| assignment | FK → task_assignment | PROTECT |
| hours | numeric(5,2) | > 0 (CHECK) |
| started_at | timestamptz | |
| finished_at | timestamptz NULL | > started_at (CHECK) |
| note | text NULL | |
| created_at, updated_at | timestamptz | |

- AK1: Godziny ≤ 0 lub koniec przed początkiem → IntegrityError.
- AK2: Wpis czasu istnieje tylko w ramach przypisania – osoba nieprzypisana do zadania nie ma przypisania,
  więc nie może mieć wpisu (wymuszone strukturą).
- AK3: Raport: suma godzin dla zadania, projektu i finansowania jednym zapytaniem agregującym.

#### `ChecklistItem` – tabela `checklist_item`

| Pole | Typ | Uwagi |
|---|---|---|
| task | FK → task | CASCADE |
| checklist_title | varchar NULL | grupuje punkty |
| element | varchar | treść punktu |
| order | smallint | kolejność (`order` – słowo zastrzeżone, patrz rejestr pkt 6) |
| assignee | FK → organization_member NULL | SET_NULL |
| done_by | FK → organization_member NULL | SET_NULL |
| done_at | timestamptz NULL | |
| updated_at | timestamptz | |
| *created_at* | *timestamptz* | ⚠ **może brakuje** – brak na diagramie; pozostałe tabele mają `created_at`, punkt checklisty tylko `updated_at` |

- AK1: `done_by` i `done_at` wypełnione oba albo żadne → IntegrityError.
- AK2: `toggle(member)` odhacza lub cofa odhaczenie.
- AK3: `Task.checklist_progress()` zwraca (zrobione, wszystkie).

### 4.5 Współpraca, koszty i historia

#### `Comment` – tabela `comment`

| Pole | Typ | Uwagi |
|---|---|---|
| task | FK → task NULL | CASCADE |
| project | FK → project NULL | CASCADE |
| author | FK → organization_member | PROTECT |
| parent | FK → comment NULL | CASCADE |
| content | text | niepusty |
| created_at, updated_at | timestamptz | |

- AK1: Wypełnione oba lub żadne z (task, project) → IntegrityError.
- AK2: Odpowiedź dotycząca innego obiektu niż komentarz nadrzędny → ValidationError.

#### `Attachment` – tabela `attachment`

| Pole | Typ | Uwagi |
|---|---|---|
| task | FK → task NULL | CASCADE |
| comment | FK → comment NULL | CASCADE |
| expense | FK → expense NULL | CASCADE |
| uploaded_by | FK → organization_member | PROTECT |
| file | varchar | ścieżka w magazynie plików |
| original_name, mime_type | varchar | |
| size_bytes | bigint | > 0 i ≤ limit (CHECK) |
| created_at | timestamptz | |

- AK1: Wypełnione inne niż dokładnie jedno z (task, comment, expense) → IntegrityError.
- AK2: Typ MIME spoza listy dozwolonych → ValidationError.

#### `Expense` – tabela `expense`

| Pole | Typ | Uwagi |
|---|---|---|
| project | FK → project NULL | PROTECT |
| project_funding | FK → project_funding NULL | PROTECT |
| task | FK → task NULL | SET_NULL |
| type | varchar | lista stała (CHECK) |
| amount | numeric(14,2) | > 0 (CHECK) |
| currency | char(3) | |
| spent_on | date | |
| document_number | varchar NULL | |
| description | text | |
| created_by | FK → organization_member | PROTECT |
| created_at | timestamptz | |

- AK1: Wypełnione oba lub żadne z (project, project_funding) → IntegrityError.
- AK2: Kwota ≤ 0 → IntegrityError.
- AK3: Zadanie z innego projektu niż wydatek → ValidationError.
- AK4: Raport budżetu: kwota finansowania, suma wydatków i różnica dla finansowania i projektu.

#### `ActivityLog` – tabela `activity_log`
Dziennik zdarzeń; tylko dopisywanie.

| Pole | Typ | Uwagi |
|---|---|---|
| organization | FK → organization | PROTECT |
| actor | FK → organization_member NULL | SET_NULL; NULL = system |
| entity_type | varchar | task / project / … (CHECK) |
| entity_id | bigint | bez klucza obcego |
| action | varchar | np. status_changed, assigned, role_granted |
| changes | jsonb | `{pole: [stara, nowa]}` |
| created_at | timestamptz | |

- AK1: Próba aktualizacji lub usunięcia wpisu przez model → wyjątek (nadpisane `save()` dla istniejących
  rekordów i `delete()`).
- AK2: Zmiana statusu zadania, przypisanie, nadanie i odebranie roli, zmiana statusu członka i zmiana
  wydatku tworzą wpis (sygnały lub metody serwisowe) – w tej samej transakcji co zmiana.
- AK3: Indeksy: (entity_type, entity_id, created_at) i (organization_id, created_at).

#### `Notification` – tabela `notification`

| Pole | Typ | Uwagi |
|---|---|---|
| activity | FK → activity_log NULL | CASCADE; NULL = przypomnienie systemowe |
| recipient | FK → user | CASCADE |
| content | jsonb NULL | tytuł, treść, link |
| read_at | timestamptz NULL | |
| *created_at* | *timestamptz* | ⚠ **może brakuje** – brak na diagramie; bez niej nie da się sortować powiadomień po czasie (przypomnienia nie mają wpisu w dzienniku) ani usuwać starych |

- AK1: Zdarzenie dotyczące zadania tworzy powiadomienia dla przypisanych osób i członków grupy zadania,
  bez autora zmiany.
- AK2: Ta sama para (activity, recipient) drugi raz → IntegrityError.
- AK3: `mark_read()` ustawia `read_at`; menedżer `unread_for(user)` z indeksem częściowym
  `WHERE read_at IS NULL`.

## 5. Funkcjonalności (procesy obejmujące kilka modeli)

Procesy realizowane jako metody serwisowe warstwy modeli (np. `api/services/`), każdy w jednej transakcji
(`transaction.atomic`). Kryteria akceptacji sprawdzane testami na modelach, bez API.

### P1. Podpięcie finansowania do projektu tworzy zadania z szablonów
Modele: `ProjectFunding`, `TaskTemplate`, `Task`, `TaskStatus`, `ActivityLog`.

Co ma się zadziać:
1. Powstaje `ProjectFunding` (projekt, finansowanie, okres alokacji, flaga głównego).
2. Dla **każdego** szablonu `TaskTemplate` tego finansowania powstaje jedno zadanie `Task`:
   - `project` = projekt, `project_funding` = nowe powiązanie, `template` = szablon,
   - `title`, `description`, `priority`, `est_hours` skopiowane z szablonu,
   - `status` = `default_status` szablonu, a gdy go brak – status domyślny organizacji,
   - `due_date` = `allocation_start` + `default_due_days` (puste, gdy brak którejś wartości),
   - `start_date` = `allocation_start`.
3. W dzienniku zdarzeń powstaje wpis o podpięciu finansowania z liczbą utworzonych zadań.

Kryteria akceptacji:
- AK1: Finansowanie z 3 szablonami podpięte do projektu → w projekcie powstają dokładnie 3 zadania
  z wypełnionym `template_id` i `project_funding_id`.
- AK2: Termin zadania = początek alokacji + `default_due_days` szablonu.
- AK3: Szablon bez statusu domyślnego → zadanie dostaje status domyślny organizacji.
- AK4: Błąd przy tworzeniu dowolnego zadania (np. brak statusu domyślnego) → nie powstaje ani powiązanie,
  ani żadne zadanie (wycofanie całości).
- AK5: Ponowne podpięcie tego samego finansowania do projektu → odrzucone, bez duplikatów zadań.
- AK6: Zmiana szablonu po podpięciu nie zmienia utworzonych zadań; nowy szablon dodany później nie tworzy
  zadań w już podpiętych projektach.
- AK7: Odpięcie finansowania (usunięcie `ProjectFunding`) z zadaniami lub wydatkami → odrzucone (PROTECT).

### P2. Założenie organizacji
Modele: `Organization`, `TaskStatus`, `Role`, `OrganizationMember`, `RoleAssignment`.

Co ma się zadziać: powstaje organizacja, domyślne statusy (co najmniej po jednym w każdej z 4 kategorii,
jeden domyślny), domyślne role (np. administrator organizacji, project manager, członek, obserwator),
członkostwo twórcy ze statusem `active` i nadanie mu roli administratora organizacji.

- AK1: Po wywołaniu istnieją statusy we wszystkich 4 kategoriach i dokładnie jeden domyślny.
- AK2: Twórca ma aktywne członkostwo i rolę administratora w całej organizacji (`project` puste).
- AK3: Błąd w dowolnym kroku → organizacja nie powstaje.

### P3. Zaproszenie, przyjęcie i zmiana statusu członka
Modele: `OrganizationMember`, `RoleAssignment`, `ActivityLog`.

Co ma się zadziać: zaproszenie tworzy członkostwo `invited`; przyjęcie zmienia je na `active`
i ustawia `joined_at`; zawieszenie (`suspended`) lub odejście (`left`) odbiera dostęp do danych organizacji.
Każda zmiana statusu zapisuje wpis w dzienniku zdarzeń.

- AK1: Zaproszenie osoby, która ma już członkostwo w tej organizacji → odrzucone.
- AK2: Po przyjęciu `status = active` i `joined_at` ustawione.
- AK3: Zawieszenie ostatniego aktywnego administratora organizacji → odrzucone.
- AK4: Członek `suspended` / `left` nie jest zwracany przez menedżery danych organizacji
  (`for_organization`) jako aktywny uczestnik i nie może zostać przypisany do zadania.

### P4. Nadanie roli i wyliczenie uprawnień
Modele: `Role`, `RoleAssignment`, `MemberGroup`, `MemberGroupMember`, `ActivityLog`.

Co ma się zadziać: rola jest nadawana osobie albo grupie, w organizacji albo w projekcie. Efektywne role
osoby w projekcie = role własne + role jej grup + role grup nadrzędnych, z poziomu organizacji i projektu.

- AK1: Osoba w podgrupie dziedziczy rolę nadaną grupie nadrzędnej.
- AK2: Rola nadana w projekcie A nie działa w projekcie B.
- AK3: `has_permission(member, code, project)` zwraca prawdę, gdy kod jest w którejkolwiek efektywnej
  roli; wyliczenie wykonuje jedno zapytanie.
- AK4: Nadanie i odebranie roli tworzy wpis w dzienniku zdarzeń.

### P5. Zmiana statusu zadania z historią i powiadomieniami
Modele: `Task`, `TaskStatus`, `ActivityLog`, `Notification`, `TaskAssignment`, `MemberGroupMember`.

Co ma się zadziać: zadanie dostaje nowy status widoczny w projekcie; powstaje wpis w dzienniku
(`action = status_changed`, `changes = {status: [stary, nowy]}`); dla każdej osoby przypisanej i każdego
członka grupy zadania (bez autora zmiany) powstaje powiadomienie powiązane z wpisem.

- AK1: Zmiana na status ukryty w projekcie lub z innej organizacji → odrzucona.
- AK2: Po zmianie istnieje dokładnie jeden wpis w dzienniku i po jednym powiadomieniu na odbiorcę.
- AK3: Autor zmiany nie dostaje powiadomienia; osoba będąca jednocześnie przypisaną i członkiem grupy
  dostaje jedno powiadomienie.
- AK4: Błąd przy tworzeniu powiadomień → status zadania nie zmienia się.

### P6. Przekazanie zadania grupie, wzięcie z puli i praca nad zadaniem
Modele: `Task`, `MemberGroupMember`, `TaskAssignment`, `TimeEntry`.

Co ma się zadziać: zadanie z ustawioną grupą jest w puli grupy; członek grupy bierze je, co tworzy
jego przypisanie; osoba przypisana rozpoczyna i kończy pracę (`started_at`, `finished_at`) i rejestruje
czas pracy w ramach swojego przypisania.

- AK1: Wzięcie zadania przez osobę spoza grupy → odrzucone.
- AK2: Wzięcie tworzy `TaskAssignment` z `assigned_by` = biorący.
- AK3: Wpis czasu możliwy tylko z istniejącym przypisaniem; suma godzin zadania = suma wpisów.

### P7. Ukrycie statusu organizacji w projekcie
Modele: `Project`, `TaskStatus`, `Task`.

- AK1: Ukrycie dopisuje identyfikator do `hidden_status_ids`; status znika z `visible_statuses()` projektu.
- AK2: Ukrycie statusu, w którym są zadania projektu → odrzucone.
- AK3: Ukryć można tylko status organizacji projektu (nie status innego projektu).

### P8. Rejestracja wydatku z dokumentem
Modele: `Expense`, `Attachment`, `ActivityLog`.

- AK1: Wydatek rozliczany z finansowania projektu wskazuje `project_funding`, a nie `project`.
- AK2: Wydatek z załączonym skanem – załącznik wskazuje tylko `expense`.
- AK3: Raport budżetu finansowania: kwota finansowania − suma wydatków z jego powiązań z projektami.
- AK4: Dodanie i zmiana wydatku tworzą wpis w dzienniku zdarzeń.

### P9. Usunięcie zadania obowiązkowego
Modele: `Task`, `TaskTemplate`, `ActivityLog`.

- AK1: Usunięcie zadania utworzonego z szablonu obowiązkowego bez uzasadnienia → odrzucone.
- AK2: Z uzasadnieniem → zadanie usunięte, w dzienniku wpis z uzasadnieniem i tytułem zadania.

### P10. Przypomnienia o terminach
Modele: `Task`, `TaskAssignment`, `Notification`.

- AK1: Dla zadań z terminem jutro lub przekroczonym (kategoria todo / in_progress) każda przypisana osoba
  dostaje powiadomienie z pustym `activity`.
- AK2: Ponowne uruchomienie tego samego dnia nie tworzy duplikatów. ⚠ Wymaga `notification.created_at` (może brakuje, rejestr pkt 2) –
  bez niej duplikat da się wykryć tylko po treści `content`.

## 6. Reguły międzymodelowe (izolacja organizacji)

Każdy obiekt należy pośrednio lub bezpośrednio do jednej organizacji. Model nie może łączyć obiektów
z różnych organizacji.

- AK1: Dla każdej pary powiązanych modeli istnieje test, który próbuje połączyć obiekty z dwóch
  organizacji i otrzymuje ValidationError (np. zadanie organizacji A ze statusem organizacji B).
- AK2: Menedżery modeli udostępniają `for_organization(org)` filtrujące dane jednej organizacji.

## 7. Weryfikacja kompletności modelu (przypadki użycia → modele)

Każdy przypadek użycia z `docs/przypadki-uzycia/` musi dać się zrealizować na modelach – w teście
lub w powłoce Django (`manage.py shell`).

| Obszar przypadków użycia | Modele | Test kompletności |
|---|---|---|
| Konto, zmiana organizacji, profil | User, OrganizationMember | utworzenie konta, członkostw w 2 organizacjach, lista organizacji osoby |
| Członkowie, zaproszenia, statusy | OrganizationMember | zaproś → przyjmij → zawieś; ochrona ostatniego admina |
| Grupy i role | MemberGroup, MemberGroupMember, Role, RoleAssignment | hierarchia 3 grup, role na każdym poziomie, `effective_roles` |
| Statusy i Kanban | TaskStatus, Project | statusy organizacji i projektu, ukrycie, `visible_statuses` |
| Projekty i etapy | Project, Milestone | projekt z etapami, postęp etapu |
| Finansowanie i szablony | Funding, ProjectFunding, TaskTemplate, Task | podpięcie → zadania z szablonów, rollback przy błędzie |
| Zadania, przypisania, pula grupy | Task, TaskAssignment | podzadanie, przekazanie grupie, wzięcie z puli, start/koniec pracy, zaległość |
| Checklisty | ChecklistItem | dwie checklisty w zadaniu, odhaczanie, postęp |
| Czas pracy | TimeEntry | wpis w przypisaniu, karta tygodnia, raport czasu |
| Wydatki | Expense, Attachment | wydatek projektu i finansowania, skan, raport budżetu |
| Komentarze i załączniki | Comment, Attachment | wątek odpowiedzi, załącznik do komentarza |
| Historia i powiadomienia | ActivityLog, Notification | zmiana statusu → wpis + powiadomienia; przypomnienie bez wpisu |
| Administracja | User, Organization | blokada konta i organizacji |

Każdy brak wykryty w tej weryfikacji jest dopisywany do rejestru (rozdział 10) z propozycją zmiany
diagramu.

## 8. Wymagania niefunkcjonalne warstwy danych

| ID | Wymaganie | Kryterium akceptacji |
|---|---|---|
| D-1 | Zgodność z diagramem | `migrate` na pustej bazie tworzy dokładnie 22 tabele domenowe; nazwy tabel i kolumn zgodne z diagramem (test porównujący `information_schema` z listą wzorcową) |
| D-2 | Spójność w bazie | każda reguła „dokładnie jedno z”, zakres i unikalność jest ograniczeniem bazy; dla każdej istnieje test łamiący ją przez `bulk_create` lub SQL (z pominięciem `clean()`) |
| D-3 | Transakcje | operacje wieloetapowe (zadania z szablonów, zmiana z historią i powiadomieniami) w `transaction.atomic`; test z wymuszonym błędem nie zostawia częściowych danych |
| D-4 | Indeksy | indeksy pod operacje referencyjne: Kanban (project, status), „Moje zadania” (member), historia obiektu, nieprzeczytane powiadomienia; `EXPLAIN` bez skanu sekwencyjnego dla zbioru 100 000 zadań |
| D-5 | Wydajność modeli | `effective_roles` – 1 zapytanie; lista zadań projektu z przypisaniami i statusem – stała liczba zapytań (`select_related` / `prefetch_related`), test `django_assert_num_queries` |
| D-6 | Dane testowe | `manage.py seed --orgs N --tasks M --seed S` tworzy deterministyczny zbiór spełniający wszystkie ograniczenia |
| D-7 | Jakość | mypy strict i ruff bez błędów dla `api/models`; pokrycie testami modeli ≥ 80% |
| D-8 | Przenośność | lista miejsc zależnych od PostgreSQL (`ArrayField`, `JSONField`, indeksy częściowe, złożony FK) w docstringach modeli – wejście do wariantów obiektowo-relacyjnego i MongoDB |

## 9. Plan etapu modeli

| Krok | Zakres | Ukończone gdy |
|---|---|---|
| 1 | Usunięcie obecnych modeli pośrednich, przygotowanie pustej bazy | brak migracji poza `__init__.py`, serwer startuje |
| 2 | Obszar 4.1 – organizacja, ludzie, role | AK z 4.1 zielone |
| 3 | Obszar 4.2–4.3 – statusy, projekty, finansowanie | AK z 4.2–4.3 zielone |
| 4 | Obszar 4.4 – zadania, przypisania, czas, checklisty | AK z 4.4 zielone |
| 5 | Obszar 4.5 – współpraca, koszty, historia | AK z 4.5 zielone |
| 6 | Procesy, reguły międzymodelowe i weryfikacja kompletności | rozdziały 5–7 zielone, rejestr braków uzupełniony |
| 7 | Seed i indeksy | D-4, D-6 spełnione |

Odpowiada kamieniowi milowemu **M1 – Data model** na GitHubie.

## 10. Rejestr braków i otwartych kwestii schematu

| # | Kwestia | Wpływ | Propozycja |
|---|---|---|---|
| 1 | `member_group.organization_id` jest NULL, a grupy projektowe są poza zakresem | grupa bez organizacji nie ma sensu | NOT NULL |
| 2 | `notification` bez daty utworzenia (może brakuje) | brak sortowania i retencji przypomnień | dodać `created_at` |
| 3 | `organization_member.user_id` wymagane | zaproszenie tylko dla osób z kontem | akceptujemy w 2.0 |
| 4 | `task` bez autora (może brakuje) | brak „własnych” zadań; autor tylko w dzienniku | akceptujemy albo dodać `created_by_id` |
| 10 | `organization_member` bez daty zaproszenia (może brakuje) | brak informacji, kiedy wysłano zaproszenie | dodać `invited_at` |
| 11 | `checklist_item` bez `created_at` (może brakuje) | niespójność z pozostałymi tabelami | dodać `created_at` |
| 5 | `role.permissions` jako lista kodów | brak kontroli kodów w bazie | walidacja w modelu; tabela w kolejnej wersji |
| 6 | `checklist_item.order` – słowo zastrzeżone SQL | konieczne cytowanie w ręcznym SQL | pole `order` z `db_column="order"` albo zmiana na `sort_order` |
| 7 | złożony FK `task → project_funding` | nieobsługiwany przez ORM | ograniczenie przez `RunSQL` w migracji |
| 8 | `project.hidden_status_ids` jako tablica | brak FK do statusów | walidacja w modelu |
| 9 | `activity_log.entity_id` bez FK | wpis może wskazywać usunięty obiekt | akceptujemy – historia ma przetrwać usunięcie |

## 11. Definition of Done (model)

Model jest ukończony, gdy:
- pola, typy, NULL i nazwy są zgodne z diagramem,
- wszystkie jego kryteria akceptacji mają testy i przechodzą,
- ograniczenia są w migracji (sprawdzone w bazie, nie tylko w `clean()`),
- przechodzi mypy strict i ruff,
- zmiana diagramu (jeśli była potrzebna) jest wpisana do rejestru i uzgodniona w zespole.

---

## Aneks A. Django czy FastAPI

**Rekomendacja: zostać przy Django na etapie modeli i API wariantu relacyjnego.**

- Etap modeli korzysta z mocnych stron Django: migracje, ograniczenia (`CheckConstraint`,
  `UniqueConstraint(nulls_distinct=False)`, `CompositePrimaryKey` w 5.2), panel administracyjny do
  podglądu danych, pytest-django. W FastAPI trzeba by to złożyć z SQLAlchemy i Alembic od zera.
- Zmiana frameworka nie rozwiązuje problemu wielu baz. ORM Django nie obsługuje typów obiektowych
  PostgreSQL ani MongoDB, ale SQLAlchemy też nie obsługuje MongoDB. W obu przypadkach warianty
  obiektowo-relacyjny i dokumentowy wymagają osobnej warstwy dostępu (psycopg z ręcznym SQL, PyMongo).
- Właściwym rozwiązaniem jest **warstwa repozytoriów** (jeden interfejs operacji, trzy implementacje),
  niezależna od frameworka. Django jest wtedy tylko jednym z miejsc wywołania.
- FastAPI warto rozważyć dopiero przy wariantach badawczych, jeśli okaże się, że cykl żądania Django
  (middleware, ORM, sesje) zaburza pomiary – wtedy lekka aplikacja FastAPI może wywoływać te same
  repozytoria. Decyzja przy przejściu do etapu 3 (rozdział 1).
