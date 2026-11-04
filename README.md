# Taskflow Todo

A responsive full-stack todo app built with React, Vite, Tailwind CSS, FastAPI, SQLAlchemy, Alembic, PostgreSQL 16, and Docker Compose.

## Features

- Create todos with an optional description
- List all todos and filter by all, active, or completed
- Toggle completion, edit titles inline, and delete individual todos
- Clear all completed todos
- Persist tasks in PostgreSQL
- Loading, empty, and error states
- Responsive layout for desktop and mobile

## Run the complete app with Docker

1. Install and start Docker Desktop.
2. From the project root, copy `.env.example` to `.env`:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Start the stack:

   ```powershell
   docker compose up --build
   ```

4. Open:
   - App: <http://localhost>
   - API docs: <http://localhost:8000/docs>
   - Health check: <http://localhost:8000/api/health>

The database data is stored in the `postgres_data` Docker volume. Stop the app with `Ctrl+C`; run `docker compose down` to stop and remove its containers. The named database volume is retained.

Port 5433 is used for PostgreSQL so it does not conflict with a locally installed PostgreSQL server. If port 80 is already occupied, set `FRONTEND_PORT=8080` in `.env` and open <http://localhost:8080>.

## Run backend and frontend separately on Windows

Create the backend's local environment file and start PostgreSQL with Docker Desktop:

```powershell
Copy-Item backend\.env.example backend\.env
docker compose up -d db
```

In a backend terminal from the project root:

```powershell
.\venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
alembic -c backend\alembic.ini upgrade head
uvicorn backend.main:app --reload
```

In a second terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open <http://localhost:5173>. If PowerShell blocks `npm`, use `npm.cmd` as shown; do not change the execution policy for this project.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/todos` | List todos |
| `GET` | `/api/todos/{id}` | Get one todo |
| `POST` | `/api/todos` | Create a todo |
| `PUT` / `PATCH` | `/api/todos/{id}` | Update a todo |
| `DELETE` | `/api/todos/{id}` | Delete one todo |
| `DELETE` | `/api/todos/completed` | Clear completed todos |

Interactive API documentation is available at `/docs`.

## Database migrations

After changing SQLAlchemy models, create a migration from the project root:

```powershell
alembic -c backend\alembic.ini revision --autogenerate -m "describe the schema change"
alembic -c backend\alembic.ini upgrade head
```

The initial `todos` table migration runs automatically when the Docker backend starts.

## Tests

Install the backend test dependencies and run the API integration tests from the project root:

```powershell
python -m pip install -r backend\requirements-dev.txt
python -m pytest backend\tests
```

The API tests use an isolated in-memory SQLite database; they do not modify PostgreSQL data.

## Deploy to GitHub Pages and Render

The frontend is published to GitHub Pages, and the FastAPI backend plus PostgreSQL
database are defined in `render.yaml`.

1. Add this project to the `main` branch of `Mahnoor10-tech/TO-DO-LIST_WEEK8`.
   Keep the root-level `backend/`, `frontend/`, `render.yaml`, and
   `.github/workflows/deploy-pages.yml` paths intact.
2. In that GitHub repository, open **Settings → Pages** and set **Build and
   deployment → Source** to **GitHub Actions**.
3. In Render, create a new Blueprint from the repository and apply the
   `render.yaml` resources. Wait for the API health check at `/api/health` to
   pass. Render's free web service can sleep when idle, and its free PostgreSQL
   database expires 30 days after creation. Choose a paid database or use a
   separate persistent PostgreSQL provider if you need to keep todo data long
   term.
4. In Render, verify the `CORS_ORIGINS` value includes
   `https://mahnoor10-tech.github.io`. Update it if your Pages owner URL differs.
5. If Render assigns a different service URL than
   `https://fullstack-todo-api.onrender.com`, add the actual API URL ending in
   `/api` as the `VITE_API_URL` Actions variable in **Settings → Secrets and
   variables → Actions → Variables**.
6. Run **Actions → Deploy frontend to GitHub Pages → Run workflow** (or push a
   commit to `main`).

The site URL will be
`https://mahnoor10-tech.github.io/TO-DO-LIST_WEEK8/`. The backend must be
deployed separately; GitHub Pages only hosts the frontend.

## GitHub

The root `.gitignore` excludes virtual environments, node dependencies, `.env` files, build output, and Python cache files. Never commit real passwords or secrets.
