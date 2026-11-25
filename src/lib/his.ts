import type { Risco } from "./tipos";

// Habitacao de Interesse Social (HIS) e de Mercado Popular (HMP) no municipio de Sao Paulo.
//
// Fontes:
// - Faixas de renda de 2026: Decreto municipal 64.895, de 05/01/2026, art. 1o
//   (salario minimo de R$ 1.621,00).
// - Teto de aluguel: Decreto 63.130/2024, art. 7o-A (redacao do Decreto 64.244, de
//   28/05/2025): "as locacoes deverao respeitar o limite maximo de 30% (trinta por
//   cento) da renda prevista no artigo 46" do Plano Diretor (Lei 16.050/2014), ou
//   seja, 30% da renda familiar MAXIMA da faixa, e nao da renda de quem aluga.
// - A prefeitura nao publica o teto em reais; os valores abaixo sao o calculo de 30%.
// - A norma nao diz se condominio e IPTU entram no limite; o app compara so o aluguel.

export const HIS_REFERENCIA = {
  ano: 2026,
  salarioMinimo: 1621,
  decretoRenda: "Decreto municipal 64.895, de 5 de janeiro de 2026",
  decretoAluguel: "Decreto municipal 63.130/2024, art. 7º-A (redação do Decreto 64.244/2025)",
  percentual: 0.3,
  prazoAnos: 10,
};

export const FAIXAS_HIS = [
  { id: "HIS-1", nome: "HIS 1", rendaFamiliar: 4863.0, rendaPerCapita: 810.5, salarios: 3 },
  { id: "HIS-2", nome: "HIS 2", rendaFamiliar: 9726.0, rendaPerCapita: 1621.0, salarios: 6 },
  { id: "HMP", nome: "HMP", rendaFamiliar: 16210.0, rendaPerCapita: 2431.5, salarios: 10 },
] as const;

export type FaixaId = (typeof FAIXAS_HIS)[number]["id"];
export const IDS_FAIXA = ["HIS-1", "HIS-2", "HMP"] as const;

export function faixa(id: FaixaId) {
  return FAIXAS_HIS.find((f) => f.id === id)!;
}

export function tetoAluguel(id: FaixaId) {
  return Math.round(faixa(id).rendaFamiliar * HIS_REFERENCIA.percentual * 100) / 100;
}

/** Faixa mais restrita em que a familia se enquadra (por renda familiar OU per capita), ou null. */
export function enquadrarFamilia(rendaFamiliar: number, pessoas: number): FaixaId | null {
  const perCapita = rendaFamiliar / Math.max(1, pessoas);
  for (const f of FAIXAS_HIS) {
    if (rendaFamiliar <= f.rendaFamiliar || perCapita <= f.rendaPerCapita) return f.id;
  }
  return null;
}

const ORDEM: Record<FaixaId, number> = { "HIS-1": 0, "HIS-2": 1, HMP: 2 };

export function conferirHis(id: FaixaId, aluguel?: number, rendaFamiliar?: number, pessoas?: number) {
  const f = faixa(id);
  const teto = tetoAluguel(id);
  const excesso = aluguel && aluguel > 0 ? aluguel - teto : null;
  const acimaDoTeto = excesso !== null && excesso > 0.005;

  let faixaDaFamilia: FaixaId | null = null;
  let familiaSeEnquadra: boolean | null = null;
  if (rendaFamiliar && rendaFamiliar > 0) {
    faixaDaFamilia = enquadrarFamilia(rendaFamiliar, pessoas ?? 1);
    // A familia pode ocupar a unidade se estiver na faixa do imovel ou em faixa de renda menor.
    familiaSeEnquadra = faixaDaFamilia !== null && ORDEM[faixaDaFamilia] <= ORDEM[id];
  }

  const sinais: string[] = [];
  if (acimaDoTeto) sinais.push("aluguel_acima_teto_his");
  if (familiaSeEnquadra === false) sinais.push("renda_fora_da_faixa_his");

  let risco: Risco = "verde";
  if (familiaSeEnquadra === false) risco = "amarelo";
  if (acimaDoTeto) risco = "vermelho";

  return {
    faixa: id,
    nomeFaixa: f.nome,
    rendaMaximaFaixa: f.rendaFamiliar,
    rendaPerCapitaFaixa: f.rendaPerCapita,
    teto,
    aluguel: aluguel && aluguel > 0 ? aluguel : null,
    excesso: acimaDoTeto ? excesso : null,
    excessoAnual: acimaDoTeto && excesso ? excesso * 12 : null,
    acimaDoTeto,
    faixaDaFamilia,
    familiaSeEnquadra,
    sinais,
    risco,
    referencia: HIS_REFERENCIA,
  };
}
export type ConferenciaHis = ReturnType<typeof conferirHis>;

/** Interpreta "R$ 1.500,00", "1500" ou "1.500" como numero; null se nao der. */
export function valorEmReais(texto: string | null | undefined): number | null {
  if (!texto) return null;
  const m = texto.match(/\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?/);
  if (!m) return null;
  const n = Number(m[0].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}
