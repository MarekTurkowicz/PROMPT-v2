# Analiza: sprawozdanie – PRD – implementacja modeli

| | |
|---|---|
| Data | 2026-10-24 |
| Branch | `feat/new_db_model`, commit `f64dad4` („Feat: new db type”) |
| Porównane źródła | sprawozdanie Ps1-2 (wersja final, PDF z 24.10), `docs/PRD-promt-2.0.md` (wersja 1.1), `docs/wymagania.md`, `docs/przypadki-uzycia/`, `docs/schemat/warianty/er-1-relacyjny.drawio`, `backend/api/models/` |
| Charakter | tylko analiza – nic w kodzie nie zostało zmienione |

## 1. Podsumowanie

- **Kod ↔ diagram wariantu 1: zgodne 1:1.** 22 tabele, 189 kolumn – nazwy i NULL bez różnic (porównanie skryptem).
- **Kod ↔ PRD:** struktura i ograniczenia prawie zgodne (45 ograniczeń CHECK/UNIQUE + złożony FK). Brakuje całej logiki:
  `clean()`, metod domenowych, menedżerów i serwisów P1–P10.
- **Bloker:** branch się nie uruchamia – reszta aplikacji importuje usunięte modele (rozdz. 4.1).
- **Schemat:** 9 braków blokujących wymagania M/S (rozdz. 6.1) i 5 poprawek z zakresu dobrych praktyk (rozdz. 6.2).
  Każdy z nich to też zmiana diagramu, więc trafia do rejestru braków PRD (rozdz. 10).

## 2. Sprawozdanie ↔ PRD ↔ wymagania

| # | Rozbieżność | Propozycja |
|---|---|---|
| S1 | Sprawozdanie przeczy samo sobie: str. 20–21 opisują wariant III jako agregację do jsonb (17 tabel), a porównanie na str. 22 nadal opisuje starą wersję („wspólne encje nadrzędne… dodatkowa warstwa zależności”). Tytuł „model uogólniony – szybki dostęp” też pochodzi ze starej wersji; README wariantów nazywa go „model zagregowany”. | przepisać zdanie o wariancie III w porównaniu i tytuł |
| S2 | Wydajność: sprawozdanie ±1 mln rekordów; PRD D-4 mierzy na 100 000 zadań; `wymagania.md` NFR-SCAL-01 – 100 organizacji i 100 000 zadań. | ujednolicić: albo test na 1 mln (seed z D-6 to umożliwia), albo w sprawozdaniu podać to, co zostanie zmierzone |
| S3 | Sprawozdanie: „nadawanie uprawnień na poziomie całej organizacji”, a z akapitu o oddzieleniu roli od profilu usunięto „i projektu”. PRD, diagram, kod i FR-ACC-05 mają role także w projekcie (`role_assignment.project_id`); lista obszarów w samym sprawozdaniu też („organizacji lub projektu”). | poprawić sprawozdanie |
| S4 | Sprawozdanie od początku obiecuje oddzielenie logiki biznesowej od dostępu do danych. PRD odkłada warstwę repozytoriów do etapu 3 (Aneks A), a procesy P1–P10 umieszcza w `api/services/` bezpośrednio na ORM – ten kod trzeba będzie przepisać. | dopisać w PRD §5: funkcje serwisowe nie przyjmują ani nie zwracają `QuerySet` (to przyszły interfejs repozytorium) |
| S5 | „Przeglądanie aktywności w projekcie” (sprawozdanie, FR-HIST-02) – w schemacie brak: `activity_log` nie ma `project_id`. Luka we wszystkich trzech dokumentach. | patrz A5 |
| S6 | Grupy projektowe: FR-ACC-03 (M) „admin projektu tworzy grupy projektowe”, FR-PRJ-06 (S) pokazuje je w widoku zespołu, a PRD 2.2 wyciął je z zakresu. FR-ORG-02 każe tworzyć „grupę administratorów”, a P2 w PRD jej nie wymienia. | decyzja zespołu: dodać `member_group.project_id` albo obniżyć FR-ACC-03 |

## 3. Sprzeczności wewnątrz PRD

