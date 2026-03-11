# Vue + Python Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the Skill Registry app from React+Express/TypeScript to Vue 3+FastAPI/Python with Tailwind CSS styling, in new sibling directories `frontend-vue/` and `backend-python/`.

**Architecture:** New `backend-python/` directory contains a FastAPI app reading/writing `data/skills.json`. New `frontend-vue/` directory contains a Vite+Vue 3+Tailwind app that proxies `/api/*` to the FastAPI backend on port 8000. Old directories (`frontend/`, `backend/`) are left untouched.

**Tech Stack:** Python 3.11+, FastAPI, Uvicorn, Pydantic v2, pytest, httpx; Vue 3, Vite, TypeScript, Tailwind CSS v3, Vue Router 4, vue-markdown-render, Vitest, @vue/test-utils

---

## Task 1: Set up backend-python scaffold

**Files:**
- Create: `backend-python/requirements.txt`
- Create: `backend-python/data/skills.json`

**Step 1: Create requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
httpx==0.27.0
pytest==8.3.0
pytest-asyncio==0.24.0
```

**Step 2: Create empty data file**

```json
[]
```

**Step 3: Verify directory structure**

Run: `ls backend-python/`
Expected: `data/  requirements.txt`

**Step 4: Install dependencies**

Run (from `backend-python/`):
```bash
python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
```
Expected: All packages install without errors.

**Step 5: Commit**

```bash
git add backend-python/
git commit -m "chore: scaffold backend-python directory"
```

---

## Task 2: Create Pydantic models

**Files:**
- Create: `backend-python/models.py`

**Step 1: Write the file**

```python
from pydantic import BaseModel


class SkillCreate(BaseModel):
    name: str
    description: str
    content: str


class Skill(SkillCreate):
    id: str
    createdAt: str
```

**Step 2: Verify import works**

Run (from `backend-python/` with venv active):
```bash
python -c "from models import Skill, SkillCreate; print('OK')"
```
Expected: `OK`

**Step 3: Commit**

```bash
git add backend-python/models.py
git commit -m "feat: add Pydantic models for Skill"
```

---

## Task 3: Create skills data-access layer (TDD)

**Files:**
- Create: `backend-python/skills.py`
- Create: `backend-python/test_skills.py`

**Step 1: Write the failing tests**

```python
# backend-python/test_skills.py
import json
import os
import pytest
from skills import list_skills, get_skill_by_id, create_skill, delete_skill

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "skills.json")


@pytest.fixture(autouse=True)
def reset_data():
    with open(DATA_PATH, "w") as f:
        json.dump([], f)
    yield
    with open(DATA_PATH, "w") as f:
        json.dump([], f)


def test_create_skill_returns_skill_with_id():
    skill = create_skill(name="foo", description="bar", content="baz")
    assert skill.name == "foo"
    assert skill.description == "bar"
    assert skill.content == "baz"
    assert skill.id is not None
    assert skill.createdAt is not None


def test_list_skills_returns_all():
    create_skill(name="a", description="d1", content="c1")
    create_skill(name="b", description="d2", content="c2")
    skills = list_skills()
    assert len(skills) == 2


def test_list_skills_filters_by_query():
    create_skill(name="python guide", description="about python", content="...")
    create_skill(name="vue intro", description="about vue", content="...")
    skills = list_skills(query="python")
    assert len(skills) == 1
    assert skills[0].name == "python guide"


def test_get_skill_by_id_returns_skill():
    created = create_skill(name="x", description="y", content="z")
    found = get_skill_by_id(created.id)
    assert found is not None
    assert found.id == created.id


def test_get_skill_by_id_returns_none_for_missing():
    assert get_skill_by_id("nonexistent") is None


def test_delete_skill_removes_it():
    skill = create_skill(name="del", description="me", content="bye")
    assert delete_skill(skill.id) is True
    assert get_skill_by_id(skill.id) is None


def test_delete_skill_returns_false_for_missing():
    assert delete_skill("nonexistent") is False
```

**Step 2: Run tests to verify they fail**

Run: `pytest test_skills.py -v`
Expected: All 7 tests FAIL with `ModuleNotFoundError: No module named 'skills'`

**Step 3: Write minimal implementation**

```python
# backend-python/skills.py
import json
import os
from datetime import datetime, timezone
from uuid import uuid4

