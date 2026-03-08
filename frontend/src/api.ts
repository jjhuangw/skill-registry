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