| # | Miejsce | Problem |
|---|---|---|
| W1 | §3 vs `TimeEntry` | §3: „CASCADE dla wpisu czasu”, tabela `TimeEntry.assignment`: PROTECT (kod idzie za tabelą). Skutek: Task → TaskAssignment (CASCADE) → TimeEntry (PROTECT) – zadania z zarejestrowanym czasem nie da się usunąć ani odpiąć z niego osoby. |
| W2 | `ChecklistItem.done_by` | PRD: SET_NULL, ale CHECK „`done_by` i `done_at` oba albo żadne” – SET_NULL zostawiłby `done_at` i złamał CHECK. Kod słusznie ma PROTECT; PRD do poprawy. |
| W3 | `Task.parent` CASCADE | Usunięcie zadania nadrzędnego kasuje podzadania, w tym obowiązkowe z szablonu – z pominięciem P9 (`delete_with_reason`). |
| W4 | P1 + P7 | P7 pozwala ukryć w projekcie status bez zadań, więc także domyślny status organizacji. Wtedy P1 utworzy zadania w statusie niewidocznym w projekcie (łamie Task AK4). |
| W5 | §2.3, krok 1 planu | Nieaktualne: modele są już przepisane (`f64dad4`), ale warunek „serwer startuje” nie jest spełniony (rozdz. 4.1). |
| W6 | drobne | numeracja rejestru nie po kolei (1, 2, 3, 4, 10, 11, 5…); `Milestone.status` – „lista stała” bez wartości (kod: planned / active / done, bez `cancelled`, który ma `Project`) |

## 4. PRD ↔ implementacja

### 4.1 Bloker – aplikacja nie startuje

`manage.py check` kończy się `ImportError: cannot import name 'Checklist' from 'api.models'` (`api/admin.py:9`).
Usunięte modele (`FundingTask`, `TaskScope`, `UserProfile`, `Team`, `TeamMember`, `Status`, `Permission`, `Checklist`…) importują nadal:

- `api/admin.py`, `api/views.py`, `api/serializers.py`, `api/access.py`,
- `api/signals.py` – ładowany w `apps.ready()`, więc pada każde polecenie `manage.py`, także `migrate`,
- `api/management/commands/seed.py`, `seed_demo.py`,
- testy `api/tests/access/`, `api/tests/funding_tests.py`.

Dopóki to nie zostanie poprawione, nie da się uruchomić żadnego testu modeli ani sprawdzić migracji (`makemigrations --check`).

### 4.2 Struktura – kod różni się od PRD

| # | Miejsce | PRD | Kod | Ocena |
|---|---|---|---|---|
| K1 | `ChecklistItem.done_by` | SET_NULL | PROTECT | kod ma rację (W2) |
| K2 | `Expense.currency` | bez CHECK | CHECK `^[A-Z]{3}$` | kod lepszy; dopisać do PRD. Otwarta zostaje zgodność waluty wydatku z walutą finansowania |
| K3 | `Task` | XOR projekt/finansowanie + złożony FK | dodatkowo CHECK `task_project_funding_needs_project` | kod ma rację: złożony FK nie jest sprawdzany, gdy `project_id` jest NULL. Dopisać do Task AK2 |
| K4 | złożony FK `task → project_funding` | ograniczenie w `RunSQL` | `DEFERRABLE INITIALLY DEFERRED` | **ryzyko w testach:** sprawdzany dopiero przy commicie, a pytest-django domyślnie wycofuje transakcję testu – test AK2 przejdzie fałszywie bez `transaction=True` albo `SET CONSTRAINTS ALL IMMEDIATE` |
| K5 | `TimeEntry.assignment` | §3 CASCADE / tabela PROTECT | PROTECT | zgodne z tabelą; poprawić §3 (W1) |
| K6 | `MemberGroup.organization` | NULL (rejestr pkt 1 proponuje NOT NULL) | `null=True` | otwarte; przy NULL nie działa też unikalność `(organization, name)` |
| K7 | `Funding.type`, `ActivityLog.action` | – | `choices` bez CHECK | niespójne z resztą (`status`, `category`, `Expense.type` mają CHECK); `Funding` ma do tego polskie etykiety i brak docstringa |
| K8 | `Notification` | brak `created_at` (rejestr pkt 2) | `ordering = ["-id"]` zamiast daty | otwarte (A6) |
| K9 | `Role.permissions` | – | indeks GIN | dodatek w kodzie; dopisać do listy D-8 |

