# PROMT 2.0 — Plan • Run • Optimise Management Tool

Platforma webowa wspierająca kierowników projektów i ich zespoły w codziennej pracy: planowanie, realizacja zadań, wymagania finansowania, ewidencja czasu i kosztów — dla wielu organizacji w jednym systemie.

> 📄 English version: [README.md](./README.md)

---

## Co nowego w 2.0

PROMT 2.0 rozwija pierwotny PROMT (praca inżynierska) z narzędzia dla jednego zespołu do platformy dla wielu organizacji.

- **Organizacje i członkowie** — jedno konto, wiele organizacji, osobny profil w każdej z nich
- **Role i grupy** — elastyczne uprawnienia na poziomie organizacji i projektu, z hierarchią grup
- **Konfigurowalny przepływ pracy** — własne statusy zadań w organizacji lub projekcie, pięć poziomów priorytetu
- **Etapy i checklisty** — struktura pracy w projekcie i w zadaniu
- **Zadania z wymagań finansowania** — zadania tworzone automatycznie na podstawie wymagań grantu
- **Czas i koszty** — ewidencja czasu pracy, wydatki i podsumowanie budżetu dla źródła finansowania
- **Współpraca** — komentarze, załączniki, historia zmian i powiadomienia

---

## Technologie

| Warstwa | Technologia |
|---|---|
| Frontend | React · TypeScript · Vite · Redux Toolkit / RTK Query |
| Backend | Python · Django · Django REST Framework · Pydantic |
| Baza danych | PostgreSQL |
| Testy | pytest · Vitest · Testing Library · Playwright |
| Środowisko | Docker · Docker Compose |

---

## Uruchomienie

### Wymagania

- Docker Desktop (Windows / macOS) lub Docker Engine (Linux)
- WSL2 na Windowsie
- Git

### 1. Pobranie

```bash
git clone https://github.com/MarekTurkowicz/PROMPT-v2.git
cd PROMPT-v2
```

### 2. Konfiguracja

```bash
cp .env.example .env
```

Uzupełnij wartości w `.env` (klucz aplikacji, dane bazy, konto administratora).

### 3. Start

```bash
docker compose up --build
```

Przy starcie backend wykonuje migracje i tworzy domyślne konto administratora z `.env`.

| Usługa | Adres |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000/api/ |
| Panel administracyjny | http://localhost:8000/admin/ |

### Testy

```bash
# backend
docker compose exec backend pytest

# testy jednostkowe frontendu
cd frontend && npm test

# testy end-to-end (zob. docs/testing/e2e.md)
cd frontend && npx playwright test --config=playwright.config.ts
```

### Sprawdzanie typów

Uruchamiane na hoście z katalogu głównego repozytorium (konfiguracja w `mypy.ini`); CI wykonuje to samo sprawdzenie przy pull requestach i pushu do `main`.

```bash
python -m venv backend/.venv                                    # Python 3.13, jednorazowo
backend/.venv/Scripts/pip install -r backend/requirements.txt   # Linux/macOS: backend/.venv/bin/pip
backend/.venv/Scripts/mypy backend/                             # Linux/macOS: backend/.venv/bin/mypy
```

---

## Struktura projektu

```
backend/    projekt Django (REST API, logika domenowa, testy)
frontend/   aplikacja React (funkcje, strony, komponenty, testy)
docs/       dokumentacja projektu
```

---

## Plan prac

Zadania są w [GitHub Issues](https://github.com/MarekTurkowicz/PROMPT-v2/issues), pogrupowane w etapy:

| Etap | Zakres |
|---|---|
| M0 – Setup | repozytorium, narzędzia, CI |
| M1 – Data model | nowy model domeny |
| M2 – Domain logic | uprawnienia, automatyzacja, powiadomienia |
| M3 – REST API | endpointy i dokumentacja API |
| M4 – Frontend | nowe ekrany i przepływy |
| M5 – Testing | testy automatyczne na wszystkich poziomach |
| M6 – Course deliverables | materiały na zajęcia |

Następny krok po 2.0: architektura mikroserwisowa (PROMT 3.0).

---

## Współpraca

Zasady nazywania branchy, commitów i Pull Requestów: [CONTRIBUTING.md](./CONTRIBUTING.md).
