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
