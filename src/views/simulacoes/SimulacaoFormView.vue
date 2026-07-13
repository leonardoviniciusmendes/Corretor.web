<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ListState from '@/components/ui/ListState.vue'
import { useApiAction } from '@/composables/useApiAction'
import { getErrorMessage } from '@/services/apiClient'
import { simulacoesService } from '@/services/simulacoesService'
import type { SimulacaoRequest } from '@/types/simulacoes'

const props = defineProps<{ id?: string }>()
const route = useRoute()
const router = useRouter()
const isEdit = computed(() => Boolean(props.id))
const leadId = computed(() => String(route.query.leadId ?? ''))
const loading = ref(false)
const error = ref<string | null>(null)
const action = useApiAction()
const form = reactive<SimulacaoRequest>({ link: '', aprovada: false })

async function load() {
  if (!props.id) return
  loading.value = true
  error.value = null
  try {
    const item = await simulacoesService.get!(props.id)
    form.link = item.link ?? ''
    form.aprovada = item.aprovada ?? false
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

async function submit() {
  const payload: SimulacaoRequest = { link: form.link || null, aprovada: Boolean(form.aprovada) }
  const result = await action.run(async () => {
    if (props.id) await simulacoesService.update!(props.id, payload)
    else await simulacoesService.create(payload, leadId.value)
    return true
  }, isEdit.value ? 'Simulacao atualizada.' : 'Simulacao criada.')
  if (result) await router.push({ path: '/simulacoes', query: leadId.value ? { leadId: leadId.value } : {} })
}

onMounted(load)
</script>

<template>
  <section class="page-intro">
    <div><span class="section-label">Simulacao</span>
      <h2>{{ isEdit ? 'Editar' : 'Nova' }} simulacao</h2>
      <p>Campos enviados para POST/PUT de simulacoes.</p>
    </div>
    <RouterLink class="button secondary" :to="{ path: '/simulacoes', query: leadId ? { leadId } : {} }">Voltar
    </RouterLink>
  </section>
  <section class="panel form-panel">
    <ListState :loading="loading" :error="error" @retry="load" />
    <form v-if="!loading && !error" @submit.prevent="submit">
      <p v-if="!leadId && !isEdit" class="form-error">Informe Lead ID pela lista antes de criar uma simulacao.</p>
      <p v-if="action.error.value" class="form-error">{{ action.error.value }}</p>
      <div class="form-grid"><label class="field full">Link<input v-model="form.link" /></label><label
          class="field checkbox-field"><input v-model="form.aprovada" type="checkbox" /> Aprovada</label></div>
      <div class="form-actions">
        <RouterLink class="button secondary" :to="{ path: '/simulacoes', query: leadId ? { leadId } : {} }">Cancelar
        </RouterLink><button class="button" type="submit"
          :disabled="action.loading.value || Boolean(!leadId && !isEdit)">Salvar</button>
      </div>
    </form>
  </section>
</template>
