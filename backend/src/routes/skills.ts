import { Router, Request, Response } from 'express';
import { listSkills, getSkillById, createSkill } from '../skills';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const q = req.query.q as string | undefined;
  res.json(listSkills(q));
});

router.get('/:id', (req: Request, res: Response) => {
  const skill = getSkillById(req.params['id'] as string);
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
