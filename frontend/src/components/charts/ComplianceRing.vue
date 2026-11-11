<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: number; size?: number }>()
const r = 52
const C = 2 * Math.PI * r
const dash = computed(() => `${(Math.max(0, Math.min(100, props.value)) / 100) * C} ${C}`)
const color = computed(() => (props.value >= 85 ? 'rgb(var(--ok))' : props.value >= 70 ? 'rgb(var(--warn))' : 'rgb(var(--critical))'))
</script>

<template>
  <svg viewBox="0 0 128 128" :width="size ?? 140" :height="size ?? 140" role="img" :aria-label="`Compliance ${value}%`" class="shrink-0">
    <circle cx="64" cy="64" :r="r" fill="none" stroke="rgb(var(--sunken))" stroke-width="10" />
    <circle cx="64" cy="64" :r="r" fill="none" :stroke="color" stroke-width="10" stroke-linecap="round" :stroke-dasharray="dash" transform="rotate(-90 64 64)" />
    <text x="64" y="73" text-anchor="middle" font-size="30" font-weight="700" fill="rgb(var(--ink))">{{ value }}%</text>
  </svg>
</template>
