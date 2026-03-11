import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import SearchPage from './SearchPage.vue'
import * as api from '../../api'

vi.mock('../../api')

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: SearchPage },
    { path: '/skills/:id', component: { template: '<div/>' } },
  ],
})

const mockSkills = [
  { id: '1', name: 'Python Guide', description: 'About Python', content: '...', createdAt: '2024-01-01' },
  { id: '2', name: 'Vue Intro', description: 'About Vue', content: '...', createdAt: '2024-01-02' },
]

beforeEach(() => {
  vi.mocked(api.fetchSkills).mockResolvedValue(mockSkills)
  vi.mocked(api.deleteSkill).mockResolvedValue(undefined)
})

describe('SearchPage', () => {
  it('renders skill list on mount', async () => {
    const wrapper = mount(SearchPage, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.text()).toContain('Python Guide')
    expect(wrapper.text()).toContain('Vue Intro')
  })

  it('shows search input', async () => {
    const wrapper = mount(SearchPage, { global: { plugins: [router] } })
    expect(wrapper.find('input').exists()).toBe(true)
  })
})
