# AI Business Finder

A production-style full-stack MVP for finding local businesses inside a hand-picked map radius so you can identify outreach opportunities for website development services.

## What this MVP does
- Lets you center a map by city using backend-only Google Geocoding.
- Lets you click or drag on a Leaflet map to define an exact search point.
- Searches only within the selected circular radius.
- Returns a clean lead table with business name, address, phone number, and website-status classification.
- Lets you filter the current result view by website status and export that filtered view to CSV.
- Keeps Google API secrets on the backend only.

## Stack
- Frontend: React, TypeScript, Vite, Leaflet, React Leaflet
- Backend: FastAPI, httpx, Pydantic
- External APIs: Google Geocoding API, Google Places API (New)

## Project structure
```text
frontend/   React + Vite UI
backend/    FastAPI API and Google integrations
```

## Backend setup
1. Open a terminal in `backend/`.
2. Create a virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Copy the example env file:
   ```powershell
   Copy-Item .env.example .env
   ```
5. Add your Google API key to `backend/.env`:
   ```env
   GOOGLE_MAPS_API_KEY=your_real_key_here
   ```
6. Start the backend:
   ```powershell
   uvicorn app.main:app --reload
   ```

The backend will run on `http://127.0.0.1:8000`.

## Frontend setup
1. Open a second terminal in `frontend/`.
2. Copy the example env file:
   ```powershell
   Copy-Item .env.example .env
   ```
3. Confirm the backend URL in `frontend/.env`:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000
   ```
4. Install dependencies:
   ```powershell
   npm.cmd install
   ```
5. Start the frontend:
   ```powershell
   npm.cmd run dev
   ```

The frontend will run on `http://127.0.0.1:5173`.

## Local dev scripts
If you want one-command startup on Windows PowerShell, use the scripts in `scripts/`:

- `.\scripts\start-backend.ps1`
  Starts the FastAPI backend in its own PowerShell window context.
- `.\scripts\start-frontend.ps1`
  Starts the Vite frontend in its own PowerShell window context.
- `.\scripts\start-dev.ps1`
  Opens two separate PowerShell windows on your PC and starts both backend and frontend automatically.
- `.\scripts\stop-dev.ps1`
  Stops the backend/frontend PowerShell windows that were launched by `start-dev.ps1`.

These scripts open regular PowerShell windows, not VS Code integrated terminals.

## VS Code tasks
If you prefer to stay inside VS Code instead of opening external PowerShell windows, use the tasks in `.vscode/tasks.json`:

- `Backend: Start`
- `Frontend: Start`
- `Dev: Start Both (VS Code)`
- `Dev: Start Both (External Windows)`
- `Dev: Stop External Windows`

Open them from `Terminal` -> `Run Task`.

Notes:
- `Dev: Start Both (VS Code)` runs backend and frontend inside VS Code integrated terminals.
- To stop the VS Code integrated-terminal workflow, use `Terminal` -> `Run Task` -> `Terminate Task`, or `Tasks: Terminate All Tasks` from the Command Palette.
- `Dev: Stop External Windows` is only for the separate desktop PowerShell windows launched by `start-dev.ps1`.

## Where to place the Google API key
Put the key in:

`backend/.env`

Do not place the Google API key in the frontend. The frontend only calls your FastAPI backend.

## Google Cloud security note
- Restrict the key to only the APIs you need, especially Geocoding API and Places API.
- Keep the key server-side only.
- Rotate the key if it is ever exposed.
- Consider adding IP restrictions or other backend-safe restrictions in Google Cloud for production deployments.

## Backend API summary
- `GET /api/v1/health`
- `GET /api/v1/locations/geocode?city=El%20Paso,%20TX`
- `POST /api/v1/leads/search`
- `POST /api/v1/leads/export`

Example search payload:
```json
{
  "city": "El Paso, TX",
  "latitude": 31.7619,
  "longitude": -106.485,
  "radius": 1500,
  "limit": 20
}
```

## Developer notes
- The backend clamps radius and result count to safe limits.
- The map search is always limited to the exact selected circle, never the entire city.
- Places search stays user-initiated only. Moving the map, dragging the marker, changing the radius, or centering a city does not trigger a Places request.
- The geocoding layer uses a provider abstraction so Google can be swapped later without changing route handlers.
- Places field masks are intentionally kept minimal for cost control. The app requests only the fields needed for the UI plus `websiteUri` so website status can be classified without separate Place Details calls.
- Search deduplication is short-lived and in-memory only. It is intended to reduce duplicate requests in local/dev and normal retries, not to persist Google Places content.
- `place_id` is used as the stable identifier for app-side filtering and CSV export.
- Google Places data handling stays conservative and user-initiated. Export is generated from the current normalized results and current search context, not a long-term database.

## CSV export workflow
- Run a search explicitly with the Search button.
- Optionally filter the visible results by website status.
- Click Export CSV to download only the currently filtered result set.
- The CSV includes:
  - `place_id`
  - `name`
  - `phone`
  - `website_status`
  - `notes`
  - `contacted`
  - `exported_at`

`notes` and `contacted` are app-owned export columns, not Google data.

## Running tests
From `backend/`:

```powershell
pytest
```

## Next steps for website / no-website filtering
1. Upgrade the `website_status` classifier from the current Nearby Search heuristic to a more reliable enrichment workflow.
2. Add confidence scoring or source attribution inside the post-processing layer.
3. Introduce optional review queues for exported leads without changing the explicit-search flow.
4. If needed later, add a database for app-owned notes and call outcomes only, while keeping Google data handling conservative.
