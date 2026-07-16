<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useApiAction } from '@/composables/useApiAction'
import { contratosService } from '@/services/contratosService'

const route = useRoute()
const router = useRouter()
const props = defineProps<{ leadId?: string }>()
const action = useApiAction()
const leadId = computed(() => props.leadId || String(route.query.leadId ?? ''))
const backTo = computed(() => props.leadId ? `/leads/${props.leadId}/contratos` : { path: '/contratos', query: leadId.value ? { leadId: leadId.value } : {} })

async function submit() {
  const result = await action.run(async () => {
    await contratosService.create({}, leadId.value)
    return true
  }, 'Contrato criado.')
  if (result) await router.push(backTo.value)
}
</script>

<template>
  <section class="page-intro"><div><span class="section-label">Contrato</span><h2>Novo contrato</h2><p>O contrato e criado pelo endpoint POST /api/leads/{leadId}/contratos.</p></div><RouterLink class="button secondary" :to="backTo">Voltar</RouterLink></section>
  <section class="panel form-panel">
    <form @submit.prevent="submit">
      <p v-if="!leadId" class="form-error">Informe Lead ID pela lista antes de criar um contrato.</p>
      <p v-if="action.error.value" class="form-error">{{ action.error.value }}</p>
      <EmptyState title="Sem campos de formulario" message="Este endpoint cria o contrato apenas a partir do Lead ID." />
      <div class="form-actions"><RouterLink class="button secondary" :to="backTo">Cancelar</RouterLink><button class="button" type="submit" :disabled="action.loading.value || !leadId">Criar contrato</button></div>
    </form>
  </section>
</template>
