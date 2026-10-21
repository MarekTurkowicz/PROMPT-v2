# Warianty modelu danych PROMT 2.0

Ten sam zakres danych zaprojektowany na kilka sposobów – materiał do porównań i sprawozdań.

## Modele relacyjne (diagramy ER, notacja crow's foot)

| Plik | Koncepcja | Tabele |
|---|---|---|
| `er-1-relacyjny.drawio` | model zrównoważony – 3NF z praktycznymi uproszczeniami (obecny schemat) | 22 |
| `er-2-maksymalnie-rozbity.drawio` | maksymalna dekompozycja – słowniki, tabele łączące zamiast kolumn „albo–albo” | 62 |
| `er-3-nadtyp-podtyp.drawio` | uogólnienie – nadtypy `party` i `entity → work_item` | 28 |

## Inne paradygmaty

| Pliki | Model |
|---|---|
| `nosql-mongodb.drawio`, `nosql-mongodb.md` | dokumentowy (MongoDB): kolekcje, dokumenty osadzone, odwołania, indeksy, zapytania |
| `obiektowo-relacyjny.drawio`, `obiektowo-relacyjny.md` | obiektowo-relacyjny (PostgreSQL): typy złożone, ENUM, domeny, dziedziczenie, tablice, zakresy |

Każdy diagram ma legendę w lewym górnym rogu. Pliki `.drawio` otwiera rozszerzenie Draw.io Integration
w VS Code albo https://app.diagrams.net.
