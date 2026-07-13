<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import ToastHost from '@/components/ui/ToastHost.vue'

const menuOpen = ref(false)
const route = useRoute()

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'D' },
  { to: '/leads', label: 'Leads/Clientes', icon: 'L' },
  { to: '/scripts', label: 'Scripts', icon: 'S' },
]
</script>

<template>
  <div class="app-shell">
    <ToastHost />
    <aside class="sidebar" :class="{ open: menuOpen }">
      <div class="brand">
        <span class="brand-mark">C</span>
        <div><strong>Corretor<span>IA</span></strong><small>Nova API</small></div>
      </div>
      <nav>
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="{ active: route.path === item.to || (item.to !== '/' && route.path.startsWith(item.to)) }"
          @click="menuOpen = false"
        >
          <span class="nav-icon">{{ item.icon }}</span>{{ item.label }}
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <span class="status-dot"></span>
        <div><strong>Ambiente local</strong><small>{{ String($route.meta.apiUrl ?? 'https://localhost:58507') }}</small></div>
      </div>
    </aside>
    <button v-if="menuOpen" class="backdrop" aria-label="Fechar menu" @click="menuOpen = false"></button>

    <div class="main-area">
      <header class="topbar">
        <button class="menu-button" aria-label="Abrir menu" type="button" @click="menuOpen = true">=</button>
        <div>
          <span class="eyebrow">Operacao</span>
          <h1>{{ route.meta.title }}</h1>
        </div>
        <div class="topbar-badge"><span class="status-dot"></span> API local</div>
      </header>
      <main>
        <RouterView v-slot="{ Component, route: currentRoute }">
          <component :is="Component" :key="currentRoute.fullPath" />
        </RouterView>
      </main>
    </div>
  </div>
</template>
