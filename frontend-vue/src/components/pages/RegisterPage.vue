<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerSkill } from '../../api'

const router = useRouter()
const name = ref('')
const description = ref('')
const content = ref('')

async function handleSubmit() {
  try {
    await registerSkill({ name: name.value, description: description.value, content: content.value })
    router.push('/')
  } catch {
    alert('Failed to register skill. Please try again.')
  }
}
</script>

<template>
  <main class="max-w-xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Register a Skill</h1>
    <form @submit.prevent="handleSubmit" class="space-y-5">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          id="name"
          v-model="name"
          required
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          id="description"
          v-model="description"
          required
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div>
        <label for="content" class="block text-sm font-medium text-gray-700 mb-1">Content (Markdown)</label>
        <textarea
          id="content"
          v-model="content"
          required
          rows="10"
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono text-sm"
        />
      </div>
      <button
        type="submit"
        class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
      >
        Submit
      </button>
    </form>
  </main>
</template>
