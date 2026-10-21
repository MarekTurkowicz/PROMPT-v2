# PROMT 2.0 – wymagania funkcjonalne i niefunkcjonalne

Dokument opisuje wymagania wobec PROMT 2.0 po wprowadzeniu nowego modelu danych
(organizacje, role i grupy, statusy, etapy, ewidencja czasu, koszty, historia i powiadomienia).

**Priorytety (MoSCoW):** **M** – musi być · **S** – powinno być · **C** – może być · **W** – nie w tej wersji.

---

## 1. Aktorzy

| Aktor | Opis |
|---|---|
| Użytkownik | osoba z kontem; może należeć do wielu organizacji |
| Obserwator | członek organizacji z dostępem tylko do odczytu w przydzielonych projektach |
| Członek projektu | realizuje zadania, rejestruje czas, komentuje |
| Admin projektu | zarządza zadaniami, etapami, zespołem i statusami projektu |
| Project Manager (PM) | zakłada projekty, zarządza finansowaniem, budżetem i szablonami |
| Admin organizacji | zarządza członkami, rolami, grupami i ustawieniami organizacji |
| Admin systemu | zarządza organizacjami w całej platformie |
| System (harmonogram) | wykonuje operacje automatyczne: zadania z szablonów, przypomnienia, porządkowanie danych |

Uprawnienia wynikają z ról nadanych osobie albo grupie – w całej organizacji albo w jednym projekcie.
Nazwy ról są przykładowe; organizacja może tworzyć własne.

---

## 2. Wymagania funkcjonalne

### 2.1 Konto i uwierzytelnianie (AUTH)

| ID | Wymaganie | Prio |
|---|---|---|
| FR-AUTH-01 | Użytkownik loguje się adresem e-mail i hasłem. | M |
| FR-AUTH-02 | Użytkownik może się wylogować; sesja wygasa po okresie bezczynności. | M |
| FR-AUTH-03 | Użytkownik może zresetować hasło przez link wysłany na e-mail. | S |
| FR-AUTH-04 | Użytkownik może zmienić hasło, imię i nazwisko. | M |
| FR-AUTH-05 | Po zalogowaniu użytkownik widzi listę swoich organizacji i wybiera bieżącą; może ją w każdej chwili przełączyć. | M |
| FR-AUTH-06 | Konto można zablokować; zablokowany użytkownik nie może się zalogować. | M |

### 2.2 Organizacje i członkowie (ORG)

| ID | Wymaganie | Prio |
|---|---|---|
| FR-ORG-01 | Admin systemu zakłada organizację (nazwa, opcjonalnie NIP unikalny w systemie). | M |
| FR-ORG-02 | Przy założeniu organizacji system tworzy domyślne statusy, role i grupę administratorów, a twórca zostaje administratorem. | M |
| FR-ORG-03 | Admin organizacji zaprasza osoby e-mailem; zaproszenie tworzy członkostwo w statusie „zaproszony”. | M |
| FR-ORG-04 | Członkostwo ma status: zaproszony, aktywny, zawieszony, odszedł; zawieszony członek traci dostęp do danych organizacji. | M |
| FR-ORG-05 | Każdy członek ma profil w organizacji: e-mail służbowy, telefon, stanowisko, avatar – niezależny od innych organizacji. | M |
| FR-ORG-06 | Admin organizacji wskazuje osoby kontaktowe organizacji (główna, rozliczenia, techniczna). | C |
| FR-ORG-07 | Admin organizacji ustawia parametry organizacji: strefa czasowa, domyślna waluta, nazwy pięciu poziomów priorytetu, dni robocze. | S |
| FR-ORG-08 | Admin systemu może zablokować organizację; jej członkowie tracą do niej dostęp, dane pozostają. | M |
| FR-ORG-09 | System nie pozwala usunąć ani zawiesić ostatniego administratora organizacji. | M |

### 2.3 Role, grupy i uprawnienia (ACC)

