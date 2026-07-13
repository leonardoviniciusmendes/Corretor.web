<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ListState from '@/components/ui/ListState.vue'
import { useApiAction } from '@/composables/useApiAction'
import { getErrorMessage } from '@/services/apiClient'
import { scriptsService } from '@/services/scriptsService'
import { scriptEtapas, type ScriptEtapa, type ScriptRequest } from '@/types/scripts'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const isEdit = computed(() => Boolean(props.id))
const loading = ref(false)
const error = ref<string | null>(null)
const action = useApiAction()
const form = reactive<{ etapa: ScriptEtapa | ''; tipo: string; mensagem: string }>({ etapa: '', tipo: '', mensagem: '' })

async function load() {
  if (!props.id) return
  loading.value = true
  error.value = null
  try {
    const script = await scriptsService.get!(props.id)
    form.etapa = script.etapa ?? ''
    form.tipo = script.tipo ?? ''
    form.mensagem = script.mensagem ?? ''
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

async function submit() {
  const payload: ScriptRequest = { etapa: form.etapa || null, tipo: form.tipo || null, mensagem: form.mensagem || null }
  const result = await action.run(async () => {
    if (props.id) await scriptsService.update!(props.id, payload)
    else await scriptsService.create(payload)
    return true
  }, isEdit.value ? 'Script atualizado.' : 'Script criado.')
  if (result) await router.push('/scripts')
}

onMounted(load)
</script>

<template>
  <section class="page-intro">
    <div><span class="section-label">Script</span><h2>{{ isEdit ? 'Editar' : 'Novo' }} script</h2><p>Campos enviados para POST/PUT /api/scripts.</p></div>
    <RouterLink class="button secondary" to="/scripts">Voltar</RouterLink>
  </section>
  <section class="panel form-panel">
    <ListState :loading="loading" :error="error" @retry="load" />
    <form v-if="!loading && !error" @submit.prevent="submit">
      <p v-if="action.error.value" class="form-error">{{ action.error.value }}</p>
      <div class="form-grid">
        <label class="field">Etapa<select v-model="form.etapa"><option value="">Selecione</option><option v-for="etapa in scriptEtapas" :key="etapa" :value="etapa">{{ etapa }}</option></select></label>
        <label class="field">Tipo<input v-model="form.tipo" /></label>
        <label class="field full">Mensagem<textarea v-model="form.mensagem"></textarea></label>
      </div>
      <div class="form-actions">
        <RouterLink class="button secondary" to="/scripts">Cancelar</RouterLink>
        <button class="button" type="submit" :disabled="action.loading.value">Salvar</button>
      </div>
    </form>
  </section>
</template>
