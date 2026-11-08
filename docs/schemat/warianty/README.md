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
| `nosql-mongodb-2.0.drawio` | dokumentowy (MongoDB) wdrażany w `backend/app/adapter/spi/nonrelational`: 11 kolekcji + counters, walidatory, indeksy, heksagon i bilans względem PG; zgodny z kodem |
| `obiektowo-relacyjny.drawio`, `obiektowo-relacyjny.md` | obiektowo-relacyjny (PostgreSQL): typy złożone, ENUM, domeny, dziedziczenie, tablice, zakresy |

Diagramy przypadków użycia: `docs/przypadki-uzycia/`.
Pliki `.drawio` otwiera rozszerzenie Draw.io Integration w VS Code albo https://app.diagrams.net.
