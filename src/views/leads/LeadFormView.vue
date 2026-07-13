<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import ListState from '@/components/ui/ListState.vue'
import { useApiAction } from '@/composables/useApiAction'
import { getErrorMessage } from '@/services/apiClient'
import { faixasEtariasService } from '@/services/faixasEtariasService'
import { leadsService } from '@/services/leadsService'
import type { FaixaEtariaResponse } from '@/types/faixasEtarias'
import type { LeadRequest } from '@/types/leads'

const props = defineProps<{ id?: string }>()

const router = useRouter()
const isEdit = computed(() => Boolean(props.id))
const loading = ref(false)
const error = ref<string | null>(null)
const action = useApiAction()
const faixasEtarias = ref<FaixaEtariaResponse[]>([])
const idades = ref<string[]>([])
const idadeOptions = Array.from({ length: 81 }, (_, index) => String(index))
const form = reactive<LeadRequest>({
  nome: '',
  telefone: '',
  quantidadeVidas: 0,
  operadora: '',
  email: '',
})

const totalIdadesSelecionadas = computed(() => idades.value.filter(Boolean).length)

function adjustIdadesLength(total: number) {
  const normalizedTotal = Math.max(0, Number(total || 0))
  idades.value = Array.from({ length: normalizedTotal }, (_, index) => idades.value[index] ?? '')
}

function expandFaixas(faixas: FaixaEtariaResponse[]) {
  const expanded = faixas.flatMap((faixa) =>
    Array.from({ length: Math.max(0, faixa.quantidade || 0) }, () => faixa.faixa ?? ''),
  )
  idades.value = expanded.slice(0, form.quantidadeVidas)
  adjustIdadesLength(form.quantidadeVidas)
}

function buildFaixasPayload() {
  const totals = new Map<string, number>()

  for (const idade of idades.value.filter(Boolean)) {
    totals.set(idade, (totals.get(idade) ?? 0) + 1)
  }

  return Array.from(totals.entries()).map(([faixa, quantidade]) => ({ faixa, quantidade }))
}

async function syncFaixasEtarias(leadId: string) {
  await Promise.all(faixasEtarias.value.map((faixa) => faixasEtariasService.remove(faixa.id)))
  const payload = buildFaixasPayload()
  await Promise.all(payload.map((faixa) => faixasEtariasService.create(faixa, leadId)))
}

async function load() {
  if (!props.id) return
  loading.value = true
  error.value = null
  try {
    const lead = await leadsService.get!(props.id)
    form.nome = lead.nome ?? ''
    form.telefone = lead.telefone ?? ''
    form.quantidadeVidas = lead.quantidadeVidas ?? 0
    form.operadora = lead.operadora ?? ''
    form.email = lead.email ?? ''
    faixasEtarias.value = await faixasEtariasService.list(props.id)
    expandFaixas(faixasEtarias.value)
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

async function submit() {
  const payload: LeadRequest = {
    nome: form.nome || null,
    telefone: form.telefone || null,
    quantidadeVidas: Number(form.quantidadeVidas || 0),
    operadora: form.operadora || null,
    email: form.email || null,
  }

  const result = await action.run(async () => {
    if (props.id) {
      await leadsService.update!(props.id, payload)
      await syncFaixasEtarias(props.id)
    } else {
      const lead = await leadsService.create(payload)
      await syncFaixasEtarias(lead.id)
    }
    return true
  }, isEdit.value ? 'Lead atualizado.' : 'Lead criado.')

  if (result) await router.push('/leads')
}

watch(
  () => form.quantidadeVidas,
  (value) => adjustIdadesLength(Number(value || 0)),
)

onMounted(load)
</script>

<template>
  <section class="page-intro">
    <div>
      <span class="section-label">Lead</span>
      <h2>{{ isEdit ? 'Editar' : 'Novo' }} lead</h2>
      <p>Cadastro basico do lead.</p>
    </div>
    <RouterLink class="button secondary" to="/leads">Voltar</RouterLink>
  </section>

  <section class="panel">
    <ListState :loading="loading" :error="error" @retry="load" />
    <form v-if="!loading && !error" @submit.prevent="submit">
      <p v-if="action.error.value" class="form-error">{{ action.error.value }}</p>
      <div class="form-grid">
        <label class="field">Nome<input v-model="form.nome" required /></label>
        <label class="field">Telefone<input v-model="form.telefone" /></label>
        <label class="field">Quantidade de vidas<input v-model.number="form.quantidadeVidas" type="number" min="0" required /></label>
        <label class="field">Operadora<input v-model="form.operadora" /></label>
        <label class="field full">Email<input v-model="form.email" type="email" /></label>
      </div>

      <div v-if="form.quantidadeVidas > 0" class="simulation-plans" style="margin-top: 20px;">
        <div class="panel-header">
          <div>
            <span class="section-label">Idades</span>
            <h3>{{ totalIdadesSelecionadas }} de {{ form.quantidadeVidas }} vidas</h3>
          </div>
          <small>POST /api/leads/{leadId}/faixas-etarias</small>
        </div>

        <div class="form-grid">
          <label v-for="(_, index) in idades" :key="index" class="field">
            Vida {{ index + 1 }}
            <select v-model="idades[index]" required>
              <option value="">Selecione a idade</option>
              <option v-for="idade in idadeOptions" :key="idade" :value="idade">{{ idade }} anos</option>
            </select>
          </label>
        </div>
      </div>

      <div class="form-actions">
        <RouterLink class="button secondary" to="/leads">Cancelar</RouterLink>
        <button class="button" type="submit" :disabled="action.loading.value">Salvar</button>
      </div>
    </form>
  </section>
</template>
