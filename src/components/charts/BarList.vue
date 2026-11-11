<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ rows: { key: string; label: string; count: number }[]; color?: string; unit?: string }>(), {
  color: 'rgb(var(--brand))',
  unit: '',
})
const max = computed(() => Math.max(1, ...props.rows.map((r) => r.count)))
</script>

<template>
  <ul class="space-y-2.5">
    <li v-for="r in rows" :key="r.key" class="grid grid-cols-[minmax(0,9.5rem)_1fr_2.5rem] items-center gap-3 text-[13px]">
      <span class="truncate" :title="r.label">{{ r.label }}</span>
      <span class="h-2.5 overflow-hidden rounded-full bg-sunken">
        <span class="block h-full rounded-full" :style="{ width: `${(r.count / max) * 100}%`, background: color }" />
      </span>
      <span class="text-right font-bold tabular-nums">{{ r.count }}{{ unit }}</span>
    </li>
    <li v-if="!rows.length" class="text-xs text-mute">No data.</li>
  </ul>
</template>
