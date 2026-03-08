import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SkillDetailPage from './SkillDetailPage';

vi.mock('../api');
import * as api from '../api';

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div>{children}</div> }));

beforeEach(() => {
  vi.mocked(api.fetchSkill).mockResolvedValue({
    id: '1', name: 'My Skill', description: 'A desc', content: '# Hello World', createdAt: ''
  });
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
});
