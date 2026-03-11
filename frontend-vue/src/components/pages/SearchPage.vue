<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { fetchSkills, deleteSkill } from '../../api'
import type { Skill } from '../../types'

const query = ref('')
const skills = ref<Skill[]>([])

async function loadSkills() {
  try {
    skills.value = await fetchSkills(query.value || undefined)
  } catch {
    alert('Failed to load skills. Please try again.')
  }
}

onMounted(loadSkills)
watch(query, loadSkills)

async function handleDelete(id: string) {
  if (!window.confirm('Delete this skill?')) return
  try {
    await deleteSkill(id)
    skills.value = skills.value.filter(s => s.id !== id)
  } catch {
    alert('Failed to delete skill. Please try again.')
  }
}
</script>

<template>
  <main class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Skill Registry</h1>
    <input
      v-model="query"
      placeholder="Search skills..."
      class="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-400"
    />
    <ul class="space-y-4">
      <li
        v-for="skill in skills"
        :key="skill.id"
        class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <RouterLink
          :to="`/skills/${skill.id}`"
          class="text-lg font-semibold text-indigo-600 hover:text-indigo-800"
        >
          {{ skill.name }}
        </RouterLink>
        <p class="text-gray-600 mt-1 text-sm">{{ skill.description }}</p>
        <button
          @click="handleDelete(skill.id)"
          class="mt-2 text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          Delete
        </button>
      </li>
    </ul>
    <p v-if="skills.length === 0" class="text-gray-400 text-center mt-8">No skills found.</p>
  </main>
</template>
