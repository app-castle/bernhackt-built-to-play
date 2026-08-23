# Installationsanleitung

Voraussetzungen: [Node.js](https://nodejs.org/), [Docker](https://www.docker.com/) (für Postgres), sowie für die Desktop-App zusätzlich Rust + die [Tauri-Voraussetzungen](https://tauri.app/start/prerequisites/).

## Backend

```bash
cd code/backend
cp .env.example .env
docker compose up -d
npm install
npm run start:dev
```

Läuft danach auf `http://localhost:3000`. Die DB-Tabellen werden im Dev-Modus automatisch synchronisiert, keine Migration nötig.

## Frontend

```bash
cd code/frontend
cp .env.example .env
npm install
npm run dev
```

Öffnet die Web-Version unter `http://localhost:1420` (Vite Dev-Server). `VITE_API_URL` in der `.env` muss auf das Backend zeigen (Standard: `http://localhost:3000`).

Für die native Desktop-App (Tauri-Fenster) stattdessen:

```bash
npm run tauri dev
```

Backend sollte dafür bereits laufen.