| ID | Wymaganie | Prio |
|---|---|---|
| FR-ACC-01 | System udostępnia katalog uprawnień (np. tworzenie zadań, przypisywanie osób, zatwierdzanie wydatków). | M |
| FR-ACC-02 | Admin organizacji tworzy własne role jako zestawy uprawnień; dostępne są też role wbudowane. | M |
| FR-ACC-03 | Admin organizacji tworzy grupy firmowe; admin projektu tworzy grupy projektowe. | M |
| FR-ACC-04 | Grupa może mieć grupę nadrzędną; podgrupa dziedziczy role grupy nadrzędnej. | S |
| FR-ACC-05 | Rolę można nadać osobie albo grupie – w całej organizacji albo w jednym projekcie. | M |
| FR-ACC-06 | Uprawnienia osoby to suma ról: własnych, jej grup i grup nadrzędnych, z poziomu organizacji i danego projektu. | M |
| FR-ACC-07 | Użytkownik nie może nadać roli z uprawnieniami, których sam nie ma, ani zmienić własnej roli. | M |
| FR-ACC-08 | Interfejs ukrywa akcje, do których użytkownik nie ma uprawnień; serwer zawsze weryfikuje uprawnienia niezależnie od interfejsu. | M |

### 2.4 Statusy i priorytety (STAT)

| ID | Wymaganie | Prio |
|---|---|---|
| FR-STAT-01 | Każdy status zadania należy do jednej z czterech stałych kategorii: do zrobienia, w toku, zrobione, anulowane. | M |
| FR-STAT-02 | Organizacja definiuje własne statusy w każdej kategorii (nazwa, kolor, kolejność, domyślny). | M |
| FR-STAT-03 | Projekt może dodać własne statusy oraz ukryć statusy organizacji, których nie używa. | S |
| FR-STAT-04 | Nie można ukryć ani usunąć statusu, w którym znajdują się zadania. | M |
| FR-STAT-05 | Zadanie ma priorytet w skali 1–5; nazwy poziomów pochodzą z ustawień organizacji. | M |

### 2.5 Projekty i etapy (PRJ)

| ID | Wymaganie | Prio |
|---|---|---|
| FR-PRJ-01 | Uprawniony użytkownik tworzy projekt: nazwa, opis, właściciel, okres realizacji, status. | M |
| FR-PRJ-02 | Użytkownik widzi tylko projekty, do których ma dostęp (rola w organizacji lub w projekcie). | M |
| FR-PRJ-03 | Projekt można edytować, zamknąć, anulować i zarchiwizować. | M |
| FR-PRJ-04 | Projekt dzieli się na etapy z terminem, statusem i kolejnością. | M |
| FR-PRJ-05 | Zadania można przypiąć do etapu; system pokazuje postęp etapu i projektu (odsetek zadań w kategorii „zrobione”). | M |
| FR-PRJ-06 | Projekt ma widok zespołu: członkowie, grupy projektowe i ich role. | S |

### 2.6 Finansowanie i szablony (FUND)

| ID | Wymaganie | Prio |
|---|---|---|
| FR-FUND-01 | PM rejestruje finansowanie: typ, nazwa, grantodawca, program, numer umowy, kwota i waluta, okres, termin raportowania. | M |
| FR-FUND-02 | Finansowanie definiuje szablony zadań wymaganych (tytuł, opis, domyślny status, priorytet, szacowany czas, termin względny, obowiązkowość). | M |
| FR-FUND-03 | Finansowanie można podpiąć do projektu z okresem alokacji; jedno z finansowań projektu może być główne. | M |
| FR-FUND-04 | Po podpięciu finansowania system automatycznie tworzy w projekcie zadania z jego szablonów, z terminem liczonym od początku alokacji. | M |
| FR-FUND-05 | Zadanie utworzone z szablonu pamięta swój szablon; zadań obowiązkowych nie można usunąć bez uzasadnienia. | S |
| FR-FUND-06 | Możliwe są zadania samego finansowania, niezwiązane z projektem (np. raport do grantodawcy). | S |

### 2.7 Zadania (TASK)

