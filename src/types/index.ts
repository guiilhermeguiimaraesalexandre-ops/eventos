export type CampoTipo =
  | 'text' | 'textarea' | 'email' | 'cpf' | 'cnpj' | 'number' | 'date'
  | 'select' | 'radio' | 'checkbox'
  | 'informativo' | 'pix' | 'upload' | 'oab';

export interface CampoDinamico {
  label: string;
  type: CampoTipo;
  required?: boolean;
  options?: string[];
  infoText?: string;
  pixKey?: string;
  pixNome?: string;
  pixInst?: string;
}

export interface Lote {
  nome: string;
  quantidade: number;
  preco: number;
  inicio?: string;
  fim?: string;
}

export type EventStatus = 'ATIVO' | 'INATIVO' | 'FINALIZADO';
export type EventTipo = 'gratuito' | 'pago';
export type Modalidade = 'Presencial' | 'Online' | 'Híbrido';

export interface EventRow {
  id: string;
  nome: string;
  descricao: string;
  data: string | null;   // yyyy-mm-dd
  hora: string;
  local: string;
  tipo: EventTipo;
  valor: number;
  modalidade: Modalidade;
  status: EventStatus;
  imagens: string[];
  campos: CampoDinamico[];
  lotes: Lote[];
  bg_theme: string;
  bg_custom: string;
  fonte: string;
  cor: string;
  btn_txt: string;
  msg_esgotado: string;
  email_protocolo: string;
  vagas: number;
  vagas_vis: 'visivel' | 'invisivel';
  nomes_manuais: string;
  created_at: string;
  updated_at: string;
}

export interface RegistrationRow {
  id: string;
  event_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  dados: Record<string, string>;
  possui_deficiencia: string | null;
  descricao_deficiencia: string | null;
  lgpd_aceito: boolean;
  lote: string | null;
  valor_lote: number | null;
  presenca: boolean;
  presenca_em: string | null;
  sorteado: boolean;
  sorteado_em: string | null;
  protocolo: string | null;
  created_at: string;
}
