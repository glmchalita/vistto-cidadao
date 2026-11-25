"use client";

import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Cartao, chamar, Erro, Titulo } from "@/components/ui";
import { ROTULO_SINAL, ROTULO_TIPO } from "@/lib/tipos";

type Painel = {
  total: number;
  demo: number;
  reais: number;
  porRisco: Record<string, number>;
  porSinal: { sinal: string; n: number }[];
  porTipo: { tipo: string; total: number; vermelho: number }[];
  porBairro: { bairro: string; total: number; alertas: number }[];
  porMes: { mes: string; total: number; vermelho: number; amarelo: number; verde: number }[];
};

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesCurto = (m: string) => `${MESES[Number(m.slice(5)) - 1]}/${m.slice(2, 4)}`;
const int = (n: number) => n.toLocaleString("pt-BR");

function Numero({ rotulo, valor, nota }: { rotulo: string; valor: string; nota?: string }) {
  return (
    <div className="rounded-2xl border border-borda bg-cartao p-5">
      <p className="text-sm text-suave">{rotulo}</p>
      <p className="text-4xl font-bold tabular-nums">{valor}</p>
      {nota && <p className="mt-1 text-sm text-suave">{nota}</p>}
    </div>
  );
}

/** Barras horizontais de uma unica serie: uma cor, valor escrito ao lado de cada barra. */
function Barras({ titulo, legenda, linhas, unidade }: { titulo: string; legenda: string; linhas: { rotulo: string; n: number; nota?: string }[]; unidade: string }) {
  const maximo = Math.max(1, ...linhas.map((l) => l.n));
  return (
    <Cartao>
      <h2 className="text-xl font-bold">{titulo}</h2>
      <p className="mb-4 text-sm text-suave">{legenda}</p>
      <table className="w-full border-separate border-spacing-y-1.5">
        <caption className="sr-only">{titulo}</caption>
        <thead className="sr-only">
          <tr>
            <th>Item</th>
            <th>{unidade}</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.rotulo} title={`${l.rotulo}: ${int(l.n)} ${unidade}${l.nota ? ` (${l.nota})` : ""}`}>
              <th scope="row" className="w-2/5 pr-3 text-left align-middle text-sm font-normal leading-tight sm:text-base">
                {l.rotulo}
              </th>
              <td className="align-middle">
                <div className="flex items-center gap-2">
                  <div className="h-5 rounded-r bg-marca" style={{ width: `${Math.max(1, (l.n / maximo) * 82)}%` }} />
                  <span className="text-sm font-semibold tabular-nums">{int(l.n)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Cartao>
  );
}

const RISCOS = [
  { id: "vermelho" as const, rotulo: "Risco alto", cor: "bg-vermelho", Icone: OctagonAlert },
  { id: "amarelo" as const, rotulo: "Atenção", cor: "bg-amarelo", Icone: AlertTriangle },
  { id: "verde" as const, rotulo: "Parece seguro", cor: "bg-verde", Icone: CheckCircle2 },
];

