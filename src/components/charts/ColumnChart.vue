<script setup lang="ts">
import { computed } from 'vue'

/** Minimal dependency-free column chart. */
const props = defineProps<{ points: { label: string; value: number }[] }>()
const W = 640
const H = 200
const pad = { l: 34, r: 8, t: 14, b: 30 }
const max = computed(() => Math.max(4, ...props.points.map((p) => p.value)))
const top = computed(() => Math.ceil(max.value / 4) * 4)
const bw = computed(() => (W - pad.l - pad.r) / props.points.length)
const y = (v: number) => pad.t + ((top.value - v) * (H - pad.t - pad.b)) / top.value
const ticks = computed(() => [0, top.value / 2, top.value])
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" class="w-full" role="img" aria-label="Violations per day">
    <g v-for="t in ticks" :key="t">
      <line :x1="pad.l" :x2="W - pad.r" :y1="y(t)" :y2="y(t)" stroke="rgb(var(--line))" />
      <text :x="pad.l - 6" :y="y(t) + 3" text-anchor="end" font-size="13" fill="rgb(var(--mute))">{{ t }}</text>
    </g>
    <g v-for="(p, i) in points" :key="i">
      <rect :x="pad.l + i * bw + bw * 0.2" :y="y(p.value)" :width="bw * 0.6" :height="H - pad.b - y(p.value)" rx="2" fill="rgb(var(--brand))" fill-opacity="0.85">
        <title>{{ p.label }}: {{ p.value }}</title>
      </rect>
      <text v-if="(i % 2 === 0 && i < points.length - 2) || i === points.length - 1" :x="pad.l + i * bw + bw / 2" :y="H - 9" text-anchor="middle" font-size="13" fill="rgb(var(--mute))">{{ p.label }}</text>
    </g>
  </svg>
</template>
