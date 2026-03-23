# Delete Skill Feature — Design

Date: 2026-03-08

## Overview

Add the ability to delete skills from the registry. Delete is available in two places: the search results list and the skill detail page. Deletion requires a `window.confirm()` confirmation before proceeding.

## Backend

### New function — `backend/src/skills.ts`

```typescript
deleteSkill(id: string): boolean
```

Reads `skills.json`, filters out the skill with the matching `id`, writes back. Returns `false` if no skill was found, `true` on success.

### New endpoint — `backend/src/routes/skills.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `DELETE` | `/api/skills/:id` | Deletes skill by ID. Returns 204 on success, 404 if not found. |

## Frontend

### New function — `frontend/src/api.ts`

```typescript
deleteSkill(id: string): Promise<void>
```

Sends `DELETE /api/skills/:id`. No response body expected.

### SearchPage (`frontend/src/pages/SearchPage.tsx`)

- Add a "Delete" button next to each skill name in the results list
- On click: `window.confirm("Delete this skill?")` → if confirmed, call `deleteSkill(id)` → remove skill from local state

### SkillDetailPage (`frontend/src/pages/SkillDetailPage.tsx`)

- Add a "Delete" button below the skill content
- On click: `window.confirm("Delete this skill?")` → if confirmed, call `deleteSkill(id)` → navigate to `/`