/** Colunas empilhadas por resultado, com legenda (icone + texto) e tabela alternativa. */
function PorMes({ meses }: { meses: Painel["porMes"] }) {
  const [tabela, setTabela] = useState(false);
  const [foco, setFoco] = useState<number | null>(null);
  const maximo = Math.max(1, ...meses.map((m) => m.total));
  return (
    <Cartao>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Análises por mês</h2>
          <p className="text-sm text-suave">Quantidade de análises em cada mês, divididas pelo resultado.</p>
        </div>
        <button type="button" onClick={() => setTabela(!tabela)} aria-pressed={tabela} className="min-h-10 rounded-lg border border-borda px-3 text-sm font-semibold hover:border-marca">
          {tabela ? "Ver gráfico" : "Ver tabela"}
        </button>
      </div>
      <ul className="my-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {RISCOS.map(({ id, rotulo, cor, Icone }) => (
          <li key={id} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-sm ${cor}`} aria-hidden />
            <Icone size={15} aria-hidden />
            {rotulo}
          </li>
        ))}
      </ul>

      {tabela ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left tabular-nums">
            <thead>
              <tr className="border-b border-borda text-sm text-suave">
                <th className="py-2 font-semibold">Mês</th>
                {RISCOS.map((r) => (
                  <th key={r.id} className="py-2 text-right font-semibold">{r.rotulo}</th>
                ))}
                <th className="py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {meses.map((m) => (
                <tr key={m.mes} className="border-b border-grade">
                  <td className="py-1.5">{mesCurto(m.mes)}</td>
                  {RISCOS.map((r) => (
                    <td key={r.id} className="py-1.5 text-right">{int(m[r.id])}</td>
                  ))}
                  <td className="py-1.5 text-right font-semibold">{int(m.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <div className="flex h-56 items-end gap-2 border-b border-suave/50 sm:gap-4" role="img" aria-label="Gráfico de colunas das análises por mês. Use o botão Ver tabela para os números.">
            {meses.map((m, i) => (
              <div
                key={m.mes}
                className="flex h-full flex-1 cursor-default flex-col items-center justify-end"
                onMouseEnter={() => setFoco(i)}
                onMouseLeave={() => setFoco(null)}
              >
                <span className="mb-1 text-sm font-semibold tabular-nums">{int(m.total)}</span>
                <div className="flex w-full max-w-14 flex-col gap-0.5" style={{ height: `${(m.total / maximo) * 85}%` }}>
                  {RISCOS.map((r, j) =>
                    m[r.id] > 0 ? (
                      <div key={r.id} className={`${r.cor} ${j === 0 ? "rounded-t" : ""} ${foco !== null && foco !== i ? "opacity-50" : ""}`} style={{ flexGrow: m[r.id] }} />
                    ) : null,
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-2 sm:gap-4">
            {meses.map((m) => (
              <span key={m.mes} className="flex-1 text-center text-xs text-suave sm:text-sm">{mesCurto(m.mes)}</span>
            ))}
          </div>
          {foco !== null && (
            <div className="pointer-events-none absolute left-2 top-0 rounded-xl border border-borda bg-cartao p-3 text-sm shadow-lg">
              <p className="mb-1 font-bold">{mesCurto(meses[foco].mes)} · {int(meses[foco].total)} análises</p>
              {RISCOS.map((r) => (
                <p key={r.id} className="flex items-center gap-2">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${r.cor}`} aria-hidden />
                  {r.rotulo}: <strong className="tabular-nums">{int(meses[foco][r.id])}</strong>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </Cartao>
  );
}

export default function PaginaPainel() {
  const [p, setP] = useState<Painel | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    chamar<Painel>("/api/painel").then(setP).catch((e) => setErro(e.message));
  }, []);

  if (erro) return <Erro>{erro}</Erro>;
  if (!p) return <p role="status">Carregando…</p>;

  const alertas = (p.porRisco.vermelho ?? 0) + (p.porRisco.amarelo ?? 0);

  return (
    <>
      <Titulo sub="Visão agregada e anônima de todas as análises feitas no Vistto Cidadão. Nenhum dado pessoal aparece aqui, só totais.">
        Painel de golpes e abusos
      </Titulo>

      <p className="mb-5 rounded-xl border-2 border-amarelo bg-amarelo-fundo p-4">
        <strong>Dados de demonstração:</strong> {int(p.demo)} das {int(p.total)} análises deste painel são registros simulados,
        criados para mostrar como o painel funciona. As outras {int(p.reais)} são análises reais feitas no aplicativo.
      </p>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Numero rotulo="Análises feitas" valor={int(p.total)} />
        <Numero rotulo="Terminaram com alerta" valor={`${Math.round((alertas / Math.max(1, p.total)) * 100)}%`} nota={`${int(alertas)} com atenção ou risco alto`} />
        <Numero rotulo="Risco alto" valor={int(p.porRisco.vermelho ?? 0)} nota="Casos em que a pessoa não devia pagar ou assinar" />
      </div>

      <div className="space-y-5">
        <PorMes meses={p.porMes.slice(-7)} />
        <div className="grid gap-5 lg:grid-cols-2">
          <Barras
            titulo="Sinais mais encontrados"
            legenda="Número de análises em que cada sinal apareceu."
            unidade="análises"
            linhas={p.porSinal.slice(0, 8).map((s) => ({ rotulo: ROTULO_SINAL[s.sinal] ?? s.sinal, n: s.n }))}
          />
          <Barras
            titulo="Bairros com mais alertas"
            legenda="Análises com atenção ou risco alto, por bairro informado."
            unidade="alertas"
            linhas={p.porBairro.slice(0, 8).map((b) => ({ rotulo: b.bairro, n: b.alertas, nota: `${b.total} análises no total` }))}
          />
        </div>
        <Barras
          titulo="O que as pessoas mais conferem"
          legenda="Número de análises por tipo."
          unidade="análises"
          linhas={p.porTipo.map((t) => ({ rotulo: ROTULO_TIPO[t.tipo] ?? t.tipo, n: t.total, nota: `${t.vermelho} com risco alto` }))}
        />
      </div>
    </>
  );
}
