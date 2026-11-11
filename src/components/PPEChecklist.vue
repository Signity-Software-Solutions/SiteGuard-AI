<script setup lang="ts">
import { Check, Minus, TriangleAlert, X } from 'lucide-vue-next'
import type { CheckStatus, PPECheck } from '@/types'
import { PPE_META } from '@/domain/catalog'
import Badge from './Badge.vue'

defineProps<{ checks: PPECheck[]; showSeverity?: boolean }>()

const ui: Record<CheckStatus, { icon: unknown; cls: string; text: string }> = {
  PASS: { icon: Check, cls: 'text-ok', text: 'PASS' },
  FAIL: { icon: X, cls: 'text-critical', text: 'FAIL' },
  WARNING: { icon: TriangleAlert, cls: 'text-warn', text: 'WARNING' },
  NOT_REQUIRED: { icon: Minus, cls: 'text-mute', text: 'Not required' },
}
</script>

<template>
  <ul class="divide-y divide-line rounded-md border border-line">
    <li v-for="c in checks" :key="c.ppe" class="flex items-center gap-2.5 px-3 py-2" :class="c.status === 'NOT_REQUIRED' ? 'opacity-60' : ''">
      <component :is="ui[c.status].icon" class="h-4 w-4 shrink-0" :class="ui[c.status].cls" stroke-width="2.75" aria-hidden="true" />
      <span class="flex-1 text-[13px]" :class="c.status === 'FAIL' ? 'font-semibold' : 'font-medium'">{{ PPE_META[c.ppe].label }}</span>
      <Badge v-if="showSeverity && c.status === 'FAIL'" :severity="c.severity" />
      <span v-if="c.confidence !== null && c.status !== 'NOT_REQUIRED'" class="w-9 text-right font-mono text-[11px] text-mute" title="Detection confidence">{{ Math.round(c.confidence * 100) }}%</span>
      <span class="w-[74px] text-right text-[11px] font-semibold tracking-wide" :class="ui[c.status].cls">{{ ui[c.status].text }}</span>
    </li>
  </ul>
</template>
