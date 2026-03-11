import type { Skill } from './types'

export async function fetchSkills(query?: string): Promise<Skill[]> {
  const url = query ? `/api/skills?q=${encodeURIComponent(query)}` : '/api/skills'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch skills: ${res.status}`)
  return res.json()
}

export async function fetchSkill(id: string): Promise<Skill> {
  const res = await fetch(`/api/skills/${id}`)
  if (!res.ok) throw new Error(`Failed to fetch skill: ${res.status}`)
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
  if (!res.ok) throw new Error(`Failed to register skill: ${res.status}`)
  return res.json()
}

export async function deleteSkill(id: string): Promise<void> {
  const res = await fetch(`/api/skills/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete skill: ${res.status}`)
}