Drobne luki ograniczeń:
- `Organization.tax_id = ""` liczy się jako wartość – dwie organizacje z pustym NIP dadzą IntegrityError, jeśli API wyśle `""` zamiast NULL,
- CHECK w `TaskAssignment` przepuszcza `finished_at` bez `started_at`,
- CHECK w `Comment` odrzuca `""`, ale przepuszcza same spacje.

### 4.3 Kryteria akceptacji bez implementacji

- **Walidacja:** żaden model nie ma `clean()` – nie działa żadne kryterium „→ ValidationError”, łącznie z izolacją organizacji (PRD §6).
- **Metody i menedżery:** brak wszystkich wymienionych w PRD (`activate`, `ancestors`, `effective_roles`, `has_permission`,
  `visible_statuses`, `progress`, `is_overdue`, `for_member`, `for_organization`, `start`/`finish`, `toggle`,
  `checklist_progress`, `mark_read`, `unread_for`, `delete_with_reason`). Są tylko `ChecklistItem.is_done` i `Notification.is_read`.
- **`Organization.settings`:** brak schematu Pydantic (AK2); pydantic jest już w `requirements.txt`.
- **`Role.permissions`:** brak listy kodów `Permission` (AK2); poprzedni katalog (`0002_builtin_catalog`) usunięto w `f64dad4`.
- **`ActivityLog`:** brak blokady edycji w `save()`/`delete()` (AK1); nic nie zapisuje wpisów (AK2).
- **`Attachment`:** brak listy dozwolonych typów MIME (AK2).
- **Procesy P1–P10:** brak `api/services/`; stara wersja P1 jest w `signals.py` na usuniętych modelach.
- **Seed (D-6), test zgodności z diagramem (D-1), testy modeli (D-7):** brak dla nowych modeli.

## 5. Sprawozdanie ↔ implementacja

| Sprawozdanie obiecuje | Stan w kodzie |
|---|---|
| „powiązanie zadania z finansowaniem dotyczy właściwego projektu” | ✅ złożony FK + CHECK |
| „klucze główne, obce i odpowiednie ograniczenia” | ✅ 45 ograniczeń CHECK/UNIQUE + złożony FK |
| rola oddzielona od profilu, kontekst zadania w `Task`, wspólny rejestr zdarzeń, 4 kategorie statusów | ✅ |
| „role i grupy należą do odpowiedniej organizacji” | ⚠️ `Role` tak, `MemberGroup` ma organizację NULL |
| „dane jednego podmiotu nie są udostępniane innemu” | ❌ baza przyjmie np. zadanie organizacji A ze statusem organizacji B; nic tego nie waliduje |
| „ograniczenie dostępu zgodnie z uprawnieniami” | ❌ brak listy kodów uprawnień; `access.py` działa na starych modelach |
| zadania opóźnione, postęp etapów, zadania z szablonów, zestawienia czasu i kosztów, przypomnienia | ⚠️ tabele są, logiki brak |
| „przeglądanie aktywności w projekcie” | ❌ brak `activity_log.project_id` (A5) |
| oddzielenie logiki od dostępu do danych | ❌ brak warstwy repozytoriów (S4) |
| „rejestrowanie najważniejszych operacji” | ⚠️ tabela jest, nikt do niej nie pisze |
| „osoby odpowiedzialne za projekt” (liczba mnoga) | ⚠️ jeden `owner`; pozostałe osoby przez `RoleAssignment(project)` – warto to zapisać w PRD |

## 6. Braki w schemacie

Odniesione do wymagań M/S z `docs/wymagania.md`, przypadków użycia i procesów P1–P10.

### 6.1 Wymagane – bez tego funkcja z wymagań nie działa albo działa źle

