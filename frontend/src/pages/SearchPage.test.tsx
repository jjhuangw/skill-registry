import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SearchPage from './SearchPage';

vi.mock('../api');
import * as api from '../api';

const mockSkills = [
  { id: '1', name: 'My Skill', description: 'Does things', content: '# Hi', createdAt: '' },
];

beforeEach(() => {
  vi.mocked(api.fetchSkills).mockResolvedValue(mockSkills);
});

function renderPage() {
  return render(<MemoryRouter><SearchPage /></MemoryRouter>);
}

describe('SearchPage', () => {
  it('shows skills on load', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('My Skill')).toBeInTheDocument());
  });

  it('calls fetchSkills with query on input', async () => {
    renderPage();
    const input = screen.getByPlaceholderText(/search/i);
    await userEvent.type(input, 'hello');
    await waitFor(() => expect(api.fetchSkills).toHaveBeenCalledWith('hello'));
  });
});
