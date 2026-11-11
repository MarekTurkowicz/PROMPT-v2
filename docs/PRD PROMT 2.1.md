Rozdziały

[1. Podsumowanie](#1-podsumowanie) [2. Opis produktu](#2-opis-produktu) [3. Role i uprawnienia](#3-role-i-uprawnienia) [4. Wymagania funkcjonalne](#4-wymagania-funkcjonalne) [5. Interfejs użytkownika](#5-interfejs-użytkownika) [6. Architektura heksagonalna i trzy warianty bazy](#6-architektura-heksagonalna-i-trzy-warianty-bazy) [7. Model danych](#7-model-danych) [8. Procesy biznesowe](#8-procesy-biznesowe) [9. Specyfikacja API](#9-specyfikacja-api) [10. Zadania w tle, raporty i powiadomienia](#10-zadania-w-tle-raporty-i-powiadomienia) [11. Wymagania niefunkcjonalne](#11-wymagania-niefunkcjonalne) [12. Struktura projektu](#12-struktura-projektu) [13. Strategia testów](#13-strategia-testów) [14. Uruchomienie i środowisko](#14-uruchomienie-i-środowisko) [15. Plan etapów](#15-plan-etapów) [16. Decyzje i otwarte kwestie](#16-decyzje-i-otwarte-kwestie) [17. Słownik](#17-słownik)

# Product Requirements Document

## PROMT 2.0 – Plan • Run • Optimise Management Tool

**Aplikacja webowa do zarządzania projektami i finansowaniem (React + Django REST + trzy warianty bazy danych)**

**Wersja dokumentu 2.0 | listopad 2026**

---

## Metryka dokumentu

| Pole | Wartość |
| --- | --- |
| Status | Wersja robocza – do przeglądu w zespole |
| Wersja | 2.0 (zastępuje wersję 1.1 „warstwa danych”) |
| Data | 2026-11-06 |
| Zespół | Jakub Jakacki, Jakub Kazimiruk, Marek Turkowicz |
| Odbiorcy | zespół projektowy, prowadzący zajęcia |
| Wymagania szczegółowe | `docs/wymagania.md` (FR/NFR, priorytety MoSCoW) |
| Przypadki użycia | `docs/przypadki-uzycia/` |
| Schematy baz | `docs/schemat/warianty/` – relacyjny (`er-1-relacyjny.drawio`), obiektowo-relacyjny (`obiektowo-relacyjny.md`), dokumentowy (`nosql-mongodb.md`, `nosql-mongodb-heksagonalny.drawio`) |
| Architektura | heksagonalna – szkielet `backend/app/` na `main`; porty, adaptery i decyzje dla MongoDB w `nosql-mongodb-heksagonalny.drawio` (strona 2) |
| Analiza poprzedniej wersji | `docs/analiza-prd-i-modeli.md` |
| Szkielet frontendu | artifact „Front aplikacji PROMT” – klikalna makieta wszystkich ekranów |

### Co zmienia się względem wersji 1.1

| Wersja 1.1 | Wersja 2.0 |
| --- | --- |
| Tylko modele danych backendu, tylko PostgreSQL | Cały produkt: frontend, API, logika, **trzy warianty bazy** |
| Warianty obiektowo-relacyjny i MongoDB „w kolejnym etapie”, bez architektury | Architektura heksagonalna od początku: domena i porty wspólne, po jednym adapterze na każdą z trzech baz |
| Role przykładowe (admin, PM, członek, obserwator) | Hierarchia ról ustalona przez zespół: Obserwator → Użytkownik → PM → Dyrektor projektu → Dyrektor organizacji, plus administratorzy |
| Szablony zadań obowiązkowe albo opcjonalne | Każdy szablon jest obowiązkowy; zadania finansowania = kopie szablonów + zadania dodatkowe |
| Brak wymagań dla widoków | Przegląd projektu (dashboard), oś czasu, zespół jako graf, porównanie osób, raporty PDF/CSV, motyw ciemny |

---

## Spis treści

1. [Podsumowanie](#1-podsumowanie)
2. [Opis produktu](#2-opis-produktu)
3. [Role i uprawnienia](#3-role-i-uprawnienia)
4. [Wymagania funkcjonalne](#4-wymagania-funkcjonalne)
5. [Interfejs użytkownika](#5-interfejs-u%C5%BCytkownika)
6. [Architektura heksagonalna i trzy warianty bazy](#6-architektura-heksagonalna-i-trzy-warianty-bazy)
7. [Model danych](#7-model-danych)
8. [Procesy biznesowe (kryteria akceptacji dla wszystkich baz)](#8-procesy-biznesowe)
9. [Specyfikacja API](#9-specyfikacja-api)
10. [Zadania w tle, raporty i powiadomienia](#10-zadania-w-tle-raporty-i-powiadomienia)
11. [Wymagania niefunkcjonalne](#11-wymagania-niefunkcjonalne)
12. [Struktura projektu](#12-struktura-projektu)
13. [Strategia testów](#13-strategia-test%C3%B3w)
14. [Uruchomienie i środowisko](#14-uruchomienie-i-%C5%9Brodowisko)
15. [Plan etapów](#15-plan-etap%C3%B3w)
16. [Decyzje i otwarte kwestie](#16-decyzje-i-otwarte-kwestie)
17. [Słownik](#17-s%C5%82ownik)

---

## 1. Podsumowanie

**PROMT** to wieloorganizacyjna aplikacja webowa do planowania i rozliczania projektów finansowanych z różnych źródeł (granty, sponsoring, darowizny, środki własne). Łączy w jednym miejscu zadania, etapy, zespół, czas pracy, finansowania z ich wymogami i budżet.

Najważniejsza zasada projektu: **ten sam produkt działa na trzech typach bazy danych** – relacyjnej, obiektowo-relacyjnej i dokumentowej (NoSQL). Backend ma **architekturę heksagonalną**: domena, przypadki użycia i porty są wspólne, a każda baza ma własny adapter. Frontend i API nie wiedzą, która baza działa. Dzięki temu można uczciwie porównać trzy paradygmaty na identycznych danych i identycznych operacjach.

### Kluczowe możliwości

- **Organizacje i członkowie** – konto jedno na osobę, członkostwo w wielu organizacjach, profil służbowy per organizacja.
- **Role i grupy** – hierarchia ról z dostępem kaskadowym (organizacja → projekt), grupy z podgrupami, grupa „Kontroler finansowy”.
- **Przegląd projektu (dashboard)** – kondycja projektu, postęp etapów, wykresy zadań, czas pracy, finansowania z budżetem.
- **Zadania** – podzadania, checklisty, przypisania wielu osób, pula grupy, lista z filtrami, Kanban.
- **Oś czasu** – przybliżanie i przesuwanie w poziomie, tworzenie zadania przez zaznaczenie zakresu, przeciąganie zadań bez terminu na oś.
- **Zespół** – graf organizacji, grup i osób; porównanie obciążenia dwóch osób.
- **Finansowania** – szablony wymogów, automatyczne zadania po podpięciu do projektu, zadania dodatkowe, budżet i wydatki.
- **Raporty** – raport projektu w PDF, eksport list do CSV.
- **Historia i powiadomienia** – dziennik zdarzeń tylko do dopisywania, powiadomienia w aplikacji, przypomnienia o terminach.
- **Interfejs** – gotowe komponenty zamiast ręcznego CSS, motyw ciemny obowiązkowo, teksty gotowe do tłumaczenia (PL, potem EN).

### Stan na dziś

| Warstwa | Stan |
| --- | --- |
| Frontend | **Szkielet gotowy jako artifact** (makieta wszystkich ekranów z danymi w pamięci). Do przeniesienia do React + TypeScript w `frontend/`. |
| Architektura | Szkielet katalogów `backend/app/` (domena, porty, adaptery) na `main`; pliki puste. `adapter/apps.py` i `dependencies_container.py` są niespójne (nazwa aplikacji `application`, inna nazwa funkcji) i aplikacja nie jest w `INSTALLED_APPS`. |
| Backend (API, logika) | Do zrobienia. Stare widoki i serializery w `backend/api/` działają na usuniętych modelach. |
| Baza relacyjna | Modele Django zgodne z diagramem wariantu 1 (22 tabele) w `backend/api/models/` – materiał dla adaptera relacyjnego; brak logiki, walidacji i procesów. |
| Baza obiektowo-relacyjna | Tylko projekt (`obiektowo-relacyjny.md`). |
| Baza dokumentowa | Projekt modelu pod architekturę heksagonalną (`nosql-mongodb-heksagonalny.drawio`). |

---

## 2. Opis produktu

### 2.1 Problem

Organizacje realizujące projekty z finansowania zewnętrznego muszą jednocześnie pilnować trzech rzeczy: pracy zespołu, wymogów każdego finansowania (raporty, terminy, obowiązkowe działania) i budżetu. Każde finansowanie ma inne procedury i terminy. Ogólne narzędzia do zadań nie znają pojęcia finansowania, a arkusze nie pokazują, kto co robi i czy projekt jest zagrożony.

Kierownik projektu potrzebuje przede wszystkim **widzieć stan projektu na wykresach**, a nie przeglądać listy. Osoba z zarządu, która zagląda raz na jakiś czas, chce w kilka sekund zobaczyć, czy projekt idzie dobrze.

### 2.2 Rozwiązanie

Aplikacja, w której:

1. Organizacja zakłada projekty, dzieli je na etapy i zadania, przypisuje osoby i grupy.
2. Finansowanie definiuje swoje wymogi jako szablony zadań; po podpięciu do projektu wymogi stają się realnymi zadaniami.
3. Czas pracy i wydatki są rejestrowane przy zadaniach i finansowaniach, więc budżet i obciążenie liczą się same.
4. Każdy projekt ma przegląd z wykresami i wskaźnikiem kondycji, oś czasu i widok zespołu.
5. Dostęp wynika z ról nadanych osobie albo grupie, w organizacji albo w projekcie.

### 2.3 Zakres

**W zakresie 2.0:** wszystkie wymagania M i S z `docs/wymagania.md`, rozszerzone o ustalenia z rozdziałów 3–5 tego dokumentu, na trzech wariantach bazy.

**Poza zakresem 2.0:** płatności, czat w czasie rzeczywistym, aplikacja mobilna, wiadomości wysyłane ręcznie (FR-NOT-05), synchronizacja danych między wariantami bazy, praca jednej instancji na dwóch bazach naraz, animacje dekoracyjne (np. „spadające klocki” przy ładowaniu – pomysł odłożony).

### 2.4 Urządzenia i przeglądarki

Tylko aplikacja webowa, responsywna od 360 px szerokości (NFR-UX-01). Główny układ projektowany dla ekranów ≥ 1280 px. Aktualne wersje Chrome, Firefox, Edge i Safari (NFR-UX-05). Oś czasu i Kanban na ekranie dotykowym: przeciąganie zastąpione wyborem z menu (zmień status, ustaw daty).

---

## 3. Role i uprawnienia

### 3.1 Zasady

- Uprawnienia są **sumą ról**: własnych, ról grup osoby i ról grup nadrzędnych (FR-ACC-06).
- Rolę nadaje się **osobie albo grupie**, **w całej organizacji albo w jednym projekcie** (FR-ACC-05).
- **Dostęp kaskadowy:** rola nadana w organizacji działa we wszystkich jej projektach; rola nadana w projekcie działa tylko w nim. Obserwator może więc widzieć całą organizację albo organizację ograniczoną do wybranych projektów.
- Rola to nazwany zestaw kodów uprawnień. Role wbudowane mają stały `code`, którego nie da się zmienić ani usunąć; organizacja może tworzyć role własne (FR-ACC-02).
- Nikt nie nada roli z uprawnieniami, których sam nie ma, ani nie zmieni własnej roli (FR-ACC-07).
- **Usuwanie obiektów nadrzędnych** (projekt, finansowanie, grupa, rola) jest zarezerwowane dla Dyrektora organizacji i administratorów. Cel: kierownik projektu nie może przypadkowo „rozjechać” całego projektu.
- Serwer zawsze sprawdza uprawnienia; interfejs tylko ukrywa niedostępne akcje (FR-ACC-08).

### 3.2 Role wbudowane

Od najniższej:

| Rola (`code`) | Kto to jest | Zakres |
| --- | --- | --- |
| Obserwator (`viewer`) | osoba przeglądająca, np. członek zarządu albo osoba z zewnątrz | tylko odczyt elementów, do których dostał dostęp (organizacja albo wybrane projekty) |
| Użytkownik (`member`) | pracownik realizujący zadania | swoje zadania, czas pracy, checklisty, komentarze |
| Project Manager (`project_manager`) | prowadzi projekt | prawie wszystko w projekcie: zadania, etapy, przypisania, grupy, dodawanie osób, finansowania i budżet; **nie usuwa projektu** |
| Dyrektor projektu (`project_director`) | nadzoruje PM-ów, „właściciel” projektów | wszystko co PM w swoich projektach + nadawanie ról w projekcie (w tym PM), zamykanie i archiwizacja projektu; **bez dostępu do ustawień organizacji i bez usuwania** |
| Dyrektor organizacji (`organization_director`) | kierownictwo organizacji | wszystkie projekty organizacji, zakładanie projektów, **usuwanie** projektów i finansowań |
| Administrator organizacji (`organization_admin`) | administracja organizacji | członkowie, zaproszenia, role, grupy, statusy, ustawienia organizacji |
| Administrator systemu (`user.is_staff`, nie rola) | operator platformy | organizacje i konta w całej platformie, blokady |

Zakres Dyrektora projektu poza „nie usuwa i nie ma dostępu do organizacji” jest propozycją – patrz [rozdz. 16, D2](#16-decyzje-i-otwarte-kwestie). Czy Dyrektor organizacji i Administrator organizacji to jedna rola – D1.

### 3.3 Grupy z uprawnieniami

- Grupa ma grupę nadrzędną; podgrupa dziedziczy role grupy nadrzędnej (FR-ACC-04).
- Przy założeniu organizacji system tworzy grupy wbudowane:
  - **Administratorzy** – z rolą `organization_admin` (FR-ORG-02),
  - **Kontroler finansowy** – z rolą zawierającą uprawnienia finansowe w całej organizacji (odczyt i edycja finansowań, szablonów, wydatków, raport budżetu, eksport). Kontrolerem merytorycznym projektu pozostaje PM.
- Przy założeniu projektu system tworzy **grupę projektową** o nazwie „*nazwa organizacji* · *nazwa projektu*” (zamiast ogólnych nazw typu „Zespół produktu”). PM może tworzyć w niej podgrupy.

### 3.4 Katalog uprawnień

Kody są stałą listą w kodzie (`Permission`), nie tabelą. Każda rola wbudowana jest zestawem tych kodów.

| Obszar | Kody |
| --- | --- |
| Podgląd | `project.view`, `task.view`, `funding.view`, `budget.view`, `team.view`, `report.view` |
| Zadania | `task.create`, `task.edit`, `task.delete`, `task.assign`, `task.plan` (daty, oś czasu), `checklist.edit`, `time.log`, `comment.create`, `comment.moderate` |
| Projekt | `project.create`, `project.edit`, `project.close`, `project.delete`, `milestone.manage`, `status.manage_project`, `group.manage_project`, `role.grant_project` |
| Finanse | `funding.manage`, `funding.attach`, `template.manage`, `expense.manage`, `budget.export` |
| Organizacja | `member.manage`, `role.manage`, `group.manage`, `status.manage`, `org.settings` |

### 3.5 Macierz ról

| Funkcja | Obserwator | Użytkownik | PM | Dyr. projektu | Dyr. organizacji | Admin organizacji |
| --- | --- | --- | --- | --- | --- | --- |
| Podgląd projektów, zadań, dashboardów (w zakresie dostępu) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Własne zadania, czas pracy, checklisty, komentarze |  | ✔ | ✔ | ✔ | ✔ | ✔ |
| Tworzenie i edycja zadań, przypisywanie, planowanie na osi czasu |  |  | ✔ | ✔ | ✔ | ✔ |
| Etapy, statusy projektu, grupy projektowe, dodawanie osób |  |  | ✔ | ✔ | ✔ | ✔ |
| Finansowania, szablony, wydatki, budżet |  |  | ✔ | ✔ | ✔ | ✔ |
| Nadawanie ról w projekcie (do PM włącznie) |  |  |  | ✔ | ✔ | ✔ |
| Zamykanie i archiwizacja projektu |  |  |  | ✔ | ✔ | ✔ |
| Zakładanie projektu |  |  | ✔ | ✔ | ✔ | ✔ |
| **Usuwanie** projektu, finansowania, grupy, roli |  |  |  |  | ✔ | ✔ |
| Członkowie, role, grupy i ustawienia organizacji |  |  |  |  |  | ✔ |

PM nadaje w swoim projekcie role Obserwator i Użytkownik. Administrator systemu ma dostęp do wszystkiego plus panel platformy.

### 3.6 Kryteria akceptacji

- AK1: Obserwator z rolą w projekcie A nie widzi projektu B tej samej organizacji; z rolą w organizacji widzi oba.
- AK2: PM nie może usunąć projektu (API zwraca 403, przycisku nie ma w interfejsie).
- AK3: Osoba w podgrupie grupy „Kontroler finansowy” edytuje wydatki w każdym projekcie organizacji.
- AK4: Próba nadania roli z uprawnieniem, którego nadający nie ma → 403.
- AK5: Kryteria AK1–AK4 przechodzą na każdym z trzech wariantów bazy.

---

## 4. Wymagania funkcjonalne

Mapa ekranów odpowiada szkieletowi frontendu (artifact). Nazwy tras są robocze.

| Obszar | Trasa | Rozdział |
| --- | --- | --- |
| Przegląd organizacji | `/overview` | 4.12 |
| Projekty | `/projects` | 4.2 |
| Finansowania | `/fundings` | 4.8 |
| Zadania (Moje zadania i wszystkie) | `/tasks` | 4.4 |
| Czas pracy (karta tygodnia) | `/time` | 4.10 |
| Projekt: Przegląd · Zadania · Kanban · Etapy · Oś czasu · Zespół · Czas pracy · Finansowania · Budżet · Komentarze · Historia · Ustawienia | `/projects/:id/...` | 4.3–4.11 |
| Administracja: Członkowie · Grupy · Role · Statusy · Ustawienia · Dziennik | `/admin/...` | 4.1, 4.13 |

### 4.1 Organizacje, członkowie i grupy

- **Organizacja:** nazwa (nieunikalna), NIP (unikalny w systemie, gdy podany; pusty zapisywany jako NULL), identyfikator techniczny niezależny od obu. Ustawienia: strefa czasowa, waluta, nazwy 5 poziomów priorytetu, dni robocze (FR-ORG-07).
- **Użytkownik per organizacja:** jedno konto, osobne członkostwo z profilem służbowym (e-mail, telefon, stanowisko, avatar) w każdej organizacji. Przełącznik organizacji w nagłówku (FR-AUTH-05).
- **Członkowie organizacji** – jedna lista wszystkich członków, bez dzielenia na sekcje. Wyszukiwarka po imieniu, nazwisku, e-mailu i stanowisku; filtr po grupie i statusie członkostwa.
- **Gdzie jest osoba:** wybranie osoby z wyszukiwarki rozwija jej grupy, role i projekty.
- **Grupy** (Administracja → Grupy) – drzewo. Kliknięcie grupy pokazuje jej podgrupy i osoby. Filtrowanie i wyszukiwanie jak na liście członków.
- Statusy członkostwa, zaproszenia, blokady i ochrona ostatniego administratora – bez zmian względem FR-ORG-03…09.

### 4.2 Projekty

- Lista projektów z kafelkami: nazwa, właściciel, status, okres, pasek postępu, wskaźnik kondycji (4.3), główne finansowanie.
- Widok projektu: **nagłówek z osobą odpowiedzialną** (właściciel projektu z avatarem, po lewej stronie nagłówka) i zakładki z mapy ekranów.
- Statusy projektu: planowany, aktywny, zamknięty, anulowany, zarchiwizowany. Usuwanie wg 3.5.

### 4.3 Przegląd projektu (dashboard)

Pierwsza zakładka projektu. Cel: po dłuższej przerwie w kilka sekund zobaczyć, co się dzieje i czy jest dobrze. **Bez komentarzy i bez historii** – te mają własne zakładki.

| Element | Zawartość |
| --- | --- |
| Wskaźnik kondycji | duży, kolorowy baner: „W porządku” / „Wymaga uwagi” / „Zagrożony” z listą przyczyn |
| Kafelki liczbowe | postęp projektu (%), zadania w toku, zadania zaległe, godziny zarejestrowane vs szacowane, budżet wykorzystany (%), najbliższy termin etapu. Kliknięcie kafelka przenosi do listy zadań z tym filtrem. |
| Etapy | lista etapów z paskiem postępu (zrobione / wszystkie, bez anulowanych); kliknięcie rozwija zadania etapu |
| Zadania na wykresie | rozkład zadań wg kategorii i statusu (odpowiednik Kanbanu jako wykres) |
| Przepływ i wydajność | zadania utworzone vs zamknięte w tygodniach; aktywność w dniach tygodnia; obciążenie osób (zadania w toku na osobę) |
| Czas pracy | godziny w tygodniach, podział na osoby |
| Finansowania i budżet | dla każdego finansowania projektu: alokacja, wydatki, pozostało, postęp zadań finansowania |
| Oś czasu (podgląd) | etapy i zadania w bieżącym miesiącu; kliknięcie otwiera pełną oś czasu |

**Reguły kondycji** (progi w ustawieniach organizacji, wartości domyślne do potwierdzenia):

| Warunek | Wynik |
| --- | --- |
| etap po terminie z niezakończonymi zadaniami, budżet > 100% albo > 20% zadań zaległych | Zagrożony |
| zadania zaległe > 0, budżet > 90% albo godziny > 110% szacowanych | Wymaga uwagi |
| żaden z powyższych | W porządku |

AK: wszystkie liczby dashboardu pochodzą z jednego endpointu (`/overview`) liczonego po stronie serwera; wynik jest identyczny na trzech bazach dla tego samego zbioru danych.

### 4.4 Zadania i podzadania

- Pola zadania jak w FR-TASK-01; priorytet 1–5 z nazwami z ustawień organizacji.
- **Podzadania:** kliknięcie zadania na liście rozwija jego podzadania (wiele poziomów, bez cykli). Podzadanie jest pełnym zadaniem (ma własne osoby, czas, status).
- **Osoba odpowiedzialna:** na liście, karcie Kanbanu i pasku osi czasu avatar przypisanej osoby jest po lewej stronie (przy wielu osobach – pierwsza i licznik „+N”).
- **Kafelki-filtry nad listą:** Wszystkie · Moje · Zaległe · W toku · Bez terminu. Kliknięty kafelek jest podświetlony i filtruje listę; ponowne kliknięcie zdejmuje filtr.
- **Panel filtrów z boku:** priorytety i statusy jako przełączane etykiety, etap, grupa, osoba, finansowanie, zakres terminów; pod filtrami małe wykresy dla przefiltrowanego zbioru (liczba wg statusu i priorytetu).
- **Szczegóły zadania** otwierają się w **panelu bocznym** (szybki podgląd bez opuszczania listy, osi czasu czy Kanbanu): opis, osoby, daty, podzadania, checklisty z postępem, czas, załączniki, komentarze, historia zadania.
- Pula grupy, przypisania z datą rozpoczęcia i zakończenia pracy, zaległość – wg FR-TASK-04, 05, 10.
- Usunięcie zadania utworzonego z szablonu finansowania wymaga uzasadnienia (P9).

### 4.5 Kanban

- Kolumny = 4 kategorie statusów, sekcje = statusy widoczne w projekcie (FR-TASK-07).
- Przeciągnięcie karty zmienia status (zapis w historii, powiadomienia – P5).
- Karta: tytuł, lewy pasek koloru priorytetu, avatar osoby, termin (czerwony, gdy zaległe), postęp checklisty.
- Te same filtry co lista zadań.

### 4.6 Oś czasu

Najważniejszy widok planowania; ma pokazywać na bieżąco, co dzieje się teraz.

- **Nawigacja:** przybliżanie i oddalanie (kółko myszy, gest), przesuwanie **w lewo i w prawo** (przeciągnięcie tła) oraz w górę i w dół między wierszami. Przyciski skali: **Dzień** (z podziałką godzinową), **Tydzień**, **Miesiąc** (z podziałką na dni), oraz **Dziś**.
- **Wiersze:** przełącznik „według osób” / „według etapów”.
- **Etapy** jako zakresy w tle; kliknięcie etapu rozwija listę jego zadań.
- **Kolory paska zadania:** lewy pasek = priorytet (od krytycznego do najniższego), tło = status (kolor statusu z ustawień).
- **Tworzenie zadania z osi:** zaznaczenie zakresu (kliknij i przeciągnij po pustym miejscu) otwiera okno szybkiego tworzenia z wypełnionymi datami i – w widoku „według osób” – przypisaną osobą. Bez osobnego przycisku „Dodaj zadanie”.
- **Zadania bez terminu:** pod osią lista kafelków „Do zaplanowania” (zadania bez dat, także przypisane, którym osoba musi ustawić daty). Przeciągnięcie kafelka na oś ustawia daty (i osobę w widoku „według osób”).
- **Zmiana terminu:** przeciągnięcie paska przesuwa daty, rozciągnięcie krawędzi zmienia początek albo koniec. Zapis w historii jako `rescheduled`.
- Obserwator i Użytkownik bez `task.plan` widzą oś tylko do odczytu.

AK: utworzenie zadania przez zaznaczenie zakresu 10–14 listopada daje zadanie z `start_date = 10.11`, `due_date = 14.11`; przeciągnięcie kafelka bez terminu na oś zapisuje daty jednym żądaniem `PATCH`.

### 4.7 Zespół

- **Graf zespołu:** organizacja → grupy → podgrupy → osoby, jako interaktywne drzewo albo graf (zwijanie gałęzi, przybliżanie, kliknięcie osoby otwiera jej kartę). W projekcie graf zaczyna się od grupy projektowej.
- **Wyszukiwanie osoby** podświetla jej miejsca w grafie.
- **Porównanie osób:** zaznaczenie dwóch (do czterech) osób pokazuje ich karty obok siebie: zadania zrobione / w toku / zaległe, godziny w wybranym okresie vs szacowane, wykres porównawczy. Cel: wyrównanie obciążenia – od razu widać, że jedna osoba ma 60 zadań w toku, a druga 1.
- Lista członków projektu z rolami w projekcie (FR-PRJ-06).

### 4.8 Finansowania

**Moduł organizacji (`/fundings`):**

- Lista finansowań: typ (grant, sponsoring, darowizna, wewnętrzne), nazwa, grantodawca, program, numer umowy, kwota i waluta, okres, termin raportowania.
- Szczegóły finansowania: opis, **szablony zadań** (wymogi), projekty, do których jest podpięte, zarejestrowany czas.
- **Każdy szablon jest obowiązkowy.** Nie ma szablonów opcjonalnych; działania nieobowiązkowe PM dodaje jako zwykłe zadania.
- Zmiana szablonu nie zmienia zadań już utworzonych w projektach.

**Zakładka projektu „Finansowania”:**

- Lista finansowań podpiętych do projektu (alokacja: okres i kwota, finansowanie główne). Kliknięcie finansowania rozwija jego zawartość.
- W rozwiniętym finansowaniu dwa przełączane widoki:
  - **Szablony** – wymogi finansowania (tylko do odczytu, z informacją, które zadanie z niego powstało),
  - **Zadania** – wszystkie realne zadania tego finansowania w projekcie: **kopie szablonów** (oznaczone „z szablonu”) i **zadania dodatkowe**, które PM podpiął do finansowania, bo są potrzebne do spełnienia wymogu (np. wymóg „transmisja wydarzenia” → zadanie dodatkowe „zakup kamery”).
- Z tego widoku edytuje się zadania (kopie), nie szablony.
- Pod listą: postęp zadań finansowania, budżet (alokacja, wydatki, pozostało), czas pracy.

AK: podpięcie finansowania z 3 szablonami tworzy w projekcie 3 zadania widoczne w widoku „Zadania” z oznaczeniem „z szablonu”; zadanie utworzone ręcznie z wybranym finansowaniem projektu pojawia się w tym samym widoku bez oznaczenia.

### 4.9 Budżet i wydatki

- Wydatek: typ (podróże, szkolenia, usługi zewnętrzne, sprzęt, inne), kwota, waluta, data, numer dokumentu, opis, opcjonalnie zadanie, skan dokumentu (limit 50 MB).
- Wydatek jest kosztem własnym projektu albo jest rozliczany z finansowania projektu (FR-COST-02).
- Raport budżetu: alokacja, wydatki, pozostało – dla finansowania i dla projektu; wykres wydatków w czasie i wg typu.
- Waluta wydatku rozliczanego z finansowania = waluta finansowania (walidacja w serwisie).

### 4.10 Czas pracy

- Wpis: data, godziny, opcjonalnie godziny od–do, opis; tylko osoba przypisana do zadania (FR-TIME-01, 02).
- Karta tygodnia osoby (`/time`): dni × zadania (FR-TIME-03).
- Zakładka projektu „Czas pracy”: według osób, według finansowania, według zadań; porównanie z czasem szacowanym, wykresy.

### 4.11 Checklisty, komentarze, załączniki, historia

Bez zmian względem `docs/wymagania.md` (FR-CHK, FR-COL, FR-HIST, FR-NOT): kilka checklist w zadaniu z kolejnością punktów i osobą odpowiedzialną, wątki komentarzy w zadaniu i projekcie, załączniki do zadań, komentarzy i wydatków, historia zadania, projektu i organizacji, powiadomienia z licznikiem nieprzeczytanych.

### 4.12 Przegląd organizacji

Strona startowa po zalogowaniu (`/overview`), dla osób z dostępem do wielu projektów (np. Dyrektor organizacji, Obserwator z zarządu):

- kafelki projektów z kondycją i postępem (kliknięcie → przegląd projektu),
- finansowania organizacji z budżetem (alokacje, wydatki, pozostało),
- czas pracy organizacji w tygodniach,
- zadania zaległe we wszystkich dostępnych projektach,
- najbliższe terminy etapów i raportowania finansowań.

Widoczne są tylko projekty z zakresu dostępu osoby.

### 4.13 Raporty i eksport

- **Raport projektu (PDF)** – generowany na żądanie dla wybranego okresu: dane projektu, kondycja, etapy z postępem, zadania zrobione w okresie i zaległe, czas pracy, finansowania i budżet, wykresy z dashboardu. Dostępny z przeglądu projektu (przycisk „Raport”).
- **Eksport CSV** – z listy zadań (z aktywnymi filtrami), czasu pracy i wydatków.
- Uprawnienie `report.view` (PDF) i `budget.export` (CSV z kwotami).

### 4.14 Administracja

- Organizacji: członkowie (zaproszenia, statusy, profil, blokada konta), grupy, role (własne i wbudowane), statusy zadań (4 kategorie, kolor, kolejność, domyślny), ustawienia (w tym progi kondycji), dziennik zdarzeń z filtrami.
- Systemu: lista organizacji i kont, blokowanie, zakładanie organizacji (FR-ADM-01).

---

## 5. Interfejs użytkownika

### 5.1 Szkielet z artifactu

Artifact „Front aplikacji PROMT” jest **wzorcem układu, nawigacji i zachowania** ekranów, a nie kodem produkcyjnym. Frontend w `frontend/` powstaje od nowa w React + TypeScript, ekran po ekranie według makiety, z danymi z API.

Zasady przeniesienia:

- Ekran jest gotowy, gdy ma odpowiednik każdej akcji z makiety i działa na prawdziwym API.
- Ręcznie pisany CSS z makiety **nie jest przenoszony**. Interfejs korzysta z gotowych komponentów, dostosowywanych tylko motywem i klasami.
- Rozwiązania z makiety, które zespół odrzucił (np. drugi układ szczegółów zadania), nie są przenoszone.

### 5.2 Technologia frontendu

| Obszar | Wybór | Uzasadnienie |
| --- | --- | --- |
| Komponenty | **shadcn/ui** (Radix + Tailwind) | darmowe, dostępne (klawiatura, ARIA), pasują do Tailwind już używanego w repo |
| Wykresy i graf zespołu | **ECharts** (`echarts-for-react`) | już w zależnościach; ma wykresy, drzewa i grafy. `recharts` do usunięcia (jedna biblioteka) |
| Oś czasu | **vis-timeline** | już w zależnościach; obsługuje przybliżanie, przesuwanie, zaznaczanie zakresu i przeciąganie z zewnątrz |
| Kanban | **@hello-pangea/dnd** | już w zależnościach |
| Stan i dane | Redux Toolkit + RTK Query, react-hook-form + zod | bez zmian |
| Tłumaczenia | **react-i18next** (nowa zależność) | teksty poza komponentami od pierwszego ekranu, PL domyślnie |

### 5.3 Wygląd

- **Motyw ciemny obowiązkowy**, jasny dostępny; domyślnie wg ustawień systemu, wybór zapamiętany w przeglądarce. Oba motywy spełniają kontrast WCAG 2.1 AA.
- **Kolory jako tokeny motywu**, nie wartości wpisane w komponentach. Paleta priorytetów (5 poziomów) i kolory statusów (z ustawień organizacji) muszą być czytelne w obu motywach.
- **Paski postępu** wszędzie, gdzie jest postęp: projekt, etap, finansowanie, checklista.
- **Wykresy są mile widziane** – statystyki na dashboardach, w zespole, czasie pracy i budżecie.
- **Kafelki liczbowe są klikalne** i działają jak filtry (podświetlenie aktywnego).
- Każda operacja zapisu daje potwierdzenie albo czytelny błąd (NFR-UX-04).

---

## 6. Architektura heksagonalna i trzy warianty bazy

### 6.1 Warstwy

Backend ma architekturę heksagonalną (porty i adaptery): w środku jest domena i przypadki użycia, które nie wiedzą nic o bazie ani o HTTP. Świat zewnętrzny łączy się z nimi wyłącznie przez **porty** (interfejsy), a **adaptery** te porty implementują. Szkielet katalogów jest na `main` w `backend/app/`.

```
                    React SPA
                        │ HTTP/JSON
                        ▼
  adapter/api ─────── Django + DRF: widoki, uwierzytelnianie (simplejwt), polecenia manage.py
                        │ wywołuje
                        ▼
  ports/api ───────── przypadki użycia (P1–P12 i zapytania widoków)
                        │
  domain/entities ─── encje domeny (dataclasses), reguły
  service/ ────────── implementacja przypadków użycia
                        │ korzysta z
                        ▼
  ports/spi ───────── repozytoria agregatów, UnitOfWork, IdGenerator, zapytania raportowe
                        │ implementują
       ┌────────────────┼──────────────────────────┐
       ▼                ▼                          ▼
  adapter/spi/      adapter/spi/              adapter/spi/
  relational        object_relational         nonrelational
  Django ORM        psycopg + ręczny SQL      PyMongo
  PostgreSQL        PostgreSQL (typy, ENUM,   MongoDB, replica set
  (22 tabele)       domeny, dziedziczenie)    (11 kolekcji + counters)

  adapter/dependencies_container.py – składa zależności przy starcie (AppConfig.ready)
```

### 6.2 Zasady

- **Reguła zależności:** `domain` i `service` nie importują Django, DRF, psycopg ani PyMongo. Zależności wskazują tylko do środka. Regułę pilnuje automatycznie `import-linter` w CI (nowa zależność deweloperska: kontrakt importów sprawdzany przy każdym PR).
- **Encje domeny** to czysty Python (`dataclasses`), identyfikatory `int`. Kontraktem portów są encje i DTO – nigdy `QuerySet`, wiersz psycopg ani surowy dokument BSON.
- **`adapter/api`** serializuje DTO z `ports/api` (serializer DRF albo Pydantic). Nie używa `ModelSerializer` na encjach domeny, bo działa on tylko z ORM.
- **Jedna instancja = jeden wariant bazy.** `dependencies_container` wybiera implementacje `ports/spi` na podstawie zmiennej `DATA_BACKEND` = `relational` | `object_relational` | `nonrelational`. Nie ma mieszania wariantów ani synchronizacji danych między nimi.
- **Konto i logowanie zostają w Django i PostgreSQL we wszystkich wariantach:** `user` (`AUTH_USER_MODEL`), sesje, panel admina, JWT. Warianty różnią się danymi domeny. W MongoDB są tylko odwołania `user_id` / `recipient_user_id` i kopia `display_name`.
- **Te same identyfikatory w każdej bazie:** `bigint` w PostgreSQL, `_id: long` w MongoDB, nadawane przez port `IdGenerator` (sekwencje w PostgreSQL, kolekcja `counters` w MongoDB, przy wsadach rezerwacja zakresu). Dzięki temu testy portów, adresy API i seed są identyczne dla trzech baz.
- **Logika i reguły są w serwisach i domenie**, więc działają tak samo na każdej bazie: izolacja organizacji, uprawnienia, statusy widoczne w projekcie, ochrona ostatniego administratora, waluta wydatku, `PROTECT` / `CASCADE` / `SET_NULL` tam, gdzie baza nie ma kluczy obcych. Ograniczenia w bazie (FK, CHECK, walidator `$jsonSchema`) są dodatkową ochroną, nie jedynym miejscem reguły.
- **Transakcje** przez port `UnitOfWork`: `transaction.atomic` (relacyjny), transakcja psycopg (obiektowo-relacyjny), `ClientSession.with_transaction` (MongoDB – wymaga replica setu, w Dockerze jednowęzłowego `rs0`).
- **Blokada optymistyczna:** korzenie agregatów z tablicami mają `version`; zapis `updateOne({_id, version})` z `$inc`, brak trafienia = konflikt współbieżności (409). Dla zgodności portu ta sama kolumna jest w obu wariantach PostgreSQL.
- **Izolacja organizacji:** każdy dokument domeny ma `organization_id` i jest on na początku każdego indeksu; bazowa klasa repozytorium zawsze dokłada filtr organizacji. W PostgreSQL ten sam warunek dokłada bazowe repozytorium adaptera.
- **Uprawnienia:** efektywne role osoby w projekcie to jedna operacja portu i jedno zapytanie na każdej bazie (w MongoDB jeden potok `members → $lookup groups → $lookup przodków`), zgodnie z NFR-PERF-03.

### 6.3 Porty

**`ports/api` – przypadki użycia** (wejście do aplikacji): procesy P1–P12 z rozdz. 8 oraz zapytania widoków: przegląd projektu i organizacji, oś czasu, Kanban, lista zadań z filtrami, graf zespołu, porównanie osób, raporty czasu i budżetu, historia, raport PDF i eksport CSV.

**`ports/spi` – wyjście do danych.** Jeden agregat domeny = jedno repozytorium (w MongoDB = jeden dokument). Adaptery relacyjne rozkładają agregat na tabele.

| Port | Agregat i jego części |
| --- | --- |
| `OrganizationRepository` | organizacja z ustawieniami, statusami i rolami organizacji |
| `MemberRepository` | członkostwo z profilem służbowym, przynależnością do grup i nadaniami ról; wyszukiwanie; efektywne role |
| `GroupRepository` | grupa z hierarchią (przodkowie), grupy projektowe |
| `ProjectRepository` | projekt z etapami, podpięciami finansowań i statusami projektu |
| `FundingRepository` | finansowanie z szablonami zadań |
| `TaskRepository` | zadanie z przypisaniami, checklistą i załącznikami; podzadania, pula grupy |
| `TimeEntryRepository` | wpisy czasu, karta tygodnia |
| `CommentRepository` | wątki komentarzy z załącznikami |
| `ExpenseRepository` | wydatki z załącznikami |
| `ActivityLogRepository` | dziennik zdarzeń – adapter nie ma operacji update ani delete |
| `NotificationRepository` | skrzynka odbiorcy (konto), nieprzeczytane |
| `UnitOfWork` | transakcja obejmująca wiele repozytoriów |
| `IdGenerator` | identyfikatory `long` niezależne od bazy |
| `ReportQueries` | agregaty tylko do odczytu: dashboardy, kondycja, porównanie osób, sumy czasu i budżetu, dane do PDF i CSV |

`ReportQueries` to propozycja tego dokumentu (patrz D8). Agregaty dashboardów liczy się w każdej bazie inaczej (SQL `GROUP BY`, potok agregacji MongoDB na skopiowanych polach), więc to osobny port, a nie metody repozytoriów. To też jeden z głównych punktów porównania baz.

### 6.4 Ograniczenia każdej bazy i jak je obchodzimy

| Ograniczenie | Rozwiązanie |
| --- | --- |
| Django ORM nie obsłuży MongoDB | adapter `nonrelational` na PyMongo, poza `DATABASES`; mapuje dokument ↔ encję bez modeli Django. `django-mongodb-backend` odpada, bo zakłada klucze ObjectId |
| ORM nie obsłuży typów obiektowych i dziedziczenia PostgreSQL | adapter `object_relational` na psycopg i ręcznym SQL |
| MongoDB nie ma kluczy obcych ani `on_delete` | spójność odwołań sprawdza serwis / adapter przy zapisie: `PROTECT` = `countDocuments` przed usunięciem, `CASCADE` / `SET_NULL` = `deleteMany` / `updateMany` w tej samej transakcji |
| Unikalność wewnątrz tablicy jednego dokumentu (nazwa roli, jeden domyślny status, jedno główne finansowanie) | indeks tego nie zapewni → reguła domeny + warunek w filtrze `updateOne` |
| Limit 16 MB dokumentu | osadzane są tylko tablice ograniczone w domenie; dane rosnące bez końca (czas, komentarze, wydatki, historia, powiadomienia) to osobne kolekcje |
| Kopie danych w MongoDB | tylko pola niezmienne lub rzadko zmieniane (`status_category`, `organization_id`, `display_name`, odwołania w `time_entries` i `expenses`), każda kopia ma wskazane źródło |
| Typy | `Decimal` ↔ `Decimal128`, data jako 00:00 UTC, plik jako klucz w magazynie plików |

### 6.5 Schemat i migracje w każdym wariancie

| Wariant | Definicja schematu | Polecenie |
| --- | --- | --- |
| Relacyjny | migracje Django (konto i tabele Django + 22 tabele domeny) | `manage.py migrate` |
| Obiektowo-relacyjny | migracje Django dla konta + wersjonowane pliki SQL (typy, domeny, tabele, dziedziczenie) w osobnej bazie | `manage.py migrate` + `manage.py migrate_or` |
| Dokumentowy | migracje Django dla konta + kolekcje, walidatory `$jsonSchema` (`validationLevel: strict`), indeksy, TTL powiadomień | `manage.py migrate` + `manage.py init_mongo` |

Każde polecenie jest idempotentne i odtwarza schemat na pustej bazie (NFR-MAINT-05).

---

## 7. Model danych

### 7.1 Model logiczny (wspólny)

Wszystkie warianty przechowują te same dane logiczne:

| Obszar | Encje |
| --- | --- |
| Ludzie i dostęp | User, Organization, OrganizationMember, MemberGroup, MemberGroupMember, Role, RoleAssignment |
| Praca | Project, Milestone, TaskStatus, Task, TaskAssignment, ChecklistItem, TimeEntry |
| Finanse | Funding, ProjectFunding, TaskTemplate, Expense |
| Współpraca i ślad | Comment, Attachment, ActivityLog, Notification |

Szczegóły pól, ograniczeń i kryteriów akceptacji wariantu relacyjnego: diagram `er-1-relacyjny.drawio` i specyfikacja modeli z wersji 1.1 tego dokumentu (rozdz. 4), z poprawkami z 7.3.

### 7.2 Odwzorowanie w wariantach

| Element logiczny | Relacyjny (22 tabele) | Obiektowo-relacyjny | Dokumentowy (11 kolekcji + `counters`) |
| --- | --- | --- | --- |
| Konto (`user`), sesje, admin | PostgreSQL, Django | PostgreSQL, Django | PostgreSQL, Django; w dokumentach tylko `user_id` i kopia `display_name` |
| Statusy, role organizacji | tabele `task_status`, `role` | tabele z ENUM `status_category_t` | `organizations.statuses[]`, `organizations.roles[]`; statusy projektu w `projects.statuses[]` |
| Członkostwo w grupie | tabela łącząca | `member_ids bigint[]` | `members.groups[]` |
| Nadania ról | `role_assignment` | tabela z typem kontekstu | `members.role_grants[]` / `groups.role_grants[]` (osoba albo grupa wynika z miejsca) |
| Hierarchia grup | `parent_id` | `parent_id` | `parent_id` + kopia `ancestor_ids` |
| Etapy, podpięcia finansowań | tabele | tabele, `allocation daterange` | `projects.milestones[]`, `projects.fundings[]` |
| Szablony zadań | `task_template` | tabela | `fundings.templates[]` |
| Przypisania, checklista, załączniki zadania | tabele | `checklist_item_t[]`, `attachment_t[]` | `tasks.assignments[]`, `tasks.checklist[]`, `tasks.attachments[]` |
| Kwota + waluta | dwie kolumny | `money_t` | `amount: {value: Decimal128, currency}` |
| Wspólne cechy projektu, etapu, zadania | powtórzone kolumny | dziedziczenie z `work_item` | – |
| Historia, powiadomienia | tabele | tabele z `jsonb` | `activity_logs`, `notifications` (TTL) |
| Identyfikatory | sekwencje `bigint` | sekwencje `bigint` | `_id: long` z `counters` (port `IdGenerator`) |

### 7.3 Zmiany schematu wynikające z tego PRD

Każda zmiana obowiązuje we **wszystkich trzech wariantach** (diagram relacyjny, `obiektowo-relacyjny.md`, `nosql-mongodb.md`).

| # | Zmiana | Powód |
| --- | --- | --- |
| Z1 | `task_template.mandatory` – usunięte; każdy szablon obowiązkowy | ustalenie zespołu (4.8) |
| Z2 | `task.from_template` bool – kopiowane przy tworzeniu zadania z szablonu | ochrona zadań z szablonu nie może zależeć od żywego szablonu (`template_id` może zostać wyzerowane) |
| Z3 | `role.code` NULL, unikalny w organizacji; kody ról wbudowanych z 3.2 | rozpoznanie roli administratora i ról wbudowanych niezależnie od nazwy |
| Z4 | `member_group.organization` NOT NULL, nowe `member_group.project_id` NULL | izolacja; grupy projektowe (3.3) |
| Z5 | `project_funding.allocated_amount` | budżet finansowania w projekcie (4.3, 4.8) |
| Z6 | `task_assignment.removed_at` | odpięcie osoby, która zarejestrowała czas |
| Z7 | `time_entry.work_date` NOT NULL, `started_at` NULL | wpis „3 h we wtorek” bez wymyślania godziny |
| Z8 | `activity_log.project_id` (bez FK) + indeks | historia projektu jednym zapytaniem |
| Z9 | `notification.created_at` | sortowanie i retencja (`organization_id` – patrz D7) |
| Z10 | `organization_member.created_at` | data zaproszenia |
| Z11 | `task.created_by` | autor zadania bez złączenia z historią |
| Z12 | `organization.settings`: progi kondycji projektu | reguły z 4.3 |
| Z13 | `version` int w korzeniach agregatów z tablicami (organizacja, członkostwo, grupa, projekt, finansowanie, zadanie) | blokada optymistyczna (6.2), ten sam kontrakt portu w trzech bazach |
| Z14 | `expense.project_id` zawsze wymagane, `project_funding` opcjonalne | raport budżetu projektu bez `OR`; tak już w modelu dokumentowym |

Z5–Z11 i Z14 pochodzą z analizy `docs/analiza-prd-i-modeli.md` (A1, A3–A8, B2, B3), tam są pełne uzasadnienia. Z13 i Z14 są już w modelu dokumentowym (`nosql-mongodb-heksagonalny.drawio`).

---

## 8. Procesy biznesowe

Procesy są przypadkami użycia z `ports/api`, implementowanymi raz, w `service/`. Kryteria akceptacji są testami kontraktowymi uruchamianymi **na każdym z trzech adapterów** (rozdz. 13).

| # | Proces | Kryteria akceptacji (skrót) |
| --- | --- | --- |
| P1 | Podpięcie finansowania tworzy zadania z szablonów | po jednym zadaniu na szablon, z `from_template`, `project_funding`, terminem = początek alokacji + `default_due_days`; błąd przy dowolnym zadaniu wycofuje całość; drugie podpięcie tego samego finansowania odrzucone |
| P2 | Założenie organizacji | statusy we wszystkich 4 kategoriach, jeden domyślny; role wbudowane z 3.2; grupy „Administratorzy” i „Kontroler finansowy”; twórca aktywnym administratorem |
| P3 | Zaproszenie, przyjęcie, zmiana statusu członka | `invited → active` z datą; zawieszenie ostatniego administratora odrzucone; zawieszony nie widzi danych organizacji |
| P4 | Nadanie roli i wyliczenie uprawnień | dziedziczenie z grup nadrzędnych; rola projektu A nie działa w B; jedno zapytanie |
| P5 | Zmiana statusu zadania | wpis `status_changed` + po jednym powiadomieniu na odbiorcę (bez autora); błąd powiadomień wycofuje zmianę |
| P6 | Pula grupy i praca nad zadaniem | wzięcie tylko przez członka grupy; czas tylko z przypisaniem |
| P7 | Ukrycie statusu organizacji w projekcie | nie da się ukryć statusu z zadaniami ani statusu domyślnego używanego przez P1 |
| P8 | Wydatek z dokumentem | rozliczany z finansowania wskazuje podpięcie; ta sama waluta; wpis w historii |
| P9 | Usunięcie zadania z szablonu | bez uzasadnienia odrzucone; z uzasadnieniem – wpis z treścią uzasadnienia; usunięcie zadania nadrzędnego nie omija tej reguły dla podzadań |
| P10 | Przypomnienia o terminach | jutro i po terminie, kategorie todo / w toku; ponowne uruchomienie tego dnia bez duplikatów |
| P11 | Utworzenie projektu | grupa projektowa „organizacja · projekt”; właściciel z rolą PM w projekcie |
| P12 | Planowanie z osi czasu | utworzenie zadania z zakresem dat i osobą jednym żądaniem; zmiana dat zapisuje `rescheduled` |

---

## 9. Specyfikacja API

REST, JSON, prefiks `/api/`, warstwa `adapter/api`. Identyfikatory są liczbami całkowitymi w każdym wariancie bazy (6.2). Dane organizacji zawsze pod `/api/orgs/{org}/…`, więc izolacja jest widoczna w adresie i sprawdzana w jednym miejscu. Zapis agregatu ze starą wartością `version` zwraca 409. Listy stronicowane, najwyżej 100 elementów (NFR-PERF-05). Dokumentacja OpenAPI pod `/api/docs` (FR-ADM-02).

| Metoda | Ścieżka | Cel |
| --- | --- | --- |
| GET | `/api/health` | stan aplikacji i wariant bazy |
| POST | `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` | JWT |
| GET/PATCH | `/api/me` | profil konta, zmiana hasła |
| GET | `/api/me/organizations` | organizacje osoby |
| GET/POST | `/api/me/notifications`, `/api/me/notifications/read` | skrzynka, oznaczanie przeczytanych |
| GET/PATCH | `/api/orgs/{org}` | organizacja i ustawienia |
| GET | `/api/orgs/{org}/overview` | przegląd organizacji (4.12) |
| GET/POST | `/api/orgs/{org}/members` | lista z wyszukiwaniem i filtrami, zaproszenie |
| GET/PATCH | `/api/orgs/{org}/members/{id}` | profil, status, „gdzie jest osoba” |
| GET | `/api/orgs/{org}/members/compare?ids=…` | porównanie 2–4 osób (4.7) |
| GET/POST/PATCH/DELETE | `/api/orgs/{org}/groups[/{id}]` | drzewo grup, członkowie grupy |
| GET/POST/PATCH/DELETE | `/api/orgs/{org}/roles[/{id}]`, `/role-assignments` | role i nadania |
| GET/POST/PATCH/DELETE | `/api/orgs/{org}/statuses[/{id}]` | statusy organizacji i projektu, ukrywanie |
| GET/POST | `/api/orgs/{org}/projects` | projekty w zakresie dostępu |
| GET/PATCH/DELETE | `/api/orgs/{org}/projects/{id}` | szczegóły, zamknięcie, usunięcie (3.5) |
| GET | `/api/orgs/{org}/projects/{id}/overview` | dashboard projektu z kondycją (4.3) |
| GET | `/api/orgs/{org}/projects/{id}/timeline?from=&to=&rows=` | dane osi czasu (zadania, etapy, zadania bez terminu) |
| GET | `/api/orgs/{org}/projects/{id}/team` | graf zespołu projektu |
| GET | `/api/orgs/{org}/projects/{id}/time-report`, `/budget`, `/history` | raporty i historia projektu |
| GET/POST/PATCH/DELETE | `/api/orgs/{org}/projects/{id}/milestones[/{mid}]` | etapy |
| GET/POST/DELETE | `/api/orgs/{org}/projects/{id}/fundings[/{pf}]` | podpięcia (P1) |
| GET | `/api/orgs/{org}/projects/{id}/fundings/{pf}/tasks` | zadania finansowania: z szablonu i dodatkowe |
| GET/POST/PATCH/DELETE | `/api/orgs/{org}/fundings[/{id}]`, `/fundings/{id}/templates` | finansowania i szablony |
| GET/POST | `/api/orgs/{org}/tasks` | lista z filtrami (projekt, moje, zaległe, bez terminu, …), tworzenie |
| GET/PATCH/DELETE | `/api/orgs/{org}/tasks/{id}` | szczegóły, zmiana (także dat i statusu), usunięcie z uzasadnieniem |
| POST/DELETE | `/api/orgs/{org}/tasks/{id}/assignments`, `/take` | przypisania, wzięcie z puli |
| GET/POST/PATCH/DELETE | `/api/orgs/{org}/tasks/{id}/checklist`, `/time-entries`, `/comments`, `/attachments` | elementy zadania |
| GET/POST/PATCH | `/api/orgs/{org}/expenses` | wydatki |
| GET | `/api/orgs/{org}/activity` | dziennik zdarzeń z filtrami |
| GET | `/api/orgs/{org}/projects/{id}/report.pdf?from=&to=` | raport PDF |
| GET | `/api/orgs/{org}/export/{tasks\|time\|expenses}.csv` | eksport z filtrami listy |
| GET/PATCH | `/api/admin/organizations`, `/api/admin/users` | panel administratora systemu |

Kody błędów: 400 walidacja (z polem i kodem reguły), 401, 403 brak uprawnienia, 404 także dla obiektów innej organizacji (nie ujawniamy istnienia), 409 konflikt reguły (np. ostatni administrator, duplikat podpięcia).

---

## 10. Zadania w tle, raporty i powiadomienia

- **Przypomnienia o terminach (P10):** polecenie `manage.py send_reminders` uruchamiane raz dziennie przez harmonogram kontenera. Tworzy powiadomienia w aplikacji.
- **E-mail** (zaproszenia, reset hasła, przypomnienia) jest **wyłączalny** (`EMAIL_ENABLED`). Bez skonfigurowanego serwera SMTP aplikacja działa w pełni: zaproszenie pokazuje link do skopiowania, a powiadomienia są tylko w aplikacji.
- **Raport PDF** generowany synchronicznie z szablonu HTML (WeasyPrint w kontenerze backendu); wykresy jako SVG. Limit czasu 30 s; przy dużych projektach możliwe przejście na zadanie w tle w kolejnej wersji.
- **Retencja:** powiadomienia 180 dni (TTL w MongoDB, polecenie czyszczące w wariantach PostgreSQL), historia wg ustawień organizacji (NFR-AUD-02).

---

## 11. Wymagania niefunkcjonalne

Obowiązują wszystkie NFR z `docs/wymagania.md`. Dodatkowo:

| ID | Wymaganie | Kryterium akceptacji |
| --- | --- | --- |
| NFR-DB-01 | Każdy wariant bazy realizuje całe API | 100% testów kontraktowych portów zielonych na każdym adapterze |
| NFR-DB-02 | Ten sam wynik na każdej bazie | dla tego samego seeda odpowiedzi `/overview`, list zadań i raportu budżetu są identyczne, łącznie z identyfikatorami |
| NFR-ARCH-01 | Reguła zależności architektury heksagonalnej | `import-linter` w CI: `domain` i `service` bez importów Django, DRF, psycopg, PyMongo; `ports` bez importów adapterów |
| NFR-DB-03 | Izolacja organizacji niezależna od bazy | testy NFR-SEC-01 uruchamiane na trzech wariantach |
| NFR-DB-04 | Porównywalność | ten sam deterministyczny zbiór danych (`seed --seed S`) we wszystkich wariantach; pomiary wg rozdz. 13.4 |
| NFR-PERF-06 | Dashboard projektu | `/overview` \< 500 ms (p95) dla projektu z 2 000 zadań na każdym wariancie |
| NFR-PERF-07 | Oś czasu | dane osi dla 500 zadań \< 300 ms; przewijanie i przybliżanie płynne (bez ponownego pobierania przy każdym ruchu) |
| NFR-UX-06 | Motyw ciemny | wszystkie ekrany w obu motywach; kontrast AA sprawdzony automatycznie (axe w testach E2E) |
| NFR-UX-07 | Tłumaczenia | brak tekstów wpisanych w komponenty (lint); komplet kluczy PL |
| NFR-UX-08 | Gotowe komponenty | brak własnych plików CSS poza motywem i tokenami |

---

## 12. Struktura projektu

Backend według szkieletu architektury heksagonalnej z `main` (`backend/app/`). Stary pakiet `backend/api/` zostaje tylko jako źródło modeli Django dla adaptera relacyjnego i jest wygaszany w F0–F2.

```
backend/
  app/
    domain/
      entities/        encje domeny (dataclasses), enumy, katalog uprawnień, reguły
    service/           przypadki użycia P1–P12 i zapytania widoków
    ports/
      api/             interfejsy przypadków użycia + DTO wejścia/wyjścia
      spi/             repozytoria agregatów, UnitOfWork, IdGenerator, ReportQueries
    adapter/
      apps.py          AppConfig.ready → dependencies_container
      dependencies_container.py   wybór adapterów wg DATA_BACKEND
      api/             DRF: widoki, serializery DTO, uwierzytelnianie, uprawnienia,
                       raporty PDF i CSV, polecenia manage.py
      spi/
        relational/        entities/ (modele Django), repository/
        object_relational/ SQL schematu, repozytoria na psycopg
        nonrelational/     walidatory, indeksy, repozytoria na PyMongo
  core/                ustawienia Django (konto, sesje, JWT – zawsze PostgreSQL)
  tests/
    unit/              domena i serwisy na adapterach w pamięci
    contract/          testy portów spi – ten sam zestaw na trzech adapterach
    api/               endpointy, izolacja, uprawnienia
frontend/src/
  app/                 routing, store, motyw, i18n
  components/ui/       komponenty shadcn/ui
  features/            overview, projects, tasks, kanban, timeline, team,
                       fundings, budget, time, reports, admin, auth
docs/
  PRD-promt-2.0.md, wymagania.md, przypadki-uzycia/, schemat/, badania/ (wyniki pomiarów)
```

---

## 13. Strategia testów

### 13.1 Backend

- **Testy jednostkowe domeny i serwisów** na adapterach w pamięci (implementacje `ports/spi` na słownikach) – szybkie, bez bazy: reguły, uprawnienia, kondycja projektu, procesy. Architektura heksagonalna daje to bez mockowania ORM.
- **Testy kontraktowe portów** – jeden zestaw, parametryzowany adapterem (`relational`, `object_relational`, `nonrelational`), na prawdziwych bazach w Dockerze. Obejmują wszystkie porty z 6.3 i procesy P1–P12. Ten sam seed i te same identyfikatory w każdym wariancie.
- **Testy API** – endpointy, kody błędów, izolacja organizacji, macierz ról (3.6); w CI na wariancie relacyjnym, pełny przebieg na trzech wariantach przed scaleniem do `main`.
- **Kontrakt importów** (`import-linter`) – NFR-ARCH-01.
- Testy liczby zapytań dla list (NFR-PERF-04) w wariancie relacyjnym.

### 13.2 Frontend

- Vitest + Testing Library + MSW: formularze, filtry, kafelki-filtry, oś czasu (tworzenie z zakresu, przeciąganie), porównanie osób.
- Playwright E2E: logowanie i wybór organizacji, przegląd projektu, zadanie od utworzenia na osi czasu do zamknięcia na Kanbanie, podpięcie finansowania, wydatek, raport PDF, administracja ról.

### 13.3 Bramki jakości

ruff, mypy strict, eslint, tsc strict, pokrycie logiki backendu ≥ 70% (NFR-MAINT-03); każda zmiana przez PR z CI (NFR-MAINT-04).

### 13.4 Pomiary porównawcze

Polecenie `manage.py benchmark --scenario all` (na instancji z danym `DATA_BACKEND`) zapisuje wyniki do CSV w `docs/badania/`.

| Scenariusz | Operacja |
| --- | --- |
| B1 | Kanban projektu z 500 zadaniami |
| B2 | „Moje zadania” osoby w 20 projektach |
| B3 | Dane osi czasu projektu (miesiąc) |
| B4 | Dashboard projektu (`/overview`) |
| B5 | Raport budżetu finansowania podpiętego do 5 projektów |
| B6 | Historia projektu (ostatnie 100 zdarzeń) |
| B7 | Sprawdzenie uprawnienia (efektywne role) |
| B8 | Odhaczenie punktu checklisty |
| B9 | Podpięcie finansowania z 10 szablonami (transakcja) |

Rozmiar zbioru: 100 organizacji, 100 000 zadań (NFR-SCAL-01); scenariusz rozszerzony 1 mln zadań – D6. Każdy scenariusz: rozgrzewka, 30 powtórzeń, mediana i p95.

---

## 14. Uruchomienie i środowisko

- `docker compose up` uruchamia frontend, backend i bazę wybranego wariantu (NFR-PORT-01). PostgreSQL działa zawsze (konto, sesje, admin). Profile Compose: `relational` (domena w tej samej bazie PostgreSQL), `object_relational` (domena w osobnej bazie PostgreSQL), `nonrelational` (dodatkowo MongoDB ≥ 7.0 jako jednowęzłowy replica set `rs0`).
- Wariant wybiera `DATA_BACKEND` w `.env`; wartości przykładowe w `.env.example`. Sekrety tylko w `.env` (NFR-SEC-07).
- Dane demonstracyjne: `manage.py seed --orgs N --tasks M --seed S` – ten sam zbiór logiczny i te same identyfikatory w każdym wariancie (FR-ADM-03).
- Wszystkie narzędzia są darmowe i działają lokalnie; brak zależności od płatnych usług.

---

## 15. Plan etapów

Kolejność; bez dat. Etapy F5 i F6 mogą iść równolegle z F3–F4, gdy porty z F1 są zamknięte – to bezpośrednia korzyść z architektury heksagonalnej.

| Etap | Zakres | Gotowe, gdy |
| --- | --- | --- |
| F0 – Porządki | szkielet `backend/app` spójny i zarejestrowany (`AppConfig` z poprawną nazwą i funkcją kontenera, wpis w `INSTALLED_APPS`); aplikacja startuje bez odwołań do starych modeli; decyzje D1–D8 podjęte; zmiany Z1–Z14 na diagramach trzech wariantów | `manage.py check` i CI zielone; `import-linter` skonfigurowany; rejestr decyzji bez otwartych pozycji blokujących |
| F1 – Domena, porty, adapter relacyjny | encje domeny, `ports/api` i `ports/spi`, `UnitOfWork`, `IdGenerator`, serwisy P1–P12, adaptery w pamięci, `adapter/spi/relational`, seed | testy jednostkowe i kontraktowe zielone na adapterze relacyjnym |
| F2 – API | endpointy z rozdz. 9, JWT, uprawnienia, OpenAPI | testy API (w tym izolacja i macierz ról) zielone; `/api/docs` kompletne |
| F3 – Frontend | shadcn/ui, motyw ciemny, i18n; ekrany wg mapy z rozdz. 4 na prawdziwym API, w kolejności: projekty i zadania → Kanban i oś czasu → przegląd projektu → zespół → finansowania i budżet → administracja | każda trasa makiety ma odpowiednik w React; E2E ścieżek z 13.2 zielone |
| F4 – Raporty i powiadomienia | PDF, CSV, przypomnienia, retencja | raport PDF dla projektu z seeda generuje się \< 30 s; P10 bez duplikatów |
| F5 – Adapter obiektowo-relacyjny | schemat SQL, `migrate_or`, `adapter/spi/object_relational` | 100% testów kontraktowych i API zielonych z `DATA_BACKEND=object_relational` |
| F6 – Adapter dokumentowy | kolekcje, walidatory, indeksy, `counters`, `init_mongo`, `adapter/spi/nonrelational` | 100% testów kontraktowych i API zielonych z `DATA_BACKEND=nonrelational` |
| F7 – Badania | pomiary B1–B9 na trzech wariantach, porównanie w `docs/badania/` | CSV z wynikami trzech wariantów i opis wniosków |

---

## 16. Decyzje i otwarte kwestie

### 16.1 Do decyzji zespołu

| # | Kwestia | Propozycja |
| --- | --- | --- |
| D1 | Dyrektor organizacji i Administrator organizacji – jedna rola czy dwie? | dwie: dyrektor = decyzje biznesowe i usuwanie, administrator = ludzie i ustawienia |
| D2 | Zakres Dyrektora projektu ponad PM | nadawanie ról w projekcie (w tym PM), zamykanie i archiwizacja projektu |
| D3 | Przegląd organizacji – te same widżety co przegląd projektu, zagregowane? | tak, w zakresie z 4.12 |
| D4 | Progi kondycji projektu | wartości z 4.3, edytowalne w ustawieniach organizacji |
| D5 | Alerty (`alert_raised`, `alert_resolved` w modelu) i brak akcji `checked` | alert = zmiana kondycji projektu na „Wymaga uwagi” / „Zagrożony”; dodać `checked` |
| D6 | Rozmiar zbioru w pomiarach: 100 000 czy 1 mln zadań | oba: 100 000 jako podstawowy, 1 mln jako rozszerzony |
| D7 | `notification.organization_id`: analiza (A6) chce go do filtrowania po bieżącej organizacji i ukrywania przypomnień po odejściu z niej; model dokumentowy go pomija (odbiorcą jest konto, klucz shardu `recipient_user_id`) | dodać jako pole opcjonalne (bez wpływu na klucz shardu), we wszystkich wariantach |
| D8 | Agregaty dashboardów i raportów jako osobny port `ReportQueries` | tak – zapytania tylko do odczytu, implementowane w każdym adapterze osobno |
| D9 | Nazwa zmiennej wyboru adaptera (na diagramie oznaczona jako propozycja) | `DATA_BACKEND` = `relational` \| `object_relational` \| `nonrelational` |

### 16.2 Ustalone

| Decyzja | Uzasadnienie |
| --- | --- |
| Architektura heksagonalna (`backend/app` na `main`) | jedna domena i jedne porty, trzy adaptery bazy; adaptery można rozwijać równolegle |
| Konto, sesje, admin i JWT zawsze w Django i PostgreSQL | warianty porównują dane domeny; logowanie nie zależy od wariantu |
| Identyfikatory `long` we wszystkich bazach (`IdGenerator`, w MongoDB `counters`) | te same testy portów, adresy API i seed dla trzech baz |
| Adapter MongoDB na PyMongo, bez `django-mongodb-backend` | backend Django zakłada klucze ObjectId, a domena ma `int` |
| Szczegóły zadania w panelu bocznym (drugi układ z makiety usunięty) | szybki podgląd bez opuszczania listy, osi czasu i Kanbanu |
| Wszystkie szablony obowiązkowe | działania opcjonalne to zwykłe zadania |
| Lista członków organizacji bez podziału na sekcje; struktura w grupach | czytelność, filtrowanie po grupach |
| Komentarze i historia poza przeglądem projektu | przegląd ma pokazywać stan, nie strumień zdarzeń |
| Gotowe komponenty zamiast ręcznego CSS | utrzymanie; ręczny CSS makiety był trudny w naprawach |
| Motyw ciemny obowiązkowo | wymóg zespołu |
| Jedna biblioteka wykresów (ECharts) | mniej zależności; obsługuje też graf zespołu |
| Usuwanie obiektów nadrzędnych tylko Dyrektor organizacji i administratorzy | PM nie może „rozjechać” projektu |

### 16.3 Otwarte z analizy poprzedniej wersji

Sprzeczności W1–W4 i luki K4–K8 z `docs/analiza-prd-i-modeli.md` (m.in. `TimeEntry` PROTECT vs usuwanie zadań, kaskadowe usuwanie podzadań z pominięciem P9, ukrycie statusu domyślnego) muszą być rozstrzygnięte w F0 i obowiązują we wszystkich wariantach.

---

## 17. Słownik

| Termin | Znaczenie |
| --- | --- |
| **Organizacja** | firma lub instytucja; właściciel wszystkich danych poza kontem osoby |
| **Członkostwo** | przynależność osoby do organizacji z profilem służbowym i statusem |
| **Grupa** | zbiór członków z hierarchią; może mieć role; grupa projektowa należy do projektu |
| **Rola** | nazwany zestaw kodów uprawnień, nadawany osobie albo grupie, w organizacji albo w projekcie |
| **Dostęp kaskadowy** | rola w organizacji obejmuje wszystkie jej projekty |
| **Etap** | część projektu z terminem; postęp = odsetek zrobionych zadań |
| **Finansowanie** | źródło środków (grant, sponsoring, darowizna, wewnętrzne) z kwotą, okresem i wymogami |
| **Szablon zadania** | obowiązkowy wymóg finansowania; po podpięciu do projektu staje się zadaniem |
| **Zadanie dodatkowe finansowania** | zwykłe zadanie projektu podpięte do finansowania, potrzebne do spełnienia wymogu |
| **Kondycja projektu** | wynik reguł z 4.3: W porządku / Wymaga uwagi / Zagrożony |
| **Wariant bazy** | jedna z trzech implementacji danych: relacyjna, obiektowo-relacyjna, dokumentowa |
| **Architektura heksagonalna** | układ, w którym domena i przypadki użycia są w środku, a baza i HTTP łączą się z nimi tylko przez porty i adaptery |
| **Port** | interfejs na granicy aplikacji: `ports/api` (wejście – przypadki użycia), `ports/spi` (wyjście – dane) |
| **Adapter** | implementacja portu dla konkretnej technologii: DRF (`adapter/api`) albo baza (`adapter/spi/...`) |
| **Agregat** | encja z częściami zapisywanymi razem (np. projekt z etapami); jeden agregat = jedno repozytorium |
| **Repozytorium** | port `spi` do zapisu i odczytu jednego agregatu, z implementacją w każdym adapterze bazy |
| **DTO** | obiekt danych na granicy portu, niezależny od bazy i HTTP |
| **Blokada optymistyczna** | wykrycie równoczesnej edycji przez porównanie pola `version` przy zapisie |
| **Test kontraktowy** | test uruchamiany bez zmian na każdym wariancie bazy |
