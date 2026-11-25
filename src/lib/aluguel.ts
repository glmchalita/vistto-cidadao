import dados from "@/data/aluguel_bairros.json";
import type { Risco } from "./tipos";

// Analise de Dados: referencia de preco de aluguel por bairro de Sao Paulo,
// montada a partir de fontes publicas (cada linha guarda fonte e data).

export type Bairro = { bairro: string; zona: string; preco_m2: number; fonte: string; referencia: string };

export const BAIRROS = (dados as Bairro[]).slice().sort((a, b) => a.bairro.localeCompare(b.bairro, "pt-BR"));

export function acharBairro(nome: string) {
  return BAIRROS.find((b) => b.bairro === nome) ?? null;
}

/** Faixa considerada normal em torno da media: 15% para cima ou para baixo. */
const TOLERANCIA = 0.15;
/** Limite classico de comprometimento da renda com moradia. */
export const LIMITE_RENDA = 0.3;

export function compararPreco(b: Bairro, area: number, valorPedido: number, renda?: number) {
  const referencia = b.preco_m2 * area;
  const minimo = referencia * (1 - TOLERANCIA);
  const maximo = referencia * (1 + TOLERANCIA);
  const diferenca = (valorPedido - referencia) / referencia;

  let posicao: "muito_abaixo" | "abaixo" | "na_faixa" | "acima" | "muito_acima";
  if (diferenca < -0.35) posicao = "muito_abaixo";
  else if (diferenca < -TOLERANCIA) posicao = "abaixo";
  else if (diferenca <= TOLERANCIA) posicao = "na_faixa";
  else if (diferenca <= 0.35) posicao = "acima";
  else posicao = "muito_acima";

  const comprometimento = renda && renda > 0 ? valorPedido / renda : null;
  const sinais: string[] = [];
  if (posicao === "muito_abaixo") sinais.push("preco_abaixo_mercado");
  if (posicao === "acima" || posicao === "muito_acima") sinais.push("preco_acima_mercado");
  if (comprometimento !== null && comprometimento > LIMITE_RENDA) sinais.push("renda_comprometida");

  let risco: Risco = "verde";
  if (sinais.length > 0) risco = "amarelo";
  if (posicao === "muito_abaixo" || posicao === "muito_acima" || (comprometimento !== null && comprometimento > 0.5)) {
    risco = "vermelho";
  }

  return {
    bairro: b,
    area,
    valorPedido,
    renda: renda ?? null,
    referencia,
    minimo,
    maximo,
    diferenca,
    posicao,
    comprometimento,
    aluguelMaximoPelaRenda: renda ? renda * LIMITE_RENDA : null,
    sinais,
    risco,
  };
}
export type Comparacao = ReturnType<typeof compararPreco>;
