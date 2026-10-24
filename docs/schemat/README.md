# Data model – PROMT 2.0

Design documents of the PROMT 2.0 data model.

## Pliki

| Plik | Co to jest | Czym otworzyć |
|---|---|---|
| `promt-schemat.drawio` | diagram UML (ciemny motyw) | VS Code + rozszerzenie **Draw.io Integration** (`hediet.vscode-drawio`) albo https://app.diagrams.net |
| `promt-schemat.dbml` | tabele i relacje tekstem | https://dbdiagram.io (wklej treść) |
| `projekt-schematu-relacyjnego.md` | projekt schematu relacyjnego: relacje, dziedziny, klucze, więzy, zależności funkcyjne, normalizacja | podgląd Markdown (`Ctrl+Shift+V` w VS Code) albo GitHub |
| `projekt-schematu-relacyjnego.drawio` | diagram schematu relacyjnego (PK podkreślony, `#` = klucz obcy, notacja crow's foot) | jak wyżej |
| `promt-schemat.sql` | pełny schemat PostgreSQL: tabele, klucze, CHECK, indeksy, widok uprawnień, trigger szablonów | `psql -d <pusta_baza> -f promt-schemat.sql` |

## Jak edytować diagram

1. Otwórz `promt-schemat.drawio` w VS Code (z rozszerzeniem) albo w diagrams.net.
2. Przeciągaj tabele – linie idą za nimi. Dziwny objazd linii: zaznacz linię → prawy przycisk → **Clear Waypoints**.
3. Kolumnę zmieniasz podwójnym kliknięciem; połączenie dodajesz, przeciągając od krawędzi jednej tabeli do drugiej.
4. Zapisz zmiany i otwórz Pull Request.

## Najważniejsze decyzje

- **Firma (organization)** jest właścicielem danych; osoba w firmie to `organization_member` (zastępuje `user_profile`).
- **Role** (`role`) to zestawy uprawnień; nadaje się je osobie albo grupie (`role_assignment`), w całej firmie albo
  w projekcie. Grupy (`member_group`) mogą mieć podgrupy, które dziedziczą role.
- **Statusy** (`task_status`) to etykiety firmy albo projektu; kategoria todo / in_progress / done / cancelled jest
  stała, priorytet 1–5.
- **Szablony zadań** (`task_template`, w bazie `funding_task`): podpięcie finansowania do projektu tworzy zadania
  z szablonów automatycznie.
- **Kontekst zadania** (dawne `task_scope`) to kolumny w `task`: projekt ALBO samo finansowanie, opcjonalnie
  finansowanie projektu.
- **Kolumny XOR** – dokładnie jedna z kilku kolumn jest wypełniona (pilnuje `CHECK num_nonnulls(...) = 1`).
- Na diagramie odwołania do firmy i do osoby, które ma prawie każda tabela, są atrybutami (`→ organization`)
  zamiast linii.