from models import Skill

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "skills.json")


def _read() -> list[dict]:
    with open(DATA_PATH) as f:
        return json.load(f)


def _write(skills: list[dict]) -> None:
    with open(DATA_PATH, "w") as f:
        json.dump(skills, f, indent=2)


def list_skills(query: str | None = None) -> list[Skill]:
    skills = [Skill(**s) for s in _read()]
    if not query:
        return skills
    q = query.lower()
    return [
        s for s in skills
        if q in s.name.lower() or q in s.description.lower() or q in s.content.lower()
    ]


def get_skill_by_id(id: str) -> Skill | None:
    for s in _read():
        if s["id"] == id:
            return Skill(**s)
    return None


def create_skill(name: str, description: str, content: str) -> Skill:
    skills = _read()
    skill = Skill(
        id=str(uuid4()),
        name=name,
        description=description,
        content=content,
        createdAt=datetime.now(timezone.utc).isoformat(),
    )
    skills.append(skill.model_dump())
    _write(skills)
    return skill


def delete_skill(id: str) -> bool:
    skills = _read()
    new_skills = [s for s in skills if s["id"] != id]
    if len(new_skills) == len(skills):
        return False
    _write(new_skills)
    return True
```

**Step 4: Run tests to verify they pass**

Run: `pytest test_skills.py -v`
Expected: All 7 tests PASS

**Step 5: Commit**

```bash
git add backend-python/skills.py backend-python/test_skills.py
git commit -m "feat: add skills data-access layer with tests"
```

---

## Task 4: Create FastAPI app with routes (TDD)

**Files:**
- Create: `backend-python/main.py`
- Create: `backend-python/test_main.py`

**Step 1: Write the failing tests**

```python
# backend-python/test_main.py
import json
import os
import pytest
from fastapi.testclient import TestClient
from main import app

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "skills.json")
client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_data():
    with open(DATA_PATH, "w") as f:
        json.dump([], f)
    yield
    with open(DATA_PATH, "w") as f:
        json.dump([], f)


def test_list_skills_empty():
    r = client.get("/api/skills")
    assert r.status_code == 200
    assert r.json() == []


def test_create_skill():
    r = client.post("/api/skills", json={"name": "n", "description": "d", "content": "c"})
    assert r.status_code == 201
    body = r.json()
    assert body["name"] == "n"
    assert "id" in body


def test_create_skill_missing_fields():
    r = client.post("/api/skills", json={"name": "n"})
    assert r.status_code == 422


