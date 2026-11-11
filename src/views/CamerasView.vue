<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useSiteStore } from '@/stores/site'
import CameraFeed from '@/components/CameraFeed.vue'

const site = useSiteStore()
const cams = computed(() => site.snapshot?.cameras ?? [])
const count = (c: { workers: { compliance: { overallStatus: string } }[] }, s: string) =>
  c.workers.filter((w) => w.compliance.overallStatus === s).length
</script>

<template>
  <div class="mx-auto max-w-[1400px] space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="text-xl font-bold">Cameras</h1>
        <p class="text-[13px] text-sub">{{ site.stats.camerasOnline }} of {{ site.stats.camerasTotal }} cameras online · select a camera for the live AI view</p>
      </div>
    </div>
    <div v-if="!cams.length" class="rounded-lg border border-dashed border-line p-10 text-center text-sm text-mute">Connecting to cameras…</div>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <RouterLink
        v-for="c in cams"
        :key="c.camera.id"
        :to="`/cameras/${c.camera.id}`"
        class="overflow-hidden rounded-lg border border-line bg-surface transition hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        :class="c.camera.online ? '' : 'opacity-70'"
      >
        <CameraFeed :snap="c" compact :show-zones="false" />
        <div class="p-3">
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold">{{ c.camera.name }}</p>
            <span class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" :class="c.camera.online ? 'text-ok' : 'text-mute'">
              <span class="h-1.5 w-1.5 rounded-full" :class="c.camera.online ? 'bg-ok' : 'bg-mute'" />{{ c.camera.online ? 'Online' : 'Offline' }}
            </span>
          </div>
          <p class="text-xs text-mute">{{ c.camera.id }} · {{ c.camera.location }}</p>
          <p v-if="c.camera.online" class="mt-2 flex gap-4 text-xs text-sub">
            <span><b class="text-ink">{{ c.workers.length }}</b> {{ c.workers.length === 1 ? 'worker' : 'workers' }}</span>
            <span :class="count(c, 'NON_COMPLIANT') ? 'text-critical' : ''"><b>{{ count(c, 'NON_COMPLIANT') }}</b> {{ count(c, 'NON_COMPLIANT') === 1 ? 'violation' : 'violations' }}</span>
            <span v-if="count(c, 'WARNING')" class="text-warn"><b>{{ count(c, 'WARNING') }}</b> {{ count(c, 'WARNING') === 1 ? 'warning' : 'warnings' }}</span>
          </p>
          <p v-else class="mt-2 text-xs text-mute">No signal - maintenance in progress</p>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
