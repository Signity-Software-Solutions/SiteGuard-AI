<script setup lang="ts">
import { computed, ref } from 'vue'

/** Small dependency-free SVG line chart (0–100 %). */
const props = defineProps<{ points: { label: string; value: number; live?: boolean }[]; target?: number }>()

const W = 640
const H = 220
const pad = { l: 44, r: 14, t: 16, b: 30 }
const hover = ref<number | null>(null)

const yMin = computed(() => Math.max(0, Math.floor((Math.min(...props.points.map((p) => p.value)) - 8) / 10) * 10))
const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, props.points.length - 1)
const y = (v: number) => pad.t + ((100 - v) * (H - pad.t - pad.b)) / (100 - yMin.value)
const path = computed(() => props.points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' '))
const area = computed(() => `${path.value} L${x(props.points.length - 1)} ${H - pad.b} L${x(0)} ${H - pad.b} Z`)
const ticks = computed(() => {
  const t: number[] = []
  for (let v = yMin.value; v <= 100; v += 10) t.push(v)
  return t
})
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" class="w-full" role="img" aria-label="Compliance over time" @mouseleave="hover = null">
    <g v-for="t in ticks" :key="t">
      <line :x1="pad.l" :x2="W - pad.r" :y1="y(t)" :y2="y(t)" stroke="rgb(var(--line))" stroke-dasharray="3 4" />
      <text :x="pad.l - 6" :y="y(t) + 3" text-anchor="end" font-size="13" fill="rgb(var(--mute))">{{ t }}%</text>
    </g>
    <line v-if="target" :x1="pad.l" :x2="W - pad.r" :y1="y(target)" :y2="y(target)" stroke="rgb(var(--ok))" stroke-opacity=".6" />
    <text v-if="target" :x="W - pad.r" :y="y(target) - 4" text-anchor="end" font-size="13" fill="rgb(var(--ok))">target {{ target }}%</text>
    <path :d="area" fill="rgb(var(--brand))" fill-opacity=".12" />
    <path :d="path" fill="none" stroke="rgb(var(--brand))" stroke-width="2.5" stroke-linejoin="round" />
    <g v-for="(p, i) in points" :key="i">
      <circle :cx="x(i)" :cy="y(p.value)" :r="p.live ? 5 : hover === i ? 5 : 3" :fill="p.live ? 'rgb(var(--ok))' : 'rgb(var(--brand))'" stroke="rgb(var(--surface))" stroke-width="2" />
      <rect :x="x(i) - 14" :y="pad.t" width="28" :height="H - pad.t - pad.b" fill="transparent" @mouseenter="hover = i" />
      <text v-if="(i % 2 === 0 && i < points.length - 2) || i === points.length - 1" :x="x(i)" :y="H - 9" text-anchor="middle" font-size="13" fill="rgb(var(--mute))">{{ p.label }}</text>
    </g>
    <g v-if="hover !== null">
      <rect :x="Math.min(x(hover) - 34, W - 80)" :y="y(points[hover].value) - 32" width="68" height="22" rx="5" fill="rgb(var(--raised))" stroke="rgb(var(--line))" />
      <text :x="Math.min(x(hover), W - 46)" :y="y(points[hover].value) - 17" text-anchor="middle" font-size="13" font-weight="700" fill="rgb(var(--ink))">{{ points[hover].value }}%</text>
    </g>
  </svg>
</template>