| # | Model i pole | Wymaganie | Co się psuje bez tego |
|---|---|---|---|
| A1 | `project_funding.allocated_amount` numeric(14,2) NULL | FR-COST-04 (budżet „dla projektu”); sprawozdanie: tabela pośrednicząca zapisuje „konkretne wykorzystanie finansowania w projekcie” | finansowanie dzielone przez 2 projekty – nie wiadomo, ile przypada na każdy, więc „pozostało” dla projektu jest nie do policzenia |
| A2 | `task.is_mandatory` bool, kopiowane z szablonu | FR-FUND-05, P9, TaskTemplate AK3 | P1 kopiuje tytuł, opis i priorytet, a obowiązkowość jest czytana z żywego szablonu. Usunięcie szablonu (`Task.template` SET_NULL) albo zmiana `mandatory` zdejmuje ochronę z istniejących zadań – łamie AK3 |
| A3 | `task_assignment.removed_at` timestamptz NULL | FR-TASK-04, FR-TIME-04, NFR-REL-04 | odpięcie osoby = usunięcie przypisania, a `TimeEntry.assignment` ma PROTECT – nie da się odpiąć kogoś, kto zalogował czas. „Aktywni przypisani” (odbiorcy powiadomień w P5) = `removed_at IS NULL` |
| A4 | `time_entry.work_date` date NOT NULL; `started_at` → NULL | FR-TIME-01 („data, liczba godzin, opcjonalnie od–do”), FR-TIME-03 | `started_at` jest obowiązkowe – wpis „3 h we wtorek” wymaga wymyślenia godziny; dzień liczony z timestamptz zależy od strefy czasowej, więc wpis może trafić na kartę w inny dzień |
| A5 | `activity_log.project_id` bigint NULL, bez FK (jak `entity_id`) + indeks `(project_id, created_at)` | FR-HIST-02, przypadek użycia „Przeglądaj historię projektu” | historia projektu = wpisy projektu, jego zadań, komentarzy, wydatków i przypisań – kilka podzapytań po `entity_id IN (…)`, bez indeksu |
| A6 | `notification.created_at` + `notification.organization_id` NOT NULL, indeks `(recipient, created_at)` | FR-NOT-02, NFR-AUD-02, P10 AK2, FR-AUTH-05, FR-ORG-04 | bez daty brak sortowania i retencji (rejestr pkt 2). Przypomnienia (`activity` NULL) nie mają związku z organizacją – nie da się ich filtrować po bieżącej organizacji ani ukryć przed osobą, która z niej odeszła |
| A7 | `role.code` varchar NULL, unikalny w organizacji (NULL = rola własna) | FR-ACC-02, FR-ORG-02, FR-ORG-09 / P3 AK3 | reguła „ostatniego administratora” musi rozpoznać rolę administratorską – po nazwie się nie da, bo można ją przemianować. Kod pozwala też chronić role wbudowane przed usunięciem |
| A8 | `organization_member.created_at` (= `invited_at` z rejestru pkt 10) | FR-ORG-03, przypadki użycia „Zaproś członka”, „Przyjmij zaproszenie” | członkostwo nie ma żadnej daty poza `joined_at`, które jest puste do przyjęcia zaproszenia |
| A9 | `member_group.organization` → NOT NULL | rejestr pkt 1, FR-ACC-03, NFR-SEC-01 | grupa bez organizacji nie podlega izolacji; nie działa unikalność nazwy (NULL ≠ NULL) |

Do decyzji: grupy projektowe (S6) – przy decyzji „tak” dochodzi `member_group.project_id` NULL.

### 6.2 Dobre praktyki – tanie, a chronią spójność i audyt

**B1. Znaczniki czasu wg reguły z PRD §3** (sam PRD jej nie trzyma):

| Tabela | Brakuje |
|---|---|
| `organization_member`, `role`, `task_status`, `task_template` | `created_at`, `updated_at` |
| `funding`, `project_funding`, `expense`, `member_group` | `updated_at` (wszystkie są edytowalne; P8 AK4 mówi wprost o zmianie wydatku) |
| `checklist_item` | `created_at` (rejestr pkt 11) |

