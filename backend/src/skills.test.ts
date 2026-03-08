import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';

vi.mock('fs');

// Mock the data file path resolution
vi.mock('path', async () => {
  const actual = await vi.importActual<typeof import('path')>('path');
  return { ...actual };
});

import { listSkills, getSkillById, createSkill, deleteSkill } from './skills';

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
