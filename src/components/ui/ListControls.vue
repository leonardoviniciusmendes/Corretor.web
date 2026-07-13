<script setup lang="ts">
import { ref } from 'vue'

const model = defineModel<string>({ default: '' })
const open = ref(false)
</script>

<template>
  <section class="filter-box">
    <button class="filter-toggle" type="button" @click="open = !open">
      <span>F</span>
      <strong>Filtros</strong>
      <small>Busca local sobre os dados retornados pela API</small>
      <b :class="{ rotated: open }">v</b>
    </button>
    <div v-if="open" class="filter-content">
      <label class="field">
        Buscar
        <input v-model="model" type="search" placeholder="Nome, email, ID..." />
      </label>
      <button class="button secondary" type="button" @click="model = ''">Limpar</button>
    </div>
  </section>
</template>
