import reserva from "@/data/indices_reserva.json";

// Indices de reajuste vindos da API publica do Banco Central (SGS).
// Serie 189 = IGP-M (FGV), variacao % mensal. Serie 433 = IPCA (IBGE), variacao % mensal.
// Se a API falhar, usa a tabela local em src/data/indices_reserva.json.

export const SERIES = { "IGP-M": 189, IPCA: 433 } as const;
export type Indice = keyof typeof SERIES;

export type PontoIndice = { mes: string; valor: number }; // mes = AAAA-MM

type Reserva = { coletado_em: string; series: Record<string, PontoIndice[]> };

function ddmmaaaa(d: Date) {
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

export async function buscarSerie(indice: Indice): Promise<{ pontos: PontoIndice[]; fonte: "bcb" | "reserva"; coletadoEm?: string }> {
  const fim = new Date();
  const inicio = new Date(Date.UTC(fim.getUTCFullYear() - 4, fim.getUTCMonth(), 1));
  const url =
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${SERIES[indice]}/dados` +
    `?formato=json&dataInicial=${ddmmaaaa(inicio)}&dataFinal=${ddmmaaaa(fim)}`;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 21600 } });
    if (!resp.ok) throw new Error(`BCB respondeu ${resp.status}`);
    const bruto = (await resp.json()) as { data: string; valor: string }[];
    if (!Array.isArray(bruto) || bruto.length < 12) throw new Error("Série curta demais");
    const pontos = bruto.map((p) => {
      const [, mm, aaaa] = p.data.split("/");
      return { mes: `${aaaa}-${mm}`, valor: Number(p.valor) };
    });
    return { pontos, fonte: "bcb" };
  } catch (e) {
    console.warn("API do Banco Central indisponível, usando tabela local:", e);
    const r = reserva as Reserva;
    return { pontos: r.series[indice] ?? [], fonte: "reserva", coletadoEm: r.coletado_em };
  }
}

/**
 * Variacao acumulada dos 12 meses anteriores ao mes do reajuste.
 * Ex.: reajuste em 2026-11 usa os indices de 2025-11 a 2026-10.
 */
export function acumulado12Meses(pontos: PontoIndice[], mesReajuste: string) {
  const [a, m] = mesReajuste.split("-").map(Number);
  const meses: string[] = [];
  for (let i = 12; i >= 1; i--) {
    const d = new Date(Date.UTC(a, m - 1 - i, 1));
    meses.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const mapa = new Map(pontos.map((p) => [p.mes, p.valor]));
  const usados = meses.map((mes) => ({ mes, valor: mapa.get(mes) }));
  const faltando = usados.filter((u) => u.valor === undefined).map((u) => u.mes);
  if (faltando.length > 0) return { ok: false as const, faltando };
  const fator = usados.reduce((f, u) => f * (1 + (u.valor as number) / 100), 1);
  return {
    ok: true as const,
    percentual: (fator - 1) * 100,
    meses: usados as PontoIndice[],
  };
}
