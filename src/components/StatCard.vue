<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string | number
    sub?: string
    tone?: 'neutral' | 'ok' | 'bad' | 'warn'
    /** Primary KPIs are larger and carry a left accent. */
    primary?: boolean
  }>(),
  { tone: 'neutral', primary: false },
)

const valueTone = { neutral: 'text-ink', ok: 'text-ok', bad: 'text-critical', warn: 'text-warn' }
const accent = { neutral: 'bg-line', ok: 'bg-ok', bad: 'bg-critical', warn: 'bg-warn' }
</script>

<template>
  <div class="card relative overflow-hidden" :class="primary ? 'p-5' : 'p-4'">
    <span v-if="primary" class="absolute inset-y-0 left-0 w-1" :class="accent[tone]" />
    <p class="h-section">{{ label }}</p>
    <p class="mt-1.5 font-bold leading-none tabular-nums" :class="[valueTone[tone], primary ? 'text-4xl' : 'text-2xl']">{{ value }}</p>
    <p v-if="sub" class="mt-2 text-xs text-sub">{{ sub }}</p>
  </div>
</template>
