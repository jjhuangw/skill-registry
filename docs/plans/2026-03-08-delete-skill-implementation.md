# Delete Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add delete functionality so users can remove skills from both the search results list and skill detail page, with a `window.confirm()` confirmation.

**Architecture:** Three-layer change — add `deleteSkill` to the backend data layer, add a `DELETE /api/skills/:id` route, add `deleteSkill` to the frontend API client, then wire a Delete button into SearchPage and SkillDetailPage.

**Tech Stack:** Node.js, Express, TypeScript, React, Vitest, Supertest, React Testing Library

---

### Task 1: Backend — Data Layer (`deleteSkill`)

**Files:**
- Modify: `backend/src/skills.ts`
- Modify: `backend/src/skills.test.ts`

**Step 1: Write failing tests — add to `backend/src/skills.test.ts`**

Open the file (currently 61 lines) and add these tests at the end, inside a new `describe` block:

```typescript
describe('deleteSkill', () => {
  it('removes the skill and returns true when found', () => {
    const result = deleteSkill('1');
    expect(result).toBe(true);
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('returns false when skill not found', () => {
    const result = deleteSkill('999');
    expect(result).toBe(false);
  });
});
```

Also add `deleteSkill` to the import at the top:
```typescript
import { listSkills, getSkillById, createSkill, deleteSkill } from './skills';
```

**Step 2: Run to verify FAIL**

```bash
cd backend && npx vitest run src/skills.test.ts
```
Expected: FAIL — `deleteSkill` is not exported

**Step 3: Implement `deleteSkill` in `backend/src/skills.ts`**

Add at the end of the file:

```typescript
export function deleteSkill(id: string): boolean {
  const skills = readSkills();
  const index = skills.findIndex((s) => s.id === id);
  if (index === -1) return false;
  skills.splice(index, 1);
  writeSkills(skills);
  return true;
}
```

**Step 4: Run tests to verify PASS**

```bash
cd backend && npx vitest run src/skills.test.ts
```
Expected: 8 tests pass

**Step 5: Commit**

```bash
git add backend/src/skills.ts backend/src/skills.test.ts
git commit -m "feat: add deleteSkill to data layer"
```

---

### Task 2: Backend — DELETE Route

**Files:**
- Modify: `backend/src/routes/skills.ts`
- Modify: `backend/src/routes/skills.test.ts`

**Step 1: Write failing tests — add to `backend/src/routes/skills.test.ts`**

Add `deleteSkill` to the mock setup. Find the `beforeEach` block and add:
```typescript
vi.mocked(skillsModule.deleteSkill).mockReturnValue(true);
```

Add `deleteSkill` to the import at the top:
```typescript
import * as skillsModule from '../skills';
```
(already there — just ensure `deleteSkill` is covered by the `vi.mock('../skills')` at the top of the file, which it will be automatically)

Add these tests at the end of the file:

```typescript
describe('DELETE /api/skills/:id', () => {
  it('returns 204 when skill deleted', async () => {
    const res = await request(app).delete('/api/skills/1');
    expect(res.status).toBe(204);
  });

  it('returns 404 when skill not found', async () => {
    vi.mocked(skillsModule.deleteSkill).mockReturnValue(false);
    const res = await request(app).delete('/api/skills/999');
    expect(res.status).toBe(404);
  });
});
```

**Step 2: Run to verify FAIL**

```bash
cd backend && npx vitest run src/routes/skills.test.ts
```
Expected: FAIL — route doesn't exist

**Step 3: Add DELETE route to `backend/src/routes/skills.ts`**

Add `deleteSkill` to the import at the top:
```typescript
import { listSkills, getSkillById, createSkill, deleteSkill } from '../skills';
```

Add the route before `export default router`:
```typescript
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = deleteSkill(req.params['id'] as string);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});
```

**Step 4: Run all backend tests to verify PASS**

```bash
cd backend && npx vitest run
```
Expected: 10 tests pass (8 skills + existing 6 routes + 2 new = 10 routes, 8 data layer)

**Step 5: Commit**

```bash
git add backend/src/routes/skills.ts backend/src/routes/skills.test.ts
git commit -m "feat: add DELETE /api/skills/:id route"
```

---

### Task 3: Frontend — API Client (`deleteSkill`)

**Files:**
- Modify: `frontend/src/api.ts`
- Modify: `frontend/src/api.test.ts`

**Step 1: Write failing test — add to `frontend/src/api.test.ts`**

Add this describe block at the end:

```typescript
describe('deleteSkill', () => {
  it('sends DELETE to /api/skills/:id', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    await deleteSkill('1');
    expect(fetch).toHaveBeenCalledWith('/api/skills/1', expect.objectContaining({ method: 'DELETE' }));
  });
});
```

Add `deleteSkill` to the import:
```typescript
import { fetchSkills, fetchSkill, registerSkill, deleteSkill } from './api';
```

**Step 2: Run to verify FAIL**

```bash
cd frontend && npx vitest run src/api.test.ts
```
Expected: FAIL

**Step 3: Add `deleteSkill` to `frontend/src/api.ts`**

Add at the end of the file:

```typescript
export async function deleteSkill(id: string): Promise<void> {
  await fetch(`/api/skills/${id}`, { method: 'DELETE' });
}
```

**Step 4: Run tests to verify PASS**

```bash
cd frontend && npx vitest run src/api.test.ts
```
Expected: 5 tests pass

