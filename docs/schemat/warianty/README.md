# Warianty modelu danych PROMT 2.0

Ten sam zakres danych zaprojektowany na kilka sposobów – materiał do porównań i sprawozdań.

## Modele relacyjne (diagramy ER, notacja crow's foot)

| Plik | Koncepcja | Tabele |
|---|---|---|
| `er-1-relacyjny.drawio` | model zrównoważony – 3NF z praktycznymi uproszczeniami (schemat wdrażany w aplikacji) | 22 |
| `er-2-maksymalnie-rozbity.drawio` | maksymalna dekompozycja – słowniki, tabele łączące zamiast kolumn „albo–albo” | 62 |
| `er-3-NOWA.drawio` | model zagregowany – wariant 1 z tabelami zależnymi (checklista, załączniki, członkowie grup, szablony, powiadomienia) jako jsonb w tabeli nadrzędnej; te same dane, mniej tabel | 17 |

Końce linii: `||` dokładnie jeden · `|o` zero lub jeden · `|<` jeden lub wiele · `o<` zero lub wiele.

## Inne paradygmaty

| Pliki | Model |
|---|---|
| `nosql-mongodb.drawio`, `nosql-mongodb.md` | dokumentowy (MongoDB), pierwsza wersja: kolekcje, dokumenty osadzone, odwołania, indeksy, zapytania |
| `nosql-mongodb-2.0.drawio` | aktualny model dokumentowy (MongoDB), wersja do oddania: 6 zakładek — przegląd, organizacja i dostęp, projekty i finansowanie, zadania i czas, współpraca i zdarzenia, spójność i architektura; 11 kolekcji biznesowych + counters |
| `obiektowo-relacyjny.drawio`, `obiektowo-relacyjny.md` | obiektowo-relacyjny (PostgreSQL): typy złożone, ENUM, domeny, dziedziczenie, tablice, zakresy |

Diagramy przypadków użycia: `docs/przypadki-uzycia/`.
Pliki `.drawio` otwiera rozszerzenie Draw.io Integration w VS Code albo https://app.diagrams.net.

W aktualnym modelu pola, typy, limity tablic i indeksy odpowiadają definicjom z
`backend/app/adapter/spi/nonrelational/models`. Jasne tło i jednolite oznaczenia ułatwiają
wydruk oraz eksport. Reguły aplikacji i architektura docelowa są oznaczone jako projekt;
zaimplementowano schematy, walidatory, indeksy i inicjalizację bazy. Starsze pliki NoSQL
pozostają wariantami historycznymi.

## Uruchomienie schematu MongoDB 2.0

Przy aktualizacji istniejącej instalacji **przed pierwszym `up`** zabezpiecz dane.
Poprzednia konfiguracja używała anonimowego wolumenu obrazu MongoDB; nowy `mongo_data`
nie przejmie go automatycznie. Zapisz nazwę starego wolumenu z `docker inspect promt_mongo`,
wstrzymaj zapisy aplikacji i wykonaj logiczną kopię przez `mongodump`, zapisując archiwum
poza kontenerem. Po uruchomieniu nowego replica setu odtwórz ją przez `mongorestore`,
uzupełnij dane opisane poniżej, a następnie uruchom `manage.py init_mongo` i sprawdź zawartość bazy.
Stary wolumen i kopię zachowaj do potwierdzenia poprawności odtworzenia.
Sama zmiana montowania wolumenu uruchomi pustą bazę zamiast przenieść istniejącą.

Z katalogu głównego repozytorium:

```sh
docker compose --env-file .env.example --profile nonrelational up -d --wait mongo
```

Serwis `mongo` jest w profilu Compose `nonrelational` (PRD 2.1 §14), więc samo `docker compose up`
go nie uruchamia. Podanie serwisu z nazwy (jak w CI) włącza jego profil automatycznie.
MongoDB działa jako jednowęzłowy replica set `rs0`; healthcheck inicjalizuje go przy pierwszym
uruchomieniu i czeka na primary. Dane przechowuje nazwany wolumen `mongo_data`.
CI uruchamia tę samą konfigurację i sprawdza również rollback transakcji wielodokumentowej.

Następnie z katalogu `backend`, w środowisku z zainstalowanymi zależnościami:

```sh
python manage.py init_mongo
pytest app/adapter/spi/nonrelational/tests
```

Domyślny adres dla poleceń z hosta to
`mongodb://localhost:27017/?replicaSet=rs0&directConnection=true`.
`directConnection=true` pozwala używać opublikowanego portu bez rozwiązywania nazwy `mongo`
z konfiguracji replica setu. Backend wewnątrz Compose otrzymuje adres
`mongodb://mongo:27017/?replicaSet=rs0`. Inny serwer lub bazę wybierają `MONGO_URL` i `MONGO_DB`.

`init_mongo` aktualizuje walidatory i indeksy, ale nie migruje istniejących dokumentów.
Przed zastosowaniem zaostrzonego schematu do bazy z danymi trzeba usunąć powtórzone `_id`
wewnątrz osadzonych tablic, uzupełnić `notifications.content` (wymagane `title` i `body`,
opcjonalny `link`) oraz wprowadzić zmiany z PRD 2.1 §7.3: usunąć `fundings.templates[].mandatory`,
dodać `tasks.from_template`, `time_entries.work_date` i `groups.organization_id`.
Powiadomienia wygasają po 180 dniach od `created_at` (indeks TTL). Treść powiadomienia jest
samodzielną kopią i pozostaje po wygaśnięciu logu historii; `activity_id` może wtedy wskazywać
nieistniejący historyczny wpis.

Limit `projects.fundings` wynosi **500 elementów łącznie z rekordami odpiętymi**.
Inicjalizacja schematu nie wdraża serwisów, repozytoriów, UoW ani przełączania `DATA_BACKEND`.
