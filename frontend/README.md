# Monastery360 Frontend

A React + Vite + Tailwind app that connects to the Monastery360 FastAPI backend.

## Requirements
- Node.js 18+
- Backend running at `http://127.0.0.1:8000`

## Setup
```bash
npm install
```

## Development
```bash
npm run dev
```
Then open the printed URL (usually `http://localhost:5173`).

## Build
```bash
npm run build
npm run preview
```

## Tech Stack
- React + Vite (TypeScript)
- TailwindCSS
- React Router
- Axios
- panolens.js + three.js (360° viewer)

## Configuration
The Axios client uses `http://127.0.0.1:8000/` as base URL (see `src/lib/api.ts`). Update if your backend runs elsewhere.
