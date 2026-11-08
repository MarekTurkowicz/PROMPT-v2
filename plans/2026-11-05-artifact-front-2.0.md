# Handoff 2026-11-05: artifact „Front aplikacji PROMT” zgodny z PRD 2.0 i modelami

## Cel
Klikalna makieta frontu (artifact na claude.ai) służy do pokazania zespołowi rozszerzenia 2.0, zanim powstanie warstwa danych i API. Dziś domknęliśmy braki makiety względem `docs/PRD-promt-2.0.md` i modeli w `backend/api/models/`.

## Stan
- Repo: gałąź `feat/data-layer-models`, czysto, ostatni commit `dfaa231`. W repo nic nie zmieniano poza tym plikiem (niezacommitowany).
- Artifact: https://claude.ai/artifact/8tUxwzyd3Drbfif7cLqNAH (slug do narzędzi publikacji: `3fe022fe-f10b-487e-851c-c5463761b41e`), wersja na żywo `1793911536-7533` (poprzednie: `1793911172-d02f`, `1793910620-fd40`, `1793908841-44b0`).
- Źródła builda (katalog tymczasowy, może zniknąć): `C:\Users\Jakub\AppData\Local\Temp\claude\8838f8150d197e79\a420fd1b-17f6-4e48-b869-3c8f40574305\scratchpad\art\`
  - `index.html`: baza sprzed 2.0, `v2.js` / `v3.js` / `v2.css`: rozszerzenia, `build.py` łata bazę i zapisuje `dist/index.html`,
  - `smoke4.mjs`: test jsdom (`node smoke4.mjs dist/index.html`, jsdom z `frontend/node_modules`).
  - Gdy katalogu nie będzie: edytuj żywy HTML przez `read_artifact` + `edit_version`.
- Brak działających zadań w tle.

## Zrobione
Niezgodności z modelami:
- Typy wydatków jak w `ExpenseType` (podróże, szkolenia, usługi zewnętrzne, sprzęt, inne).
- Limit załącznika 50 MB (`MAX_ATTACHMENT_SIZE`), wspólna walidacja dla zadań, komentarzy i skanów.
- `notification.created_at` nie jest już oznaczone jako „propozycja schematu” (jest w modelu). Propozycją zostaje `organization_id`.
- Dziennik zdarzeń używa kodów `ActivityAction` (status_changed, rescheduled, assigned/unassigned, granted/revoked, attached/detached, hidden/shown, archived, invited, added_to_group/removed_from_group, checked/unchecked, moved). Logowane są też punkty checklisty i wpisy czasu.
- Zadanie projektu jest rozliczane przez `project_funding` (`pf`), a `funding` jest pochodną (model: `project` XOR `funding`). Formularz zadania odrzuca finansowanie niepodpięte do projektu.

Nowe funkcje:
1. Zakładanie organizacji (P2): przełącznik organizacji → „+ Nowa organizacja”. Tworzy 4 statusy (1 domyślny), 4 role, członkostwo twórcy jako administrator.
2. Blokada konta: Administracja → Członkowie, ikona 🔒 w kolumnie Akcje. Blokada organizacji: Administracja → Ustawienia, sekcja „Blokada organizacji”; odblokowanie przez kliknięcie zablokowanej organizacji w przełączniku.
3. Członkostwo: kosz = „Zakończ członkostwo” (status `left`), „Zaproś ponownie”, dane służbowe na członkostwie (telefon, e-mail, URL zdjęcia), profil z menu użytkownika.
4. Komentarze projektu: zakładka projektu „Komentarze”, z wątkami i załącznikami do komentarzy (także w zadaniach).
5. Raport czasu projektu: zakładka „Czas pracy” (według osób, finansowania, zadań) oraz czas w akordeonie finansowania.
6. Edycja wydatku (budżet projektu, ✏️) i kolumna „Dodał(a)”.
7. Checklisty: osoba odpowiedzialna, kolejność ↑↓, usuwanie.
8. Szablony zadań: edycja, usuwanie, widoczny status domyślny.
9. Pola: `funding.description`, `project_funding.note`.
10. Drobne: usuwanie etapu i roli własnej, edycja grupy (z ochroną przed cyklem), filtr „Anulowane” na liście zadań.

Sprawdzenie:
- `smoke4.mjs`: 70 testów OK, bez błędów (wszystkie trasy plus każda nowa funkcja). `diag.mjs` klika wszystkie linki do zadań we wszystkich organizacjach: szczegóły otwierają się wszędzie.
- Stary `smoke3.mjs` ma 9 porażek, identycznych na wersji sprzed zmian (nieaktualne oczekiwania sprzed 2.0, nie regresja).
- Podgląd w przeglądarce: komentarze projektu, szczegóły zadania z checklistą, panel kont i organizacji.

## Ustalenia
- Rozszerzamy ten sam artifact, wszystko po polsku, bez znaczków „2.0”. Pola spoza modeli mają etykietę „propozycja schematu” (decyzje z wcześniejszej sesji).
- Blokady bez osobnej strony: osobny panel „Konta i organizacje” dublował listę członków (uwaga użytkownika), więc konto blokuje się z listy członków (działa we wszystkich organizacjach), a organizację w jej ustawieniach. Zalogowany użytkownik makiety jest traktowany jako `is_staff`.
- Po zablokowaniu bieżącej organizacji makieta przełącza do innej; jedynej aktywnej organizacji nie da się zablokować. Ostatniego aktywnego administratora też nie.
- Panel admina na całą szerokość (bez limitu 1200 px i bez przewijania tabel w okienku), większe menu sekcji w jednej linii. Przyciski-ikony to symbole liniowe z zestawu menu (`ico('edit'|'trash'|'lock'|...)`), bez emotikonów – uwaga użytkownika.
- Zdjęcie członka to tylko pole URL. Obrazka nie wyświetlamy, bo CSP artifactu może blokować zewnętrzne obrazy.

## Otwarte problemy i ryzyka
- **Do decyzji użytkownika:** szczegóły zadania mają dwa układy (panel boczny i okno, przełącznik w nagłówku). Trzeba wybrać jeden i usunąć drugi.
- **Do zespołu:** `ActivityAction.ALERT_RAISED/RESOLVED` są w modelu, ale nie w PRD. Nie wiadomo, czym jest „alert”, więc makieta ich nie pokazuje.
- **Do zespołu:** w modelu jest `UNCHECKED`, a brakuje `CHECKED` (`backend/api/models/activity_log.py:49`). Makieta loguje `checked`.
- Akcje dziennika `login/import/export/branding` (z bazowej makiety) nie mają odpowiednika w `ActivityAction`.
- Przy wąskim oknie 12 zakładek projektu przewija się poziomo.
- Źródła builda są w katalogu tymczasowym.

## Następne kroki
1. Wybrać układ szczegółów zadania (panel albo okno) i usunąć drugi z artifactu. Gotowe, gdy w nagłówku szczegółów nie ma przełącznika, smoke test przechodzi, a nowa wersja jest opublikowana.
2. Ustalić z zespołem znaczenie alertów i brak `CHECKED`, potem zaktualizować model albo makietę. Gotowe, gdy model i makieta używają tego samego słownika akcji.
3. (Opcjonalnie) Usunąć etykiety „propozycja schematu” dla kolumn, które trafią do modeli (`invited_at`, `task.created_by`, A1–A7). Gotowe, gdy każda etykieta odpowiada kolumnie, której nadal nie ma w `backend/api/models/`.

## Prompt startowy
```
Pracujemy na artifact „Front aplikacji PROMT” (klikalna makieta frontu PROMPT-v2, wersja 1793911536-7533).
Najpierw przeczytaj plans/2026-11-05-artifact-front-2.0.md i pamięć promt-front-artifact.
Pierwszy krok: zapytaj mnie, który układ szczegółów zadania zostaje (panel boczny czy okno), usuń drugi, uruchom smoke test i opublikuj.
Ograniczenia: wszystko po polsku, nie zmieniaj kodu repo bez prośby, przed publikacją sprawdź base_version przez get_artifact.
```
