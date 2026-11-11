<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import AppShell from '@/components/AppShell.vue'
import { useSiteStore } from '@/stores/site'
import { useThemeStore } from '@/stores/theme'

const site = useSiteStore()
const theme = useThemeStore()
theme.apply()
onMounted(() => site.start())
onUnmounted(() => site.pause())
</script>

<template>
  <AppShell />
</template>
