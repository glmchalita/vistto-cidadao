export type Risco = "verde" | "amarelo" | "vermelho";

export const TIPOS_GOLPE = ["anuncio", "boleto", "documento", "conversa"] as const;
export type TipoGolpe = (typeof TIPOS_GOLPE)[number];

export const ROTULO_TIPO: Record<string, string> = {
  anuncio: "Anúncio",
  boleto: "Boleto ou PIX",
  documento: "Documento do imóvel",
  conversa: "Conversa",
  contrato: "Contrato",
  preco: "Preço do aluguel",
  reajuste: "Reajuste",
};

export const SINAIS = [
  "pagamento_antecipado",
  "urgencia_pressao",
  "preco_abaixo_mercado",
  "foto_suspeita",
  "beneficiario_divergente",
  "documento_inconsistente",
  "boleto_invalido",
  "contato_fora_plataforma",
  "recusa_visita",
  "dados_pessoais_excessivos",
  "clausula_abusiva",
  "preco_acima_mercado",
  "reajuste_acima_indice",
  "renda_comprometida",
  "outro",
] as const;
export type Sinal = (typeof SINAIS)[number];

export const ROTULO_SINAL: Record<string, string> = {
  pagamento_antecipado: "Pedido de pagamento antes da visita",
  urgencia_pressao: "Pressa e pressão para fechar",
  preco_abaixo_mercado: "Preço muito abaixo do mercado",
  foto_suspeita: "Foto suspeita ou copiada",
  beneficiario_divergente: "Dinheiro vai para outra pessoa",
  documento_inconsistente: "Documento com inconsistências",
  boleto_invalido: "Boleto com código inválido",
  contato_fora_plataforma: "Conversa levada para fora do site",
  recusa_visita: "Recusa de visita ao imóvel",
  dados_pessoais_excessivos: "Pedido exagerado de dados pessoais",
  clausula_abusiva: "Cláusula abusiva no contrato",
  preco_acima_mercado: "Preço acima da média do bairro",
  reajuste_acima_indice: "Reajuste acima do índice",
  renda_comprometida: "Aluguel pesa demais na renda",
  outro: "Outro sinal",
};

export const ROTULO_RISCO: Record<Risco, string> = {
  verde: "Parece seguro",
  amarelo: "Atenção",
  vermelho: "Risco alto",
};

export type ArquivoEnviado = {
  media_type: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  data: string; // base64, sem prefixo
};