| ID | Wymaganie | Prio |
|---|---|---|
| FR-TASK-01 | Uprawniony użytkownik tworzy, edytuje i usuwa zadania: tytuł, opis, status, priorytet, daty, szacowany czas. | M |
| FR-TASK-02 | Zadanie należy do projektu albo do samego finansowania; może być przypisane do finansowania projektu. | M |
| FR-TASK-03 | Zadanie może mieć podzadania. | S |
| FR-TASK-04 | Do zadania można przypisać wiele osób; przypisanie zapamiętuje kto, kiedy przypisał oraz kiedy osoba zaczęła i skończyła pracę. | M |
| FR-TASK-05 | Zadanie można przekazać grupie; członek grupy może je wziąć, co tworzy przypisanie. | S |
| FR-TASK-06 | Lista zadań z filtrami: projekt, status i kategoria, priorytet, etap, grupa, osoba, termin, zaległe; z sortowaniem i stronicowaniem. | M |
| FR-TASK-07 | Tablica Kanban: kolumny to kategorie, sekcje to statusy; przeciągnięcie karty zmienia status. | M |
| FR-TASK-08 | Widok osi czasu (harmonogram) zadań i etapów projektu. | S |
| FR-TASK-09 | Widok „Moje zadania” we wszystkich projektach bieżącej organizacji. | M |
| FR-TASK-10 | Zadania po terminie w kategoriach „do zrobienia” i „w toku” są oznaczane jako zaległe. | M |

### 2.8 Checklisty (CHK)

| ID | Wymaganie | Prio |
|---|---|---|
| FR-CHK-01 | Zadanie może mieć jedną lub kilka checklist z punktami w ustalonej kolejności. | M |
| FR-CHK-02 | Punkt można przypisać osobie; odhaczenie zapisuje, kto i kiedy to zrobił. | M |
| FR-CHK-03 | Zadanie pokazuje postęp checklist (np. 3/5). | S |

### 2.9 Ewidencja czasu (TIME)

| ID | Wymaganie | Prio |
|---|---|---|
| FR-TIME-01 | Osoba przypisana do zadania rejestruje czas pracy: data, liczba godzin, opcjonalnie godziny od–do, opis. | M |
| FR-TIME-02 | Czas może rejestrować tylko osoba przypisana do zadania. | M |
| FR-TIME-03 | Karta czasu pracy: godziny osoby w tygodniu w podziale na dni i zadania. | S |
| FR-TIME-04 | Suma godzin na zadaniu, projekcie i finansowaniu, porównana z czasem szacowanym. | S |
| FR-TIME-05 | Ustawienia organizacji mogą zablokować edycję wpisów starszych niż N dni. | C |

### 2.10 Koszty i budżet (COST)

| ID | Wymaganie | Prio |
|---|---|---|
| FR-COST-01 | Uprawniony użytkownik rejestruje wydatek: typ, kwota, waluta, data, numer dokumentu, opis. | M |
| FR-COST-02 | Wydatek jest kosztem własnym projektu albo jest rozliczany z konkretnego finansowania projektu; opcjonalnie dotyczy zadania. | M |
| FR-COST-03 | Do wydatku można dołączyć skan dokumentu (np. faktury). | M |
| FR-COST-04 | Raport budżetu: kwota finansowania, wydatki, pozostało – dla finansowania i dla projektu. | S |
| FR-COST-05 | Wydatki mogą wymagać zatwierdzenia przez uprawnioną osobę. | C |

### 2.11 Współpraca (COLLAB)

| ID | Wymaganie | Prio |
|---|---|---|
| FR-COL-01 | Użytkownik komentuje zadania i projekty; komentarze tworzą wątki (odpowiedzi). | M |
| FR-COL-02 | Autor może edytować i usuwać swoje komentarze; uprawniona osoba może moderować cudze. | S |
| FR-COL-03 | Do zadań, komentarzy i wydatków można dołączać pliki (z limitem rozmiaru i dozwolonymi typami). | M |
| FR-COL-04 | W komentarzu można wspomnieć osobę (@), co tworzy dla niej powiadomienie. | C |

### 2.12 Historia i powiadomienia (HIST, NOTIF)

| ID | Wymaganie | Prio |
|---|---|---|
| FR-HIST-01 | System zapisuje istotne zdarzenia: kto, co, na jakim obiekcie, kiedy, jakie zmiany (stara i nowa wartość). | M |
| FR-HIST-02 | Historia jest dostępna dla zadania, projektu i organizacji, zgodnie z uprawnieniami. | M |
| FR-HIST-03 | Wpisów historii nie można edytować; usuwa je tylko proces retencji. | M |
| FR-NOT-01 | Zmiana zadania tworzy powiadomienia dla osób przypisanych i członków grupy zadania (bez autora zmiany). | M |
| FR-NOT-02 | Użytkownik widzi listę powiadomień z licznikiem nieprzeczytanych i może oznaczyć je jako przeczytane (pojedynczo i wszystkie). | M |
| FR-NOT-03 | System wysyła przypomnienia o zbliżających się i przekroczonych terminach. | S |
| FR-NOT-04 | Użytkownik może wyłączyć wybrane typy powiadomień lub kanał e-mail. | C |
| FR-NOT-05 | Wiadomości wysyłane ręcznie do osób, grup lub projektu. | W |

