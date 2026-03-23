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

export function deleteSkill(id: string): boolean {
  const skills = readSkills();
  const index = skills.findIndex((s) => s.id === id);
  if (index === -1) return false;
  skills.splice(index, 1);
  writeSkills(skills);
  return true;
}