**Step 5: Commit**

```bash
git add frontend/src/api.ts frontend/src/api.test.ts
git commit -m "feat: add deleteSkill to frontend API client"
```

---

### Task 4: Frontend — Delete Button in SearchPage

**Files:**
- Modify: `frontend/src/pages/SearchPage.tsx`
- Modify: `frontend/src/pages/SearchPage.test.tsx`

**Step 1: Write failing test — add to `frontend/src/pages/SearchPage.test.tsx`**

Add `deleteSkill` to the api mock imports. The file already has `vi.mock('../api')` and `import * as api from '../api'`. Add the mock setup in `beforeEach`:
```typescript
vi.mocked(api.deleteSkill).mockResolvedValue();
```

Add this test inside the existing `describe('SearchPage')` block:

```typescript
it('deletes skill and removes from list on confirm', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  renderPage();
  await waitFor(() => expect(screen.getByText('My Skill')).toBeInTheDocument());
  await userEvent.click(screen.getByRole('button', { name: /delete/i }));
  expect(api.deleteSkill).toHaveBeenCalledWith('1');
});
```

**Step 2: Run to verify FAIL**

```bash
cd frontend && npx vitest run src/pages/SearchPage.test.tsx
```
Expected: FAIL — no Delete button

**Step 3: Add Delete button to `frontend/src/pages/SearchPage.tsx`**

Add `deleteSkill` to the import:
```typescript
import { fetchSkills, deleteSkill } from '../api';
```

Add a `handleDelete` function inside the component (before the return):
```typescript
async function handleDelete(id: string) {
  if (!window.confirm('Delete this skill?')) return;
  await deleteSkill(id);
  setSkills((prev) => prev.filter((s) => s.id !== id));
}
```

Add the Delete button inside the `<li>`, after the `<p>` description:
```tsx
<button onClick={() => handleDelete(skill.id)} style={{ marginTop: '0.25rem' }}>
  Delete
</button>
```

**Step 4: Run tests to verify PASS**

```bash
cd frontend && npx vitest run src/pages/SearchPage.test.tsx
```
Expected: 3 tests pass

**Step 5: Commit**

```bash
git add frontend/src/pages/SearchPage.tsx frontend/src/pages/SearchPage.test.tsx
git commit -m "feat: add delete button to search results"
```

---

### Task 5: Frontend — Delete Button in SkillDetailPage

**Files:**
- Modify: `frontend/src/pages/SkillDetailPage.tsx`
- Modify: `frontend/src/pages/SkillDetailPage.test.tsx`

**Step 1: Write failing test — add to `frontend/src/pages/SkillDetailPage.test.tsx`**

Add `deleteSkill` to the mock. The file already has `vi.mock('../api')` and `import * as api from '../api'`. Add in `beforeEach`:
```typescript
vi.mocked(api.deleteSkill).mockResolvedValue();
```

Add a mock for `useNavigate` at the top of the file (after imports):
```typescript
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});
```

Add this test inside the existing `describe('SkillDetailPage')` block:

```typescript
it('deletes skill and navigates to / on confirm', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(
    <MemoryRouter initialEntries={['/skills/1']}>
      <Routes>
        <Route path="/skills/:id" element={<SkillDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
  await waitFor(() => expect(screen.getByText('My Skill')).toBeInTheDocument());
  await userEvent.click(screen.getByRole('button', { name: /delete/i }));
  expect(api.deleteSkill).toHaveBeenCalledWith('1');
  expect(mockNavigate).toHaveBeenCalledWith('/');
});
```

Also add `userEvent` import if not already present:
```typescript
import userEvent from '@testing-library/user-event';
```

**Step 2: Run to verify FAIL**

```bash
cd frontend && npx vitest run src/pages/SkillDetailPage.test.tsx
```
Expected: FAIL — no Delete button

**Step 3: Add Delete button to `frontend/src/pages/SkillDetailPage.tsx`**

Add `useNavigate` and `deleteSkill` to imports:
```typescript
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSkill, deleteSkill } from '../api';
```

Add `useNavigate` hook inside the component (after `useParams`):
```typescript
const navigate = useNavigate();
```

Add `handleDelete` function inside the component (before the return):
```typescript
async function handleDelete() {
  if (!window.confirm('Delete this skill?')) return;
  await deleteSkill(skill.id);
  navigate('/');
}
```

Add the Delete button inside the return, after `<ReactMarkdown>`:
```tsx
<button onClick={handleDelete} style={{ marginTop: '1rem' }}>
  Delete
</button>
```

**Step 4: Run all frontend tests to verify PASS**

```bash
cd frontend && npx vitest run
```
Expected: All 10 tests pass

**Step 5: Commit**

```bash
git add frontend/src/pages/SkillDetailPage.tsx frontend/src/pages/SkillDetailPage.test.tsx
git commit -m "feat: add delete button to skill detail page"
```

---

### Task 6: Final Verification

**Step 1: Run all backend tests**

```bash
cd backend && npx vitest run
```
Expected: All tests pass

**Step 2: Run all frontend tests**

```bash
cd frontend && npx vitest run
```
Expected: All tests pass

**Step 3: TypeScript check**

```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc -b
```
Expected: No errors

**Step 4: Commit if anything unstaged**

```bash
git status
# if clean, skip. Otherwise:
git add .
git commit -m "feat: complete delete skill feature"
```