def test_get_skill_by_id():
    created = client.post("/api/skills", json={"name": "n", "description": "d", "content": "c"}).json()
    r = client.get(f"/api/skills/{created['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == created["id"]


def test_get_skill_not_found():
    r = client.get("/api/skills/missing")
    assert r.status_code == 404


def test_delete_skill():
    created = client.post("/api/skills", json={"name": "n", "description": "d", "content": "c"}).json()
    r = client.delete(f"/api/skills/{created['id']}")
    assert r.status_code == 204
    assert client.get(f"/api/skills/{created['id']}").status_code == 404


def test_delete_skill_not_found():
    r = client.delete("/api/skills/missing")
    assert r.status_code == 404


def test_list_skills_with_query():
    client.post("/api/skills", json={"name": "python guide", "description": "d", "content": "c"})
    client.post("/api/skills", json={"name": "vue intro", "description": "d", "content": "c"})
    r = client.get("/api/skills?q=python")
    assert len(r.json()) == 1
```

**Step 2: Run tests to verify they fail**

Run: `pytest test_main.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'main'`

**Step 3: Write minimal implementation**

```python
# backend-python/main.py
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from models import Skill, SkillCreate
from skills import list_skills, get_skill_by_id, create_skill, delete_skill

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/skills", response_model=list[Skill])
def get_skills(q: str | None = None):
    return list_skills(query=q)


@app.get("/api/skills/{id}", response_model=Skill)
def get_skill(id: str):
    skill = get_skill_by_id(id)
    if not skill:
        raise HTTPException(status_code=404, detail="Not found")
    return skill


@app.post("/api/skills", response_model=Skill, status_code=201)
def post_skill(body: SkillCreate):
    return create_skill(name=body.name, description=body.description, content=body.content)


@app.delete("/api/skills/{id}", status_code=204)
def remove_skill(id: str):
    if not delete_skill(id):
        raise HTTPException(status_code=404, detail="Not found")
    return Response(status_code=204)
```

**Step 4: Run all backend tests**

Run: `pytest -v`
Expected: All 15 tests PASS

**Step 5: Commit**

```bash
git add backend-python/main.py backend-python/test_main.py
git commit -m "feat: add FastAPI routes with tests"
```

---

## Task 5: Scaffold frontend-vue with Vite + Vue + Tailwind

**Files:**
- Create: `frontend-vue/` (scaffolded via npm)

**Step 1: Scaffold with Vite**

Run (from `skill-registry/` root):
```bash
npm create vite@latest frontend-vue -- --template vue-ts
cd frontend-vue && npm install
```

**Step 2: Install Tailwind CSS v3**

Run (from `frontend-vue/`):
```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

**Step 3: Configure Tailwind — replace `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: { extend: {} },
  plugins: [],
}
```

**Step 4: Replace `src/style.css` with Tailwind directives**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 5: Install Vue Router and vue-markdown-render**

Run:
```bash
npm install vue-router@4 vue-markdown-render
```

**Step 6: Install Vitest and Vue Test Utils**

Run:
```bash
npm install -D vitest @vue/test-utils jsdom @vitejs/plugin-vue
```

**Step 7: Configure Vite — replace `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

**Step 8: Add test script to `package.json`**

In `package.json` scripts, add:
```json
"test": "vitest run"
```

**Step 9: Delete boilerplate**

Delete `src/components/HelloWorld.vue`, `src/App.vue` content will be replaced in next task.

**Step 10: Verify dev server starts**

Run: `npm run dev`
Expected: Server starts on `http://localhost:5173`

**Step 11: Commit**

```bash
git add frontend-vue/
git commit -m "chore: scaffold frontend-vue with Vue 3, Tailwind, Vue Router"
```

---

## Task 6: Create types, api, and router

**Files:**
- Create: `frontend-vue/src/types.ts`
- Create: `frontend-vue/src/api.ts`
- Create: `frontend-vue/src/router.ts`
- Create: `frontend-vue/src/api.test.ts`

**Step 1: Create `src/types.ts`**

```ts
export interface Skill {
  id: string
  name: string
  description: string
  content: string
  createdAt: string
}
```

**Step 2: Create `src/api.ts`**

```ts
import type { Skill } from './types'

export async function fetchSkills(query?: string): Promise<Skill[]> {
  const url = query ? `/api/skills?q=${encodeURIComponent(query)}` : '/api/skills'
  const res = await fetch(url)
  return res.json()
}

export async function fetchSkill(id: string): Promise<Skill> {
  const res = await fetch(`/api/skills/${id}`)
  return res.json()
}

export async function registerSkill(data: {
  name: string
  description: string
  content: string
}): Promise<Skill> {
  const res = await fetch('/api/skills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function deleteSkill(id: string): Promise<void> {
  const res = await fetch(`/api/skills/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete skill: ${res.status}`)
}
```

**Step 3: Write failing test for api.ts**

```ts
// frontend-vue/src/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchSkills, fetchSkill, registerSkill, deleteSkill } from './api'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => mockFetch.mockReset())

describe('fetchSkills', () => {
  it('calls /api/skills without query', async () => {
    mockFetch.mockResolvedValue({ json: async () => [] })
    const result = await fetchSkills()
    expect(mockFetch).toHaveBeenCalledWith('/api/skills')
    expect(result).toEqual([])
  })

  it('calls /api/skills?q=... with query', async () => {
    mockFetch.mockResolvedValue({ json: async () => [] })
    await fetchSkills('python')
    expect(mockFetch).toHaveBeenCalledWith('/api/skills?q=python')
  })
})

describe('deleteSkill', () => {
  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 })
    await expect(deleteSkill('bad-id')).rejects.toThrow('Failed to delete skill: 404')
  })
})
```

**Step 4: Run test to verify it fails**

Run: `npx vitest run src/api.test.ts`
Expected: FAIL (api.ts not yet written correctly — or PASS if already written, proceed)

**Step 5: Run test to verify it passes**

Run: `npx vitest run src/api.test.ts`
Expected: All 3 tests PASS

**Step 6: Create `src/router.ts`**

```ts
import { createRouter, createWebHistory } from 'vue-router'
import SearchPage from './components/pages/SearchPage.vue'
import RegisterPage from './components/pages/RegisterPage.vue'
import SkillDetailPage from './components/pages/SkillDetailPage.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: SearchPage },
    { path: '/register', component: RegisterPage },
    { path: '/skills/:id', component: SkillDetailPage },
  ],
})
```

**Step 7: Commit**

```bash
git add frontend-vue/src/types.ts frontend-vue/src/api.ts frontend-vue/src/api.test.ts frontend-vue/src/router.ts
git commit -m "feat: add types, api module, and Vue Router config"
```

---

## Task 7: Create App.vue and main.ts

**Files:**
- Modify: `frontend-vue/src/App.vue`
- Modify: `frontend-vue/src/main.ts`

**Step 1: Replace `src/App.vue`**

```vue
<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <NavBar />
    <RouterView />
  </div>
</template>

<script lang="ts">
import NavBar from './components/NavBar.vue'
</script>
```

Wait — with `<script setup>`, imports go inside the setup block. Use this instead:

```vue
<script setup lang="ts">
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <NavBar />
    <RouterView />
  </div>
</template>
```

**Step 2: Replace `src/main.ts`**

```ts
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
```

**Step 3: Commit**

```bash
git add frontend-vue/src/App.vue frontend-vue/src/main.ts
git commit -m "feat: set up App root with router"
```

---

## Task 8: Create NavBar component

**Files:**
- Create: `frontend-vue/src/components/NavBar.vue`
- Create: `frontend-vue/src/components/NavBar.test.ts`

**Step 1: Write the failing test**

```ts
// frontend-vue/src/components/NavBar.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import NavBar from './NavBar.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }],
})

describe('NavBar', () => {
  it('renders search and register links', async () => {
    const wrapper = mount(NavBar, { global: { plugins: [router] } })
    await router.isReady()
    const links = wrapper.findAll('a')
    const texts = links.map(l => l.text())
    expect(texts).toContain('Search Skills')
    expect(texts).toContain('Register Skill')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/NavBar.test.ts`
Expected: FAIL with component not found

**Step 3: Create NavBar.vue**

```vue
<script setup lang="ts">
</script>

<template>
  <nav class="bg-white border-b border-gray-200 px-6 py-3 flex gap-6 shadow-sm">
    <RouterLink
      to="/"
      class="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
    >
      Search Skills
    </RouterLink>
    <RouterLink
      to="/register"
      class="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
    >
      Register Skill
    </RouterLink>
  </nav>
</template>
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/NavBar.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend-vue/src/components/NavBar.vue frontend-vue/src/components/NavBar.test.ts
git commit -m "feat: add NavBar component"
```

---

## Task 9: Create SearchPage

**Files:**
- Create: `frontend-vue/src/components/pages/SearchPage.vue`
- Create: `frontend-vue/src/components/pages/SearchPage.test.ts`

**Step 1: Write failing test**

```ts
// frontend-vue/src/components/pages/SearchPage.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import SearchPage from './SearchPage.vue'
import * as api from '../../api'

vi.mock('../../api')

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: SearchPage },
    { path: '/skills/:id', component: { template: '<div/>' } },
  ],
})

const mockSkills = [
  { id: '1', name: 'Python Guide', description: 'About Python', content: '...', createdAt: '2024-01-01' },
  { id: '2', name: 'Vue Intro', description: 'About Vue', content: '...', createdAt: '2024-01-02' },
]

beforeEach(() => {
  vi.mocked(api.fetchSkills).mockResolvedValue(mockSkills)
  vi.mocked(api.deleteSkill).mockResolvedValue(undefined)
})

describe('SearchPage', () => {
  it('renders skill list on mount', async () => {
    const wrapper = mount(SearchPage, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.text()).toContain('Python Guide')
    expect(wrapper.text()).toContain('Vue Intro')
  })

  it('shows search input', async () => {
    const wrapper = mount(SearchPage, { global: { plugins: [router] } })
    expect(wrapper.find('input').exists()).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/pages/SearchPage.test.ts`
Expected: FAIL

**Step 3: Create `src/components/pages/` directory and SearchPage.vue**

```vue
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchSkills, deleteSkill } from '../../api'
import type { Skill } from '../../types'

const router = useRouter()
const query = ref('')
const skills = ref<Skill[]>([])

async function loadSkills() {
  skills.value = await fetchSkills(query.value || undefined)
}

onMounted(loadSkills)
watch(query, loadSkills)

async function handleDelete(id: string) {
  if (!window.confirm('Delete this skill?')) return
  try {
    await deleteSkill(id)
    skills.value = skills.value.filter(s => s.id !== id)
  } catch {
    alert('Failed to delete skill. Please try again.')
  }
}
</script>

<template>
  <main class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Skill Registry</h1>
    <input
      v-model="query"
      placeholder="Search skills..."
      class="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-400"
    />
    <ul class="space-y-4">
      <li
        v-for="skill in skills"
        :key="skill.id"
        class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <RouterLink
          :to="`/skills/${skill.id}`"
          class="text-lg font-semibold text-indigo-600 hover:text-indigo-800"
        >
          {{ skill.name }}
        </RouterLink>
        <p class="text-gray-600 mt-1 text-sm">{{ skill.description }}</p>
        <button
          @click="handleDelete(skill.id)"
          class="mt-2 text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          Delete
        </button>
      </li>
    </ul>
    <p v-if="skills.length === 0" class="text-gray-400 text-center mt-8">No skills found.</p>
  </main>
</template>
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/pages/SearchPage.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend-vue/src/components/pages/
git commit -m "feat: add SearchPage component"
```

---

## Task 10: Create RegisterPage

**Files:**
- Create: `frontend-vue/src/components/pages/RegisterPage.vue`
- Create: `frontend-vue/src/components/pages/RegisterPage.test.ts`

**Step 1: Write failing test**

```ts
// frontend-vue/src/components/pages/RegisterPage.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import RegisterPage from './RegisterPage.vue'
import * as api from '../../api'

vi.mock('../../api')

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/register', component: RegisterPage },
    { path: '/', component: { template: '<div/>' } },
  ],
})

describe('RegisterPage', () => {
  it('renders form fields', () => {
    const wrapper = mount(RegisterPage, { global: { plugins: [router] } })
    expect(wrapper.find('input#name').exists()).toBe(true)
    expect(wrapper.find('input#description').exists()).toBe(true)
    expect(wrapper.find('textarea#content').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('calls registerSkill and navigates on submit', async () => {
    vi.mocked(api.registerSkill).mockResolvedValue({
      id: '1', name: 'n', description: 'd', content: 'c', createdAt: ''
    })
    const wrapper = mount(RegisterPage, { global: { plugins: [router] } })
    await router.push('/register')
    await wrapper.find('input#name').setValue('n')
    await wrapper.find('input#description').setValue('d')
    await wrapper.find('textarea#content').setValue('c')
    await wrapper.find('form').trigger('submit')
    expect(api.registerSkill).toHaveBeenCalledWith({ name: 'n', description: 'd', content: 'c' })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/pages/RegisterPage.test.ts`
Expected: FAIL

**Step 3: Create RegisterPage.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerSkill } from '../../api'

