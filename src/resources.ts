import { clientesService } from '@/services/clientesService'
import { contratosService } from '@/services/contratosService'
import { dependentesService } from '@/services/dependentesService'
import { documentosService } from '@/services/documentosService'
import { enderecosService } from '@/services/enderecosService'
import { faixasEtariasService } from '@/services/faixasEtariasService'
import { historicosService } from '@/services/historicosService'
import { juridicasService } from '@/services/juridicasService'
import { leadsService } from '@/services/leadsService'
import { pessoasService } from '@/services/pessoasService'
import { posContratosService } from '@/services/posContratosService'
import { scriptsService } from '@/services/scriptsService'
import { simulacoesService } from '@/services/simulacoesService'
import type { ResourceConfig, ResourceService } from '@/types/common'

export interface AppResource {
  config: ResourceConfig<Record<string, unknown>, Record<string, unknown>>
  service: ResourceService<unknown, Record<string, unknown>>
}

export const resources = {
  leads: {
    service: leadsService,
    config: {
      key: 'leads',
      title: 'Leads/Clientes',
      singular: 'Lead',
      description: 'Cadastro operacional de leads e clientes.',
      basePath: '/leads',
      fields: [
        { key: 'nome', label: 'Nome', required: true },
        { key: 'telefone', label: 'Telefone' },
        { key: 'quantidadeVidas', label: 'Quantidade de vidas', type: 'number', required: true },
        { key: 'operadora', label: 'Operadora' },
        { key: 'email', label: 'Email', type: 'email' },
      ],
      columns: ['nome', 'telefone', 'quantidadeVidas', 'operadora', 'email'],
    },
  },
  clientes: {
    service: clientesService,
    config: {
      key: 'clientes',
      title: 'Clientes',
      singular: 'Cliente',
      description: 'Clientes criados a partir de um lead.',
      basePath: '/clientes',
      fields: [{ key: 'leadId', label: 'Lead ID', required: true }],
      columns: ['id', 'leadId'],
    },
  },
  scripts: {
    service: scriptsService,
    config: {
      key: 'scripts',
      title: 'Scripts',
      singular: 'Script',
      description: 'Mensagens e roteiros por etapa.',
      basePath: '/scripts',
      fields: [
        { key: 'etapa', label: 'Etapa' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'mensagem', label: 'Mensagem', type: 'textarea' },
      ],
      columns: ['etapa', 'tipo', 'mensagem'],
    },
  },
  contratos: {
    service: contratosService,
    config: {
      key: 'contratos',
      title: 'Contratos',
      singular: 'Contrato',
      description: 'Contratos vinculados a um lead.',
      basePath: '/contratos',
      parentParam: 'leadId',
      parentLabel: 'Lead ID',
      createLabel: 'Criar contrato',
      fields: [],
      columns: ['id', 'leadId'],
    },
  },
  documentos: {
    service: documentosService,
    config: {
      key: 'documentos',
      title: 'Documentos',
      singular: 'Documento',
      description: 'Documentos vinculados a um lead.',
      basePath: '/documentos',
      parentParam: 'leadId',
      parentLabel: 'Lead ID',
      fields: [
        { key: 'identificacao', label: 'Identificacao' },
        { key: 'endereco', label: 'Endereco' },
        { key: 'data', label: 'Data' },
        { key: 'dependentes', label: 'Dependentes', type: 'textarea' },
      ],
      columns: ['identificacao', 'endereco', 'data', 'dependentes'],
    },
  },
  'faixas-etarias': {
    service: faixasEtariasService,
    config: {
      key: 'faixas-etarias',
      title: 'Faixas etarias',
      singular: 'Faixa etaria',
      description: 'Faixas etarias por lead.',
      basePath: '/faixas-etarias',
      parentParam: 'leadId',
      parentLabel: 'Lead ID',
      fields: [
        { key: 'faixa', label: 'Faixa' },
        { key: 'quantidade', label: 'Quantidade', type: 'number', required: true },
      ],
      columns: ['faixa', 'quantidade'],
    },
  },
  historicos: {
    service: historicosService,
    config: {
      key: 'historicos',
      title: 'Historicos',
      singular: 'Historico',
      description: 'Linha de historico vinculada a um lead.',
      basePath: '/historicos',
      parentParam: 'leadId',
      parentLabel: 'Lead ID',
      fields: [
        { key: 'etapa', label: 'Etapa' },
        { key: 'data', label: 'Data' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'mensagem', label: 'Mensagem', type: 'textarea' },
      ],
      columns: ['etapa', 'data', 'tipo', 'mensagem'],
    },
  },
  simulacoes: {
    service: simulacoesService,
    config: {
      key: 'simulacoes',
      title: 'Simulacoes',
      singular: 'Simulacao',
      description: 'Simulacoes vinculadas a um lead.',
      basePath: '/simulacoes',
      parentParam: 'leadId',
      parentLabel: 'Lead ID',
      fields: [
        { key: 'link', label: 'Link' },
        { key: 'aprovada', label: 'Aprovada' },
      ],
      columns: ['leadId', 'link', 'aprovada', 'dataEnvio'],
    },
  },
  enderecos: {
    service: enderecosService,
    config: {
      key: 'enderecos',
      title: 'Enderecos',
      singular: 'Endereco',
      description: 'Enderecos vinculados a um cliente.',
      basePath: '/enderecos',
      parentParam: 'clienteId',
      parentLabel: 'Cliente ID',
      fields: [
        { key: 'logradouro', label: 'Logradouro' },
        { key: 'estado', label: 'Estado' },
        { key: 'cidade', label: 'Cidade' },
        { key: 'cep', label: 'CEP' },
      ],
      columns: ['logradouro', 'cidade', 'estado', 'cep'],
    },
  },
  juridicas: {
    service: juridicasService,
    config: {
      key: 'juridicas',
      title: 'Juridicas',
      singular: 'Juridica',
      description: 'Registros juridicos vinculados a um cliente.',
      basePath: '/juridicas',
      parentParam: 'clienteId',
      parentLabel: 'Cliente ID',
      createLabel: 'Criar juridica',
      fields: [],
      columns: ['id', 'clienteId'],
    },
  },
  pessoas: {
    service: pessoasService,
    config: {
      key: 'pessoas',
      title: 'Pessoas',
      singular: 'Pessoa',
      description: 'Pessoas vinculadas a um cliente.',
      basePath: '/pessoas',
      parentParam: 'clienteId',
      parentLabel: 'Cliente ID',
      fields: [
        { key: 'nome', label: 'Nome' },
        { key: 'cpf', label: 'CPF' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'telefone', label: 'Telefone' },
        { key: 'faixaEtaria', label: 'Faixa etaria' },
      ],
      columns: ['nome', 'cpf', 'email', 'telefone', 'faixaEtaria'],
    },
  },
  dependentes: {
    service: dependentesService,
    config: {
      key: 'dependentes',
      title: 'Dependentes',
      singular: 'Dependente',
      description: 'Dependentes vinculados a uma pessoa.',
      basePath: '/dependentes',
      parentParam: 'pessoaId',
      parentLabel: 'Pessoa ID',
      createLabel: 'Criar dependente',
      fields: [],
      columns: ['id', 'pessoaId'],
    },
  },
  'pos-contratos': {
    service: posContratosService,
    config: {
      key: 'pos-contratos',
      title: 'Pos-contratos',
      singular: 'Pos-contrato',
      description: 'Acompanhamento vinculado a um contrato.',
      basePath: '/pos-contratos',
      parentParam: 'contratoId',
      parentLabel: 'Contrato ID',
      createLabel: 'Criar pos-contrato',
      fields: [],
      columns: ['id', 'contratoId'],
    },
  },
} as unknown as Record<string, AppResource>

export type ResourceKey = keyof typeof resources

export const visibleResourceKeys = ['leads', 'scripts'] as const

export const visibleResources = Object.fromEntries(
  visibleResourceKeys.map((key) => [key, resources[key]]),
) as Pick<typeof resources, (typeof visibleResourceKeys)[number]>

export function getResource(key: string): AppResource {
  const resource = resources[key as ResourceKey]
  if (!resource) throw new Error(`Recurso nao mapeado: ${key}`)
  return resource
}
