<script setup lang="ts">
import { computed, ref } from 'vue'
import { BellRing } from 'lucide-vue-next'
import type { AlertStatus } from '@/types'
import { useSiteStore } from '@/stores/site'
import AlertCard from '@/components/AlertCard.vue'
import ViolationDrawer from '@/components/ViolationDrawer.vue'

const site = useSiteStore()
const tab = ref<AlertStatus | 'ALL'>('ACTIVE')
const openId = ref<string | null>(null)

const live = computed(() => site.alerts.filter((a) => a.source === 'live'))
const counts = computed(() => ({
  ACTIVE: live.value.filter((a) => a.status === 'ACTIVE').length,
  ACKNOWLEDGED: live.value.filter((a) => a.status === 'ACKNOWLEDGED').length,
  RESOLVED: live.value.filter((a) => a.status === 'RESOLVED').length,
  ALL: live.value.length,
}))
const rank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const
const shown = computed(() =>
  live.value
    .filter((a) => tab.value === 'ALL' || a.status === tab.value)
    .sort((a, b) => rank[a.severity] - rank[b.severity] || b.detectedAt - a.detectedAt),
)
const tabs: { key: AlertStatus | 'ALL'; label: string }[] = [
  { key: 'ACTIVE', label: 'Active' },
  { key: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'ALL', label: 'All' },
]
function ackAll() {
  live.value.filter((a) => a.status === 'ACTIVE').forEach((a) => site.acknowledge(a.id))
}
</script>

<template>
  <div class="mx-auto max-w-[900px] space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold">Live alerts</h1>
        <p class="text-[13px] text-sub">Raised when a violation persists for several frames. Alerts resolve automatically once the worker is compliant.</p>
      </div>
      <button class="btn" :disabled="!counts.ACTIVE" @click="ackAll">Acknowledge all</button>
    </div>

    <div class="flex flex-wrap gap-1.5" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.key"
        role="tab"
        :aria-selected="tab === t.key"
        class="rounded-full border px-3 py-1 text-[13px] font-semibold transition"
        :class="tab === t.key ? 'border-brand bg-brand/15 text-brand' : 'border-line text-sub hover:bg-sunken'"
        @click="tab = t.key"
      >
        {{ t.label }} <span class="ml-1 tabular-nums opacity-70">{{ counts[t.key] }}</span>
      </button>
    </div>

    <TransitionGroup tag="div" name="list" class="space-y-2">
      <AlertCard v-for="a in shown" :key="a.id" :alert="a" actions @open="openId = $event.id" @ack="site.acknowledge" @resolve="site.resolve" />
    </TransitionGroup>
    <div v-if="!shown.length" class="card card-pad grid place-items-center gap-2 py-12 text-center text-sm text-mute">
      <BellRing class="h-6 w-6" />
      No alerts in this view.
    </div>

    <ViolationDrawer v-if="openId" :alert-id="openId" @close="openId = null" />
  </div>
</template>

<style scoped>
.list-enter-active { transition: all 0.3s ease; }
.list-enter-from { opacity: 0; transform: translateY(-8px); }
</style>