`organization.modified_at` to jedyna kolumna o tej nazwie – w pozostałych tabelach jest `updated_at`; warto ujednolicić.

**B2. `task.created_by`** → `organization_member` (rejestr pkt 4). Pozostałe rekordy tworzone przez osobę mają autora
(`expense.created_by`, `comment.author`, `attachment.uploaded_by`); zadanie – największa tabela – nie. Autor tylko
w dzienniku oznacza złączenie z `activity_log` przy każdej liście zadań.

**B3. `expense`: `project_id` zawsze NOT NULL, `project_funding_id` opcjonalne + złożony FK `(project_funding_id, project_id)`**
– ten sam wzorzec co w `task` (unikalność `(id, project)` w `project_funding` już jest). „Koszt własny” = `project_funding` NULL.
Dziś wydatek rozliczany z finansowania ma `project_id` NULL, więc raport budżetu projektu wymaga `OR` po dwóch ścieżkach,
których `expense_project_ix` nie pokrywa, a baza nie pilnuje, że finansowanie należy do projektu wydatku.

**B4. `comment.deleted_at`** (miękkie usuwanie). `Comment.parent` ma CASCADE, więc moderator usuwający komentarz
(FR-COL-02, przypadek użycia „Moderuj komentarze”) kasuje też cudze odpowiedzi w wątku. Z `deleted_at` wątek zostaje, znika treść.

**B5. Do rozważenia: `task.organization_id`** (powtórzony klucz organizacji) + złożone FK `(status_id, organization_id)` →
`task_status(id, organization_id)` i analogicznie dla `group`. Przenosi izolację organizacji w najważniejszej tabeli
z `clean()` do bazy i upraszcza `for_organization` (dziś dwie ścieżki: przez projekt albo przez finansowanie). Koszt: redundancja.
To ten sam mechanizm, który już chroni `task.project_funding`.

### 6.3 Ograniczenia i reguły bez nowych pól

- Najwyżej jeden domyślny status projektu: indeks częściowy `WHERE is_default AND project_id IS NOT NULL`; reguła dla P1,
  gdy domyślny status organizacji jest w projekcie ukryty (W4).
- Etap z tego samego projektu co zadanie: złożony FK `(milestone_id, project_id)` → `milestone(id, project_id)`.
- Suma `allocated_amount` ≤ `funding.amount_total` oraz waluta wydatku = waluta finansowania – walidacja w serwisie
  (CHECK nie porównuje wierszy).
- Schemat `organization.settings` powinien mieć także dni robocze (FR-ORG-07) i okres retencji (NFR-AUD-02);
  PRD wymienia tylko strefę czasową, walutę i nazwy priorytetów.

### 6.4 Świadomie pominięte

- priorytet C/W: osoby kontaktowe, zatwierdzanie wydatków, preferencje powiadomień, wzmianki @, blokada edycji starych
  wpisów czasu (klucz w `settings`),
- `milestone.start_date` – FR-PRJ-04 wymaga tylko terminu; na osi czasu etap może być punktem,
- kolejność checklist w zadaniu – sortowane alfabetycznie po `checklist_title`; FR-CHK-01 wymaga kolejności tylko dla punktów,
- kolumna `version` do wykrywania równoczesnej edycji – `task.updated_at` wystarczy jako znacznik w API,
- token zaproszenia i znacznik anonimizacji konta – zaproszenie dotyczy tylko osób z kontem (rejestr pkt 3),
  a anonimizację (NFR-AUD-03) da się zrobić nadpisaniem e-maila i nazwiska.

## 7. Jak to sprawdzono

- `manage.py check` na branchu – błąd importu opisany w 4.1,
- skrypt porównujący kolumny `er-1-relacyjny.drawio` z polami modeli (nazwy i NULL) – 189/189 zgodnych,
- odczyt wszystkich 22 modeli, migracji `0002`, `docs/wymagania.md`, etykiet z 7 diagramów przypadków użycia
  i tekstu sprawozdania (docx z 23.10 i PDF final z 24.10; aktualny jest PDF).

Niesprawdzone: zgodność migracji `0001_initial` z modelami – `makemigrations --check` nie uruchomi się przy błędzie importu.
