import { createRouter, createWebHistory, type RouteLocationNormalizedLoaded } from 'vue-router'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import LeadsListView from '@/views/leads/LeadsListView.vue'
import LeadFormView from '@/views/leads/LeadFormView.vue'
import LeadDetailView from '@/views/leads/LeadDetailView.vue'
import DocumentacaoEnvioView from '@/views/documentos/DocumentacaoEnvioView.vue'
import ContratosListView from '@/views/contratos/ContratosListView.vue'
import ContratoFormView from '@/views/contratos/ContratoFormView.vue'
import ContratoDetailView from '@/views/contratos/ContratoDetailView.vue'
import ScriptsListView from '@/views/scripts/ScriptsListView.vue'
import ScriptFormView from '@/views/scripts/ScriptFormView.vue'
import ScriptDetailView from '@/views/scripts/ScriptDetailView.vue'
import AnalisePlanosPage from '@/views/analise-planos/AnalisePlanosPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView, meta: { title: 'Dashboard' } },
    { path: '/leads', name: 'leads-list', component: LeadsListView, meta: { title: 'Leads/Clientes' } },
    { path: '/leads/novo', name: 'leads-new', component: LeadFormView, meta: { title: 'Novo lead/cliente' } },
    { path: '/leads/:id', name: 'leads-detail', component: LeadDetailView, props: (route: RouteLocationNormalizedLoaded) => ({ id: String(route.params.id) }), meta: { title: 'Detalhe do lead/cliente' } },
    { path: '/leads/:id/editar', name: 'leads-edit', component: LeadFormView, props: (route: RouteLocationNormalizedLoaded) => ({ id: String(route.params.id) }), meta: { title: 'Editar lead/cliente' } },
    { path: '/leads/:id/analise-planos', name: 'leads-analise-planos', component: AnalisePlanosPage, props: (route: RouteLocationNormalizedLoaded) => ({ leadId: String(route.params.id) }), meta: { title: 'Analise de Planos' } },
    { path: '/leads/:id/documentos', name: 'leads-documentos', component: DocumentacaoEnvioView, props: (route: RouteLocationNormalizedLoaded) => ({ leadId: String(route.params.id) }), meta: { title: 'Documentos do lead' } },
    { path: '/leads/:id/contratos', name: 'leads-contratos', component: ContratosListView, props: (route: RouteLocationNormalizedLoaded) => ({ leadId: String(route.params.id) }), meta: { title: 'Contratos do lead' } },
    { path: '/leads/:id/contratos/novo', name: 'leads-contratos-new', component: ContratoFormView, props: (route: RouteLocationNormalizedLoaded) => ({ leadId: String(route.params.id) }), meta: { title: 'Novo contrato' } },
    { path: '/contratos/:id', name: 'contratos-detail', component: ContratoDetailView, props: (route: RouteLocationNormalizedLoaded) => ({ id: String(route.params.id) }), meta: { title: 'Detalhe do contrato' } },
    { path: '/scripts', name: 'scripts-list', component: ScriptsListView, meta: { title: 'Scripts' } },
    { path: '/scripts/novo', name: 'scripts-new', component: ScriptFormView, meta: { title: 'Novo script' } },
    { path: '/scripts/:id', name: 'scripts-detail', component: ScriptDetailView, props: (route: RouteLocationNormalizedLoaded) => ({ id: String(route.params.id) }), meta: { title: 'Detalhe do script' } },
    { path: '/scripts/:id/editar', name: 'scripts-edit', component: ScriptFormView, props: (route: RouteLocationNormalizedLoaded) => ({ id: String(route.params.id) }), meta: { title: 'Editar script' } },
    { path: '/analise-planos', redirect: '/leads' },
  ],
})

router.beforeEach((to) => {
  to.meta.apiUrl = import.meta.env.VITE_API_URL
})

export default router
