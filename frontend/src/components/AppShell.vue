<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import {
  BarChart3, Bell, Camera, ClipboardList, HardHat, LayoutDashboard, Map, Menu, Moon, Pause, Play, RefreshCw, SlidersHorizontal, Sun, X,
} from 'lucide-vue-next'
import { useSiteStore } from '@/stores/site'
import { useThemeStore } from '@/stores/theme'
import Badge from './Badge.vue'

const site = useSiteStore()
const theme = useThemeStore()
const route = useRoute()
const open = ref(false)

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cameras', label: 'Cameras', icon: Camera },
  { to: '/alerts', label: 'Live Alerts', icon: Bell, badge: true },
  { to: '/history', label: 'Violation History', icon: ClipboardList },
  { to: '/zones', label: 'Zones', icon: Map },
  { to: '/rules', label: 'PPE Rules', icon: SlidersHorizontal },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]
const activeCount = computed(() => site.alerts.filter((a) => a.source === 'live' && a.status === 'ACTIVE').length)
const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>

<template>
  <div class="flex h-full">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-line bg-surface transition-transform lg:static lg:translate-x-0"
      :class="open ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center gap-2.5 px-4 py-4">
        <span class="grid h-9 w-9 place-items-center rounded-md bg-brand text-page"><HardHat class="h-5 w-5" /></span>
        <div class="leading-tight">
          <p class="text-[15px] font-bold">SiteGuard <span class="text-brand">AI</span></p>
          <p class="text-[10px] font-medium uppercase tracking-wider text-mute">Construction safety</p>
        </div>
        <button class="btn btn-sm ml-auto lg:hidden" aria-label="Close menu" @click="open = false"><X class="h-4 w-4" /></button>
      </div>
      <nav class="flex-1 space-y-0.5 px-2" aria-label="Main">
        <RouterLink
          v-for="n in nav"
          :key="n.to"
          :to="n.to"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          :class="isActive(n.to) ? 'bg-brand/15 text-brand' : 'text-sub hover:bg-sunken hover:text-ink'"
          @click="open = false"
        >
          <component :is="n.icon" class="h-[17px] w-[17px]" aria-hidden="true" />
          {{ n.label }}
          <span v-if="n.badge && activeCount" class="ml-auto rounded-full bg-critical px-1.5 text-[10px] font-bold leading-[17px] text-page">{{ activeCount }}</span>
        </RouterLink>
      </nav>
      <div class="m-3 space-y-1 border-t border-line pt-3 text-[11px] text-mute">
        <p class="flex items-center gap-1.5"><span class="h-1.5 w-1.5 rounded-full bg-ok" />{{ site.stats.camerasOnline }} of {{ site.stats.camerasTotal }} cameras online</p>
        <p>Illustrative site footage and analytics.</p>
      </div>
    </aside>
    <div v-if="open" class="fixed inset-0 z-30 bg-black/50 lg:hidden" @click="open = false" />

    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Top bar -->
      <header class="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface/95 px-4 py-4 backdrop-blur">
        <button class="btn btn-sm lg:hidden" aria-label="Open menu" @click="open = true"><Menu class="h-4 w-4" /></button>
        <div class="ml-auto flex items-center gap-1.5">
          <button class="btn btn-sm" :aria-label="site.running ? 'Pause monitoring' : 'Resume monitoring'" @click="site.toggle()">
            <component :is="site.running ? Pause : Play" class="h-3.5 w-3.5" /><span class="hidden sm:inline">{{ site.running ? 'Pause' : 'Resume' }}</span>
          </button>
          <button class="btn btn-sm" title="Reload the monitoring session from the start" @click="site.restart()">
            <RefreshCw class="h-3.5 w-3.5" /><span class="hidden sm:inline">Refresh monitoring</span>
          </button>
          <button class="btn btn-sm" :aria-label="theme.mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'" @click="theme.toggle()">
            <component :is="theme.mode === 'dark' ? Sun : Moon" class="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-4 sm:p-6">
        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>
      </main>
    </div>

    <!-- Critical alert notifications (dashboard sink) -->
    <div class="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,340px)] flex-col gap-2">
      <div v-for="t in site.toasts" :key="t.id" class="pointer-events-auto animate-slide-in rounded-md border border-line border-l-[3px] border-l-critical bg-raised p-3 shadow-lg">
        <div class="flex items-center gap-2">
          <Badge :severity="t.alert.severity" /><span class="text-[11px] text-mute">{{ t.alert.cameraId }} · {{ t.alert.cameraName }}</span>
          <button class="ml-auto text-mute hover:text-ink" aria-label="Dismiss" @click="site.dismissToast(t.id)"><X class="h-3.5 w-3.5" /></button>
        </div>
        <p class="mt-1 text-[13px] font-medium">{{ t.alert.message }}</p>
      </div>
    </div>
  </div>
</template>
