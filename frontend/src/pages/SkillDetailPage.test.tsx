import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SkillDetailPage from './SkillDetailPage';

vi.mock('../api');
import * as api from '../api';

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div>{children}</div> }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  vi.mocked(api.fetchSkill).mockResolvedValue({
    id: '1', name: 'My Skill', description: 'A desc', content: '# Hello World', createdAt: ''
  });
  vi.mocked(api.deleteSkill).mockResolvedValue(undefined);
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

  it('deletes skill and navigates to / on confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <MemoryRouter initialEntries={['/skills/1']}>
        <Routes>
          <Route path="/skills/:id" element={<SkillDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('My Skill')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(api.deleteSkill).toHaveBeenCalledWith('1');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
