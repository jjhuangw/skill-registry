import { describe, it, expect, vi, beforeEach } from 'vitest';

globalThis.fetch = vi.fn() as typeof fetch;

import { fetchSkills, fetchSkill, registerSkill, deleteSkill } from './api';

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

describe('deleteSkill', () => {
  it('sends DELETE to /api/skills/:id', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    await deleteSkill('1');
    expect(fetch).toHaveBeenCalledWith('/api/skills/1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('throws when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(deleteSkill('999')).rejects.toThrow('Failed to delete skill: 404');
  });
});
