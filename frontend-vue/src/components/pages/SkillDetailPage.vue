<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueMarkdownRender from 'vue-markdown-render'
import { fetchSkill, deleteSkill } from '../../api'
import type { Skill } from '../../types'

const route = useRoute()
const router = useRouter()
const skill = ref<Skill | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    skill.value = await fetchSkill(route.params.id as string)
  } catch {
    error.value = 'Skill not found or failed to load.'
  }
})

async function handleDelete() {
  if (!skill.value) return
  if (!window.confirm('Delete this skill?')) return
  try {
    await deleteSkill(skill.value.id)
    router.push('/')
  } catch {
    alert('Failed to delete skill. Please try again.')
  }
}
</script>

<template>
  <main class="max-w-3xl mx-auto px-4 py-8">
    <p v-if="error" class="text-red-500">{{ error }}</p>
    <p v-else-if="!skill" class="text-gray-400">Loading...</p>
    <template v-else>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ skill.name }}</h1>
      <p class="text-gray-500 italic mb-4">{{ skill.description }}</p>
      <hr class="border-gray-200 mb-6" />
      <div class="prose prose-indigo max-w-none">
        <VueMarkdownRender :source="skill.content" />
      </div>
      <button
        @click="handleDelete"
        class="mt-8 bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
      >
        Delete
      </button>
    </template>
  </main>
</template>
