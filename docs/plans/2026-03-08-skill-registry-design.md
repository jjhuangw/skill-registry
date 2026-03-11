# Skill Registry Web Application — Design

Date: 2026-03-08

## Overview

A web application for registering and searching Claude Code agent skills. No authentication required. Open submission by anyone.

## Stack

- **Frontend**: Vite + React + TypeScript
- **Backend**: Node.js + Express (TypeScript)
- **Storage**: JSON file (`backend/data/skills.json`)

## Project Structure

```
skill-registry/
├── frontend/          # Vite + React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Node.js + Express
│   ├── src/
│   │   ├── routes/
│   │   └── index.ts
│   ├── data/
│   │   └── skills.json
│   └── package.json
└── README.md
```

## Data Model

Each skill entry stored in `skills.json`:

```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "content": "string (markdown)",
  "createdAt": "ISO 8601 timestamp"
}
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/skills` | List all skills; supports `?q=` for full-text search |
| `GET` | `/api/skills/:id` | Get a single skill by ID |
| `POST` | `/api/skills` | Register a new skill |

Search matches query against `name`, `description`, and `content` fields in-memory after reading the JSON file.

## Frontend Pages

### Search/Browse (`/`)
- Search input bar
- Results list: skill name + description snippet
- Clicking a result navigates to the detail page

### Register (`/register`)
- Form: Name (text), Description (text), Content (markdown textarea)
- Submit POSTs to backend; redirects to home on success

### Skill Detail (`/skills/:id`)
- Displays full skill: name, description, content rendered as markdown

### Navigation
- Top nav bar with links to Search and Register pages