const router = useRouter()
const name = ref('')
const description = ref('')
const content = ref('')

async function handleSubmit() {
  await registerSkill({ name: name.value, description: description.value, content: content.value })
  router.push('/')
}
</script>

<template>
  <main class="max-w-xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Register a Skill</h1>
    <form @submit.prevent="handleSubmit" class="space-y-5">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          id="name"
          v-model="name"
          required
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          id="description"
          v-model="description"
          required
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div>
        <label for="content" class="block text-sm font-medium text-gray-700 mb-1">Content (Markdown)</label>
        <textarea
          id="content"
          v-model="content"
          required
          rows="10"
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono text-sm"
        />
      </div>
      <button
        type="submit"
        class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
      >
        Submit
      </button>
    </form>
  </main>
</template>
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/pages/RegisterPage.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend-vue/src/components/pages/RegisterPage.vue frontend-vue/src/components/pages/RegisterPage.test.ts
git commit -m "feat: add RegisterPage component"
```

---

## Task 11: Create SkillDetailPage

**Files:**
- Create: `frontend-vue/src/components/pages/SkillDetailPage.vue`
- Create: `frontend-vue/src/components/pages/SkillDetailPage.test.ts`

**Step 1: Write failing test**

```ts
// frontend-vue/src/components/pages/SkillDetailPage.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import SkillDetailPage from './SkillDetailPage.vue'
import * as api from '../../api'

