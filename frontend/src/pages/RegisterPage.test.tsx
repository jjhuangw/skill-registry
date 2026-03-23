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
