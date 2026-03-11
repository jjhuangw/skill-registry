import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchSkills, fetchSkill, registerSkill, deleteSkill } from './api'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => mockFetch.mockReset())

describe('fetchSkills', () => {
  it('calls /api/skills without query', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    const result = await fetchSkills()
    expect(mockFetch).toHaveBeenCalledWith('/api/skills')
    expect(result).toEqual([])
  })

  it('calls /api/skills?q=... with query', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })
    await fetchSkills('python')
    expect(mockFetch).toHaveBeenCalledWith('/api/skills?q=python')
  })
})

describe('deleteSkill', () => {
  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 })
    await expect(deleteSkill('bad-id')).rejects.toThrow('Failed to delete skill: 404')
  })
})
