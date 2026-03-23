# Skill Registry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack web app where users can register and search Claude Code agent skills — no auth, open submission, JSON file storage.

**Architecture:** Monorepo with `frontend/` (Vite + React + TypeScript) and `backend/` (Node.js + Express + TypeScript). The backend exposes a REST API and reads/writes skills to a local `data/skills.json` file. The frontend calls the API and renders three pages: search, register, and skill detail.

**Tech Stack:** Node.js, Express, TypeScript, uuid, Vite, React, React Router v6, react-markdown, Vitest, Supertest, React Testing Library

---

### Task 1: Backend — Project Setup

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/index.ts`
- Create: `backend/data/skills.json`

**Step 1: Initialize the backend package**

```bash
cd backend
npm init -y
npm install express cors
npm install --save-dev typescript ts-node nodemon @types/express @types/cors @types/node vitest supertest @types/supertest
```

**Step 2: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

**Step 3: Create `backend/data/skills.json` with empty array**

```json
[]
```

**Step 4: Create `backend/src/index.ts`**

```typescript
import express from 'express';
import cors from 'cors';
import skillsRouter from './routes/skills';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/skills', skillsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

export default app;
```

**Step 5: Add scripts to `backend/package.json`**

Add under `"scripts"`:
```json
"scripts": {
  "dev": "nodemon --exec ts-node src/index.ts",
  "build": "tsc",
  "test": "vitest run"
}
```

**Step 6: Commit**

```bash
git add backend/
git commit -m "feat: scaffold backend project"
```

---

### Task 2: Backend — Skills Data Layer

**Files:**
- Create: `backend/src/skills.ts`
- Create: `backend/src/skills.test.ts`

**Step 1: Write failing tests for the data layer**

Create `backend/src/skills.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';

vi.mock('fs');

// Mock the data file path resolution
vi.mock('path', async () => {
  const actual = await vi.importActual<typeof import('path')>('path');
  return { ...actual };
});

import { listSkills, getSkillById, createSkill } from './skills';

const mockSkills = [
  { id: '1', name: 'Test Skill', description: 'A test', content: '# Hello', createdAt: '2026-01-01T00:00:00.000Z' }
];

beforeEach(() => {
  vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockSkills));
  vi.mocked(fs.writeFileSync).mockImplementation(() => {});
});

describe('listSkills', () => {
  it('returns all skills when no query', () => {
    const result = listSkills();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test Skill');
  });

  it('filters by name match', () => {
    const result = listSkills('test');
    expect(result).toHaveLength(1);
  });

  it('returns empty when no match', () => {
    const result = listSkills('nonexistent');
    expect(result).toHaveLength(0);
  });
});

describe('getSkillById', () => {
  it('returns skill when found', () => {
    const result = getSkillById('1');
    expect(result?.name).toBe('Test Skill');
  });

  it('returns undefined when not found', () => {
    const result = getSkillById('999');
    expect(result).toBeUndefined();
  });
});

