import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import SkillDetailPage from './SkillDetailPage.vue'
import * as api from '../../api'

vi.mock('../../api')

const mockSkill = {
  id: 'abc',
  name: 'Python Guide',
  description: 'About Python',
  content: '# Hello',
  createdAt: '2024-01-01',
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/skills/:id', component: SkillDetailPage },
    { path: '/', component: { template: '<div/>' } },
  ],
})

beforeEach(() => {
  vi.mocked(api.fetchSkill).mockResolvedValue(mockSkill)
  vi.mocked(api.deleteSkill).mockResolvedValue(undefined)
})

describe('SkillDetailPage', () => {
  it('renders skill name and description', async () => {
    await router.push('/skills/abc')
    const wrapper = mount(SkillDetailPage, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.text()).toContain('Python Guide')
    expect(wrapper.text()).toContain('About Python')
  })

  it('renders delete button', async () => {
    await router.push('/skills/abc')
    const wrapper = mount(SkillDetailPage, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.find('button').text()).toBe('Delete')
  })
})