### 2.13 Administracja (ADM)

| ID | Wymaganie | Prio |
|---|---|---|
| FR-ADM-01 | Admin systemu ma panel administracyjny z podglądem i blokowaniem organizacji i kont. | M |
| FR-ADM-02 | System udostępnia dokumentację API (OpenAPI). | S |
| FR-ADM-03 | Dane demonstracyjne można wygenerować jednym poleceniem (środowisko deweloperskie i testy). | M |

---

## 3. Wymagania niefunkcjonalne

### 3.1 Wydajność (PERF)

| ID | Wymaganie | Prio |
|---|---|---|
| NFR-PERF-01 | 95% odpowiedzi API dla list (do 100 elementów) w czasie poniżej 300 ms przy 50 równoczesnych użytkownikach. | M |
| NFR-PERF-02 | Tablica Kanban projektu z 500 zadaniami ładuje się w czasie poniżej 1 s. | S |
| NFR-PERF-03 | Sprawdzenie uprawnień nie wymaga więcej niż jednego zapytania do bazy na żądanie. | S |
| NFR-PERF-04 | Brak problemu N+1 zapytań w endpointach list (weryfikowane testami liczby zapytań). | M |
| NFR-PERF-05 | Listy są stronicowane; pojedyncza odpowiedź nie zwraca więcej niż 100 elementów. | M |

### 3.2 Skalowalność (SCAL)

| ID | Wymaganie | Prio |
|---|---|---|
| NFR-SCAL-01 | Wiele organizacji we wspólnej bazie (multi-tenancy) z wydajnością jak w NFR-PERF-01 przy 100 organizacjach i 100 000 zadań. | S |
| NFR-SCAL-02 | Backend jest bezstanowy – można uruchomić wiele instancji za load balancerem. | S |
| NFR-SCAL-03 | Dziennik zdarzeń może być przeniesiony do osobnej bazy (dokumentowej) bez zmiany API. | C |

### 3.3 Bezpieczeństwo (SEC)

| ID | Wymaganie | Prio |
|---|---|---|
| NFR-SEC-01 | Dane organizacji są odizolowane: użytkownik nie odczyta ani nie zmieni danych organizacji, do której nie należy (weryfikowane testami). | M |
| NFR-SEC-02 | Hasła przechowywane wyłącznie jako skróty (algorytm z mechanizmów Django, np. PBKDF2/Argon2). | M |
| NFR-SEC-03 | Ochrona przed CSRF, XSS i SQL injection; zgodność z OWASP Top 10. | M |
| NFR-SEC-04 | Ograniczenie liczby nieudanych prób logowania (rate limiting). | S |
| NFR-SEC-05 | Komunikacja wyłącznie przez HTTPS w środowisku produkcyjnym. | M |
| NFR-SEC-06 | Wgrywane pliki: limit rozmiaru, lista dozwolonych typów, przechowywanie poza katalogiem aplikacji. | M |
| NFR-SEC-07 | Sekrety (klucze, hasła do bazy) wyłącznie w zmiennych środowiskowych, nigdy w repozytorium. | M |

### 3.4 Integralność i niezawodność (REL)

| ID | Wymaganie | Prio |
|---|---|---|
| NFR-REL-01 | Reguły spójności zapisane w bazie: klucze obce, ograniczenia unikalności i CHECK (np. priorytet 1–5, kwoty dodatnie, „dokładnie jeden” kontekst). | M |
| NFR-REL-02 | Operacje wieloetapowe (np. podpięcie finansowania z utworzeniem zadań, zmiana z zapisem historii i powiadomień) wykonywane w jednej transakcji. | M |
| NFR-REL-03 | Codzienna kopia zapasowa bazy z możliwością odtworzenia; RPO ≤ 24 h, RTO ≤ 4 h. | S |
| NFR-REL-04 | Usunięcie projektu lub zadania nie usuwa historii zdarzeń ani rozliczonych kosztów bez decyzji administratora. | S |

### 3.5 Użyteczność i dostępność (UX)

