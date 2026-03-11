import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import RegisterPage from './RegisterPage.vue'
import * as api from '../../api'

vi.mock('../../api')

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/register', component: RegisterPage },
    { path: '/', component: { template: '<div/>' } },
  ],
})

describe('RegisterPage', () => {
  it('renders form fields', () => {
    const wrapper = mount(RegisterPage, { global: { plugins: [router] } })
    expect(wrapper.find('input#name').exists()).toBe(true)
    expect(wrapper.find('input#description').exists()).toBe(true)
    expect(wrapper.find('textarea#content').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('calls registerSkill and navigates on submit', async () => {
    vi.mocked(api.registerSkill).mockResolvedValue({
      id: '1', name: 'n', description: 'd', content: 'c', createdAt: ''
    })
    const wrapper = mount(RegisterPage, { global: { plugins: [router] } })
    await router.push('/register')
    await wrapper.find('input#name').setValue('n')
    await wrapper.find('input#description').setValue('d')
    await wrapper.find('textarea#content').setValue('c')
    await wrapper.find('form').trigger('submit')
    expect(api.registerSkill).toHaveBeenCalledWith({ name: 'n', description: 'd', content: 'c' })
  })
})
