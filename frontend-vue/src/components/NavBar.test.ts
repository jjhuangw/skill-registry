import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import NavBar from './NavBar.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/register', component: { template: '<div/>' } },
  ],
})

describe('NavBar', () => {
  it('renders search and register links', async () => {
    const wrapper = mount(NavBar, { global: { plugins: [router] } })
    await router.isReady()
    const links = wrapper.findAll('a')
    const texts = links.map(l => l.text())
    expect(texts).toContain('Search Skills')
    expect(texts).toContain('Register Skill')
  })
})
