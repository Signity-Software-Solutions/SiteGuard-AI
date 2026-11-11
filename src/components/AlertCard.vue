<script setup lang="ts">
import { Check, CheckCheck } from 'lucide-vue-next'
import type { SafetyAlert } from '@/types'
import { useSiteStore } from '@/stores/site'
import { ago } from '@/utils/ui'
import Badge from './Badge.vue'

defineProps<{ alert: SafetyAlert; actions?: boolean }>()
const emit = defineEmits<{
  (e: 'open', a: SafetyAlert): void
  (e: 'ack', id: string): void
  (e: 'resolve', id: string): void
}>()
const site = useSiteStore()

const bar: Record<string, string> = { CRITICAL: 'bg-critical', HIGH: 'bg-high', MEDIUM: 'bg-medium', LOW: 'bg-low' }
</script>

<template>
  <div
    class="relative flex cursor-pointer gap-3 overflow-hidden rounded-md border border-line bg-raised py-2.5 pl-4 pr-3 transition hover:bg-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
    role="button"
    tabindex="0"
    @click="emit('open', alert)"
    @keydown.enter="emit('open', alert)"
  >
    <span class="absolute inset-y-0 left-0 w-[3px]" :class="bar[alert.severity]" />
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <Badge :severity="alert.severity" />
        <span class="text-[12px] font-semibold">{{ alert.workerLabel }}</span>
        <Badge v-if="alert.status !== 'ACTIVE'" :status="alert.status" />
        <span class="ml-auto text-[11px] text-mute">{{ ago(alert.detectedAt, site.demoNow) }}</span>
      </div>
      <p class="mt-1 text-[13px] leading-snug">{{ alert.message }}</p>
      <p class="mt-0.5 text-[11px] text-mute">{{ alert.cameraName }} · {{ alert.zoneName }} · {{ alert.id }}</p>
    </div>
    <div v-if="actions && alert.status !== 'RESOLVED'" class="flex shrink-0 flex-col justify-center gap-1.5" @click.stop>
      <button v-if="alert.status === 'ACTIVE'" class="btn btn-sm" @click="emit('ack', alert.id)"><Check class="h-3.5 w-3.5" />Acknowledge</button>
      <button class="btn btn-sm" @click="emit('resolve', alert.id)"><CheckCheck class="h-3.5 w-3.5" />Resolve</button>
    </div>
  </div>
</template>
