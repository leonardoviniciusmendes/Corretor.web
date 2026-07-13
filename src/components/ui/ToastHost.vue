<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const toast = useToast()
const toastItems = toast.toasts
</script>

<template>
  <TransitionGroup name="toast" tag="div">
    <button
      v-for="item in toastItems"
      :key="item.id"
      class="toast"
      :class="item.kind"
      type="button"
      @click="toast.dismiss(item.id)"
    >
      {{ item.message }}
    </button>
  </TransitionGroup>
</template>
