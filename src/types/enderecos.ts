export interface EnderecoRequest {
  logradouro?: string | null
  estado?: string | null
  cidade?: string | null
  cep?: string | null
}

export interface EnderecoResponse extends EnderecoRequest {
  id: string
  clienteId: string
}