describe('createSkill', () => {
  it('creates a skill and writes to file', () => {
    const skill = createSkill({ name: 'New', description: 'Desc', content: '# New' });
    expect(skill.name).toBe('New');
    expect(skill.id).toBeDefined();
    expect(skill.createdAt).toBeDefined();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd backend && npx vitest run src/skills.test.ts
```
Expected: FAIL — `skills.ts` not found

**Step 3: Install uuid and implement `backend/src/skills.ts`**

```bash
npm install uuid && npm install --save-dev @types/uuid
```

Create `backend/src/skills.ts`:

```typescript
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_PATH = path.join(__dirname, '../data/skills.json');

export interface Skill {
  id: string;
  name: string;
  description: string;
  content: string;
  createdAt: string;
}

function readSkills(): Skill[] {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeSkills(skills: Skill[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(skills, null, 2));
}

export function listSkills(query?: string): Skill[] {
  const skills = readSkills();
  if (!query) return skills;
  const q = query.toLowerCase();
  return skills.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q)
  );
}

export function getSkillById(id: string): Skill | undefined {
  return readSkills().find((s) => s.id === id);
}

export function createSkill(input: { name: string; description: string; content: string }): Skill {
  const skills = readSkills();
  const skill: Skill = {
    id: uuidv4(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  skills.push(skill);
  writeSkills(skills);
  return skill;
}
```

**Step 4: Run tests to verify they pass**

```bash
cd backend && npx vitest run src/skills.test.ts
```
Expected: PASS — all tests green

**Step 5: Commit**

```bash
git add backend/src/skills.ts backend/src/skills.test.ts
git commit -m "feat: add skills data layer with tests"
```

---

### Task 3: Backend — API Routes

**Files:**
- Create: `backend/src/routes/skills.ts`
- Create: `backend/src/routes/skills.test.ts`

**Step 1: Write failing route tests**

Create `backend/src/routes/skills.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../skills');

import * as skillsModule from '../skills';
import skillsRouter from './skills';

const mockSkill = {
  id: '1',
  name: 'My Skill',
  description: 'Does stuff',
  content: '# Skill',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const app = express();
app.use(express.json());
app.use('/api/skills', skillsRouter);

beforeEach(() => {
  vi.mocked(skillsModule.listSkills).mockReturnValue([mockSkill]);
  vi.mocked(skillsModule.getSkillById).mockReturnValue(mockSkill);
  vi.mocked(skillsModule.createSkill).mockReturnValue(mockSkill);
});

describe('GET /api/skills', () => {
  it('returns list of skills', async () => {
    const res = await request(app).get('/api/skills');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('passes query param to listSkills', async () => {
    await request(app).get('/api/skills?q=hello');
    expect(skillsModule.listSkills).toHaveBeenCalledWith('hello');
  });
});

describe('GET /api/skills/:id', () => {
  it('returns 200 with skill', async () => {
    const res = await request(app).get('/api/skills/1');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('My Skill');
  });

  it('returns 404 when not found', async () => {
    vi.mocked(skillsModule.getSkillById).mockReturnValue(undefined);
    const res = await request(app).get('/api/skills/999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/skills', () => {
  it('creates a skill and returns 201', async () => {
    const res = await request(app)
      .post('/api/skills')
      .send({ name: 'New', description: 'Desc', content: '# New' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('My Skill');
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/skills').send({ name: 'Only name' });
    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run to verify failure**

```bash
cd backend && npx vitest run src/routes/skills.test.ts
```
Expected: FAIL — router not found

**Step 3: Create `backend/src/routes/skills.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { listSkills, getSkillById, createSkill } from '../skills';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const q = req.query.q as string | undefined;
  res.json(listSkills(q));
});

router.get('/:id', (req: Request, res: Response) => {
  const skill = getSkillById(req.params.id);
  if (!skill) return res.status(404).json({ error: 'Not found' });
  res.json(skill);
});

router.post('/', (req: Request, res: Response) => {
  const { name, description, content } = req.body;
  if (!name || !description || !content) {
    return res.status(400).json({ error: 'name, description, and content are required' });
  }
  const skill = createSkill({ name, description, content });
  res.status(201).json(skill);
});

export default router;
```

**Step 4: Run tests to verify they pass**

```bash
cd backend && npx vitest run src/routes/skills.test.ts
```
Expected: PASS

**Step 5: Smoke test the running server**

```bash
cd backend && npm run dev
# In another terminal:
curl http://localhost:3001/api/skills
# Expected: []
curl -X POST http://localhost:3001/api/skills \
  -H "Content-Type: application/json" \
  -d '{"name":"Hello","description":"A skill","content":"# Hello"}'
# Expected: { id: "...", name: "Hello", ... }
curl http://localhost:3001/api/skills
# Expected: [{ id: "...", ... }]
```

**Step 6: Commit**

```bash
git add backend/src/routes/
git commit -m "feat: add skills API routes with tests"
```

---

### Task 4: Frontend — Project Setup

**Files:**
- Create: `frontend/` (scaffolded via Vite)

**Step 1: Scaffold the Vite + React + TypeScript project**

```bash
cd /path/to/skill-registry
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom react-markdown
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
```

**Step 2: Update `frontend/vite.config.ts` to add test config and API proxy**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
});
```

**Step 3: Create `frontend/src/test-setup.ts`**

```typescript
import '@testing-library/jest-dom';
```

**Step 4: Add test script to `frontend/package.json`**

Under `"scripts"`, ensure:
```json
"test": "vitest run"
```

**Step 5: Delete boilerplate files**

Delete `frontend/src/App.css`, `frontend/src/App.tsx`, `frontend/src/assets/react.svg`, and clear `frontend/index.css`.

**Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold frontend project"
```

---

### Task 5: Frontend — API Client

**Files:**
- Create: `frontend/src/api.ts`
- Create: `frontend/src/api.test.ts`

**Step 1: Write failing tests**

Create `frontend/src/api.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

global.fetch = vi.fn();

import { fetchSkills, fetchSkill, registerSkill } from './api';

const mockSkill = { id: '1', name: 'Skill', description: 'Desc', content: '# Hi', createdAt: '' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetchSkills', () => {
  it('calls /api/skills', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => [mockSkill],
    } as Response);
    const result = await fetchSkills();
    expect(fetch).toHaveBeenCalledWith('/api/skills');
    expect(result).toHaveLength(1);
  });

  it('calls /api/skills?q=hello when query given', async () => {
    vi.mocked(fetch).mockResolvedValue({ json: async () => [] } as Response);
    await fetchSkills('hello');
    expect(fetch).toHaveBeenCalledWith('/api/skills?q=hello');
  });
});

describe('fetchSkill', () => {
  it('calls /api/skills/:id', async () => {
    vi.mocked(fetch).mockResolvedValue({ json: async () => mockSkill } as Response);
    const result = await fetchSkill('1');
    expect(fetch).toHaveBeenCalledWith('/api/skills/1');
    expect(result.name).toBe('Skill');
  });
});

describe('registerSkill', () => {
  it('POSTs to /api/skills', async () => {
    vi.mocked(fetch).mockResolvedValue({ json: async () => mockSkill } as Response);
    await registerSkill({ name: 'N', description: 'D', content: 'C' });
    expect(fetch).toHaveBeenCalledWith('/api/skills', expect.objectContaining({ method: 'POST' }));
  });
});
```

**Step 2: Run to verify failure**

```bash
cd frontend && npx vitest run src/api.test.ts
```
Expected: FAIL

**Step 3: Create `frontend/src/api.ts`**

```typescript
export interface Skill {
  id: string;
  name: string;
  description: string;
  content: string;
  createdAt: string;
}

export async function fetchSkills(query?: string): Promise<Skill[]> {
  const url = query ? `/api/skills?q=${encodeURIComponent(query)}` : '/api/skills';
  const res = await fetch(url);
  return res.json();
}

export async function fetchSkill(id: string): Promise<Skill> {
  const res = await fetch(`/api/skills/${id}`);
  return res.json();
}

export async function registerSkill(data: {
  name: string;
  description: string;
  content: string;
}): Promise<Skill> {
  const res = await fetch('/api/skills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
```

**Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/api.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/api.ts frontend/src/api.test.ts
git commit -m "feat: add frontend API client with tests"
```

---

### Task 6: Frontend — Pages and Routing

**Files:**
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/pages/SearchPage.tsx`
- Create: `frontend/src/pages/SearchPage.test.tsx`
- Create: `frontend/src/pages/RegisterPage.tsx`
- Create: `frontend/src/pages/RegisterPage.test.tsx`
- Create: `frontend/src/pages/SkillDetailPage.tsx`
- Create: `frontend/src/pages/SkillDetailPage.test.tsx`
- Create: `frontend/src/components/NavBar.tsx`

**Step 1: Set up routing in `frontend/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import SearchPage from './pages/SearchPage';
import RegisterPage from './pages/RegisterPage';
import SkillDetailPage from './pages/SkillDetailPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/skills/:id" element={<SkillDetailPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
```

**Step 2: Create `frontend/src/components/NavBar.tsx`**

```tsx
import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', gap: '1rem' }}>
      <Link to="/">Search Skills</Link>
      <Link to="/register">Register Skill</Link>
    </nav>
  );
}
```

**Step 3: Write failing test for SearchPage**

Create `frontend/src/pages/SearchPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SearchPage from './SearchPage';

vi.mock('../api');
import * as api from '../api';

const mockSkills = [
  { id: '1', name: 'My Skill', description: 'Does things', content: '# Hi', createdAt: '' },
];

beforeEach(() => {
  vi.mocked(api.fetchSkills).mockResolvedValue(mockSkills);
});

function renderPage() {
  return render(<MemoryRouter><SearchPage /></MemoryRouter>);
}

describe('SearchPage', () => {
  it('shows skills on load', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('My Skill')).toBeInTheDocument());
  });

  it('calls fetchSkills with query on input', async () => {
    renderPage();
    const input = screen.getByPlaceholderText(/search/i);
    await userEvent.type(input, 'hello');
    await waitFor(() => expect(api.fetchSkills).toHaveBeenCalledWith('hello'));
  });
});
```

**Step 4: Run to verify failure**

```bash
cd frontend && npx vitest run src/pages/SearchPage.test.tsx
```
Expected: FAIL

**Step 5: Create `frontend/src/pages/SearchPage.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSkills, Skill } from '../api';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    fetchSkills(query || undefined).then(setSkills);
  }, [query]);

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Skill Registry</h1>
      <input
        placeholder="Search skills..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
      />
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {skills.map((skill) => (
          <li key={skill.id} style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            <Link to={`/skills/${skill.id}`}><strong>{skill.name}</strong></Link>
            <p style={{ margin: '0.25rem 0 0' }}>{skill.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

**Step 6: Run SearchPage tests to verify they pass**

```bash
cd frontend && npx vitest run src/pages/SearchPage.test.tsx
```
Expected: PASS

**Step 7: Write failing test for RegisterPage**

Create `frontend/src/pages/RegisterPage.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';

vi.mock('../api');
import * as api from '../api';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

describe('RegisterPage', () => {
  it('submits form and calls registerSkill', async () => {
    vi.mocked(api.registerSkill).mockResolvedValue({
      id: '1', name: 'N', description: 'D', content: 'C', createdAt: ''
    });
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);

    await userEvent.type(screen.getByLabelText(/name/i), 'My Skill');
    await userEvent.type(screen.getByLabelText(/description/i), 'A description');
    await userEvent.type(screen.getByLabelText(/content/i), '# Skill content');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(api.registerSkill).toHaveBeenCalledWith({
      name: 'My Skill',
      description: 'A description',
      content: '# Skill content',
    });
  });
});
```

**Step 8: Create `frontend/src/pages/RegisterPage.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerSkill } from '../api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await registerSkill({ name, description, content });
    navigate('/');
  }

  return (
    <main style={{ padding: '1rem', maxWidth: '600px' }}>
      <h1>Register a Skill</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="name">Name</label><br />
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="description">Description</label><br />
          <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="content">Content (Markdown)</label><br />
          <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={10} style={{ width: '100%' }} />
        </div>
        <button type="submit">Submit</button>
      </form>
    </main>
  );
}
```

**Step 9: Write failing test for SkillDetailPage**

Create `frontend/src/pages/SkillDetailPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SkillDetailPage from './SkillDetailPage';

vi.mock('../api');
import * as api from '../api';

beforeEach(() => {
  vi.mocked(api.fetchSkill).mockResolvedValue({
    id: '1', name: 'My Skill', description: 'A desc', content: '# Hello World', createdAt: ''
  });
});

describe('SkillDetailPage', () => {
  it('renders the skill name and content', async () => {
    render(
      <MemoryRouter initialEntries={['/skills/1']}>
        <Routes>
          <Route path="/skills/:id" element={<SkillDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('My Skill')).toBeInTheDocument());
    expect(screen.getByText('A desc')).toBeInTheDocument();
  });
});
```

**Step 10: Create `frontend/src/pages/SkillDetailPage.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { fetchSkill, Skill } from '../api';

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [skill, setSkill] = useState<Skill | null>(null);

  useEffect(() => {
    if (id) fetchSkill(id).then(setSkill);
  }, [id]);

  if (!skill) return <p style={{ padding: '1rem' }}>Loading...</p>;

  return (
    <main style={{ padding: '1rem', maxWidth: '800px' }}>
      <h1>{skill.name}</h1>
      <p><em>{skill.description}</em></p>
      <hr />
      <ReactMarkdown>{skill.content}</ReactMarkdown>
    </main>
  );
}
```

**Step 11: Run all frontend tests**

```bash
cd frontend && npx vitest run
```
Expected: All PASS

**Step 12: Commit**

```bash
git add frontend/src/
git commit -m "feat: add frontend pages and routing with tests"
```

---

### Task 7: Final Integration Verification

**Step 1: Run all backend tests**

```bash
cd backend && npm test
```
Expected: All PASS

**Step 2: Run all frontend tests**

```bash
cd frontend && npm test
```
Expected: All PASS

**Step 3: Start both servers and test end-to-end**

Terminal 1:
```bash
cd backend && npm run dev
```

Terminal 2:
```bash
cd frontend && npm run dev
```

Open `http://localhost:5173` in the browser.

- Verify the NavBar shows "Search Skills" and "Register Skill" links
- Go to Register, submit a skill with name/description/content
- Go back to Search, verify the skill appears
- Search for a keyword — verify results filter
- Click a skill — verify detail page renders markdown content

**Step 4: Commit final state**

```bash
git add .
git commit -m "feat: complete skill registry implementation"
```
