<script setup lang="ts">
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <NavBar />
    <RouterView />
  </div>
</template>