vi.mock('../../api')

const mockSkill = {
  id: 'abc',
  name: 'Python Guide',
  description: 'About Python',
  content: '# Hello',
  createdAt: '2024-01-01',
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/skills/:id', component: SkillDetailPage },
    { path: '/', component: { template: '<div/>' } },
  ],
})

beforeEach(() => {
  vi.mocked(api.fetchSkill).mockResolvedValue(mockSkill)
  vi.mocked(api.deleteSkill).mockResolvedValue(undefined)
})

describe('SkillDetailPage', () => {
  it('renders skill name and description', async () => {
    await router.push('/skills/abc')
    const wrapper = mount(SkillDetailPage, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.text()).toContain('Python Guide')
    expect(wrapper.text()).toContain('About Python')
  })

  it('renders delete button', async () => {
    await router.push('/skills/abc')
    const wrapper = mount(SkillDetailPage, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.find('button').text()).toBe('Delete')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/pages/SkillDetailPage.test.ts`
Expected: FAIL

**Step 3: Create SkillDetailPage.vue**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueMarkdownRender } from 'vue-markdown-render'
import { fetchSkill, deleteSkill } from '../../api'
import type { Skill } from '../../types'

const route = useRoute()
const router = useRouter()
const skill = ref<Skill | null>(null)

onMounted(async () => {
  skill.value = await fetchSkill(route.params.id as string)
})

async function handleDelete() {
  if (!window.confirm('Delete this skill?')) return
  try {
    await deleteSkill(skill.value!.id)
    router.push('/')
  } catch {
    alert('Failed to delete skill. Please try again.')
  }
}
</script>

<template>
  <main class="max-w-3xl mx-auto px-4 py-8">
    <p v-if="!skill" class="text-gray-400">Loading...</p>
    <template v-else>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ skill.name }}</h1>
      <p class="text-gray-500 italic mb-4">{{ skill.description }}</p>
      <hr class="border-gray-200 mb-6" />
      <div class="prose prose-indigo max-w-none">
        <VueMarkdownRender :source="skill.content" />
      </div>
      <button
        @click="handleDelete"
        class="mt-8 bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
      >
        Delete
      </button>
    </template>
  </main>
</template>
```

**Step 4: Install @tailwindcss/typography for prose styles**

Run (from `frontend-vue/`):
```bash
npm install -D @tailwindcss/typography
```

Update `tailwind.config.js`:
```js
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')],
}
```

**Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/pages/SkillDetailPage.test.ts`
Expected: PASS

**Step 6: Run all frontend tests**

Run: `npx vitest run`
Expected: All tests PASS

**Step 7: Commit**

```bash
git add frontend-vue/src/components/pages/SkillDetailPage.vue frontend-vue/src/components/pages/SkillDetailPage.test.ts frontend-vue/tailwind.config.js
git commit -m "feat: add SkillDetailPage component"
```

---

## Task 12: Final verification — run both apps together

**Step 1: Start FastAPI backend**

Run (from `backend-python/`, venv active):
```bash
uvicorn main:app --reload --port 8000
```
Expected: `Uvicorn running on http://127.0.0.1:8000`

**Step 2: Start Vue frontend**

Run (from `frontend-vue/` in a separate terminal):
```bash
npm run dev
```
Expected: `Local: http://localhost:5173`

**Step 3: Manual smoke test checklist**

- [ ] Open `http://localhost:5173` — Search Skills page loads with empty list
- [ ] Navigate to Register Skill — form renders correctly
- [ ] Submit a new skill — redirected to home, skill appears in list
- [ ] Click skill name — detail page shows name, description, markdown content
- [ ] Delete from detail page — redirected to home, skill removed
- [ ] Delete from list — skill removed from list
- [ ] Search by name — filters correctly

**Step 4: Commit final state if any adjustments made**

```bash
git add -A
git commit -m "feat: complete Vue + FastAPI migration"
```
