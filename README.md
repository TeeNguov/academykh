# Academy KH

An SSR-ready study platform for teacher-created courses, modules, quizzes, exams, and coding questions.

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, MDI icons
- Backend: Java Spring Boot, Spring Security, Spring Data JPA
- Database: MySQL

## Structure

```txt
frontend/   Next.js SSR application
backend/    Spring Boot REST API
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

## Run Backend

The easiest local path is Docker Compose:

```bash
docker compose up -d --build
```

This starts:

- Next.js frontend: `http://localhost:3000`
- Spring Boot API: `http://localhost:8080`
- MySQL: `localhost:3308` on the host, `mysql:3306` inside Docker

The backend seeds a few starter courses and coding challenges when the database is empty.

If running without Docker, create a MySQL database:

```sql
create database academy_kh;
```

Or run the explicit schema script:

```bash
mysql -u academy_user -p < backend/src/main/resources/db/schema.sql
```

If your MySQL tool rejects `IF NOT EXISTS`, use the fresh schema script instead. This drops existing Academy KH tables first:

```bash
mysql -u academy_user -p < backend/src/main/resources/db/schema-fresh.sql
```

Then configure `backend/src/main/resources/application.yml` if needed and run:

```bash
cd backend
./mvnw spring-boot:run
```

The backend currently uses a clean API/domain foundation. Code execution for student submissions should be added later with a sandboxed judge service.

## Publish Prep

Copy the production environment template and change every placeholder:

```bash
cp .env.production.example .env
```

Backend runtime values live under `backend/`:

```bash
backend/.env
backend/.env.development
backend/.env.production
```

Local Docker Compose loads `backend/.env.development` for the backend service by default. Set `APP_ENV=production` to make Compose load `backend/.env.production`. When running the backend directly from the `backend/` folder, Spring Boot imports `backend/.env` and the active profile env file.

For production, edit `backend/.env.production` before deploying. The backend deploy script uploads that file to `/home/academy-kh/backend/.env.production` and points systemd at it. The script does not generate env values.
The frontend deploy also reads `frontend/.env.production` first for Next.js build-time public values.

Important production values:

- `AUTH_COOKIE_SECRET`: long random string used to sign login cookies
- `AUTH_COOKIE_NAME`: login cookie name, usually `academy_session`
- `FRONTEND_ORIGIN`: public frontend URL allowed by CORS
- `NEXT_PUBLIC_API_BASE_URL`: public API URL used by the browser
- `API_INTERNAL_URL`: backend URL used by the Next.js server inside Docker
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Cloudflare Turnstile site key used by login and register pages
- `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile secret key used by the backend to verify login and register tokens
- `MYSQL_ROOT_PASSWORD` / `MYSQL_PASSWORD`: strong database passwords

Build and run the publishable containers:

```bash
docker compose --env-file .env up -d --build
```

To run the Compose stack with backend production env values:

```bash
APP_ENV=production docker compose up -d --build
```

For HTTPS deployments, keep `AUTH_COOKIE_SECURE=true`. If frontend and backend are on different domains, configure your reverse proxy carefully and set the cookie `SameSite` policy for that deployment.

## Deploy Backend From This Machine

If the server already has Java and MySQL, deploy a new backend jar from this machine:

```bash
./deploy-backend.sh
```

Defaults:

- Server: `root@38.54.4.112`
- Remote backend directory: `/home/academy-kh/backend`
- Service: `academy-kh-backend`
- Env file: `/home/academy-kh/backend/.env.production`

The script deploys the jar, uploads `backend/.env.production`, and restarts the existing backend service. It does not generate env values or create service files. Edit `backend/.env.production` locally when backend configuration changes, then deploy again:

```bash
nano backend/.env.production
./deploy-backend.sh
```

If the backend systemd service does not exist yet, create it explicitly first:

```bash
./setup-backend-service.sh
```

The deploy script does not create or edit the systemd service file.

Override deploy connection details if needed:

```bash
PEM=/path/to/prod-server-khmer-1.pem \
REMOTE_DIR=/home/academy-kh/backend \
SERVICE=academy-kh-backend \
bash deploy-backend.sh
```

## Deploy Frontend From This Machine

Deploy the Next.js frontend to the same server:

```bash
./deploy-frontend.sh
```

Defaults:

- Server: `root@38.54.4.112`
- Remote frontend directory: `/home/academy-kh/frontend`
- Service: `academy-kh-frontend`
- Public API URL: `https://academykh.jaekjay.com`
- Internal API URL on server: `http://localhost:8080`
- Frontend port: `3001`

The script reads `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `API_INTERNAL_URL`, `FRONTEND_PORT`, and `PUBLIC_FRONTEND_URL` from `.env.production` when present.

Override them if needed:

```bash
NEXT_PUBLIC_API_BASE_URL=https://academykh.jaekjay.com \
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key \
API_INTERNAL_URL=http://localhost:8080 \
bash deploy-frontend.sh
```

`NEXT_PUBLIC_TURNSTILE_SITE_KEY` is baked into the Next.js client bundle, so rerun the frontend deploy whenever the Cloudflare site key changes. The backend secret lives only in the backend env file.