| ID | Wymaganie | Prio |
|---|---|---|
| NFR-UX-01 | Interfejs responsywny: działa na ekranach od 360 px szerokości. | M |
| NFR-UX-02 | Zgodność z WCAG 2.1 na poziomie AA dla głównych ekranów (kontrast, obsługa klawiaturą, etykiety pól). | S |
| NFR-UX-03 | Interfejs w języku polskim, z możliwością dodania angielskiego (teksty poza kodem komponentów). | S |
| NFR-UX-04 | Każda operacja zapisu daje widoczne potwierdzenie albo czytelny komunikat błędu. | M |
| NFR-UX-05 | Obsługa aktualnych wersji przeglądarek Chrome, Firefox, Edge i Safari. | M |

### 3.6 Utrzymywalność i jakość kodu (MAINT)

| ID | Wymaganie | Prio |
|---|---|---|
| NFR-MAINT-01 | Wszystkie dane wejściowe API typowane i walidowane (serializery DRF, modele Pydantic dla zdarzeń i ustawień). | M |
| NFR-MAINT-02 | Statyczna kontrola typów: mypy (backend) i TypeScript w trybie strict (frontend). | S |
| NFR-MAINT-03 | Pokrycie testami logiki backendu co najmniej 70%; kluczowe ścieżki użytkownika objęte testami E2E. | S |
| NFR-MAINT-04 | Każda zmiana przechodzi przez pull request z automatycznymi testami (CI). | M |
| NFR-MAINT-05 | Zmiany schematu bazy wyłącznie przez migracje, odtwarzalne na pustej bazie. | M |
| NFR-MAINT-06 | Typy TypeScript dla frontendu generowane ze schematu OpenAPI. | C |

### 3.7 Przenośność i wdrożenie (PORT)

| ID | Wymaganie | Prio |
|---|---|---|
| NFR-PORT-01 | Całe środowisko uruchamiane poleceniem `docker compose up`. | M |
| NFR-PORT-02 | Konfiguracja zależna od środowiska wyłącznie przez zmienne środowiskowe. | M |
| NFR-PORT-03 | Baza danych PostgreSQL w wersji 15 lub nowszej. | M |

### 3.8 Audyt i zgodność (AUD)

| ID | Wymaganie | Prio |
|---|---|---|
| NFR-AUD-01 | Zmiany uprawnień, budżetu i danych członków są zawsze zapisywane w historii. | M |
| NFR-AUD-02 | Retencja historii i powiadomień konfigurowalna (np. powiadomienia 180 dni). | S |
| NFR-AUD-03 | Zgodność z RODO: eksport danych osoby, usunięcie lub anonimizacja konta na żądanie. | S |

### 3.9 Monitorowanie (OBS)

| ID | Wymaganie | Prio |
|---|---|---|
| NFR-OBS-01 | Logi aplikacji w formacie strukturalnym, z identyfikatorem żądania. | S |
| NFR-OBS-02 | Endpoint stanu aplikacji (`/health`) do monitorowania. | M |

---

## 4. Ograniczenia i założenia

- Stos: React + TypeScript (frontend), Django + Django REST Framework (backend), PostgreSQL, Docker.
- Wersja 2.0 to monolit; podział na mikroserwisy jest planowany w wersji 3.0.
- Poza zakresem 2.0: płatności, czat w czasie rzeczywistym, aplikacja mobilna, wiadomości wysyłane ręcznie (FR-NOT-05).
- Model danych: `docs/schemat/` (wariant relacyjny 1).

---

## 5. Macierz ról i głównych funkcji

| Funkcja | Obserwator | Członek projektu | Admin projektu | PM | Admin organizacji | Admin systemu |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Przeglądanie projektów i zadań | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Tworzenie i edycja własnych zadań | | ✔ | ✔ | ✔ | ✔ | ✔ |
| Rejestracja czasu, checklisty, komentarze | | ✔ | ✔ | ✔ | ✔ | ✔ |
| Przypisywanie osób, etapy, statusy projektu | | | ✔ | ✔ | ✔ | ✔ |
| Grupy projektowe, role w projekcie | | | ✔ | ✔ | ✔ | ✔ |
| Projekty, finansowanie, szablony, wydatki, budżet | | | | ✔ | ✔ | ✔ |
| Członkowie, role i grupy organizacji, ustawienia | | | | | ✔ | ✔ |
| Organizacje i konta w całej platformie | | | | | | ✔ |
