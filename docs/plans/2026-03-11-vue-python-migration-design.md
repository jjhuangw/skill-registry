# Vue + Python Migration Design

**Date:** 2026-03-11

## Overview

Migrate the Skill Registry app from React + Express/TypeScript to Vue 3 + FastAPI/Python, with updated styling using Tailwind CSS.

## Approach

New sibling directories (`frontend-vue/`, `backend-python/`) created alongside existing code. Old directories left intact as reference.

## Architecture

```
skill-registry/
├── frontend/          (existing React app — untouched)
├── frontend-vue/      (new Vue 3 + Vite + Tailwind + TypeScript)
├── backend/           (existing Express app — untouched)
├── backend-python/    (new FastAPI + Python)
│   └── data/          (copy of skills.json from backend/data/)
└── docs/
```

- `frontend-vue` proxies `/api/*` → `backend-python` at port `8000` via Vite
- `backend-python` runs on port `8000` (FastAPI + Uvicorn)
- Same REST API contract: `GET/POST /api/skills`, `GET/DELETE /api/skills/:id`

## Backend (FastAPI)

```
backend-python/
├── main.py           # FastAPI app, CORS, routes
├── skills.py         # data access (read/write skills.json)
├── models.py         # Pydantic models (Skill, SkillCreate)
├── data/
│   └── skills.json
└── requirements.txt  # fastapi, uvicorn
```

- Pydantic models: `Skill` (id, name, description, content, createdAt) and `SkillCreate`
- `skills.py`: read/write JSON, list with optional query filter, get by id, create with uuid4, delete
- `main.py`: FastAPI app with CORS, 4 routes mirroring Express

## Frontend (Vue 3 + Tailwind)

```
frontend-vue/
├── index.html
├── vite.config.ts      # proxy /api → localhost:8000
├── tailwind.config.js
├── src/
│   ├── main.ts
│   ├── api.ts
│   ├── types.ts        # Skill interface
│   ├── router.ts       # Vue Router
│   └── components/
│       ├── NavBar.vue
│       └── pages/
│           ├── SearchPage.vue
│           ├── RegisterPage.vue
│           └── SkillDetailPage.vue
```

- Vue Router replaces React Router — same 3 routes
- `vue-markdown-render` replaces `react-markdown`
- Tailwind replaces inline styles
- Composition API with `<script setup lang="ts">` throughout
