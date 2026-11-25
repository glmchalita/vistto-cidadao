"use client";

import type { Comparacao } from "@/lib/aluguel";
import type { ConferenciaBoleto } from "@/lib/boleto";
import type { ContratoResultado, GolpeResultado } from "@/lib/claude";
import type { Risco } from "@/lib/tipos";
import { ROTULO_RISCO, ROTULO_SINAL } from "@/lib/tipos";
import { Ouvir } from "./Acessibilidade";
import { brl, Cartao, pct, Semaforo } from "./ui";

export type ResultadoGolpe = GolpeResultado & { boleto: ConferenciaBoleto | null };

export type ResultadoReajuste = {
  indice: string;
  mesReajuste: string;
  valorAtual: number;
  percentual: number;
  percentualAplicado: number;
  valorCorreto: number;
  valorCobrado: number | null;
  excesso: number | null;
  excessoAnual: number | null;
  meses: { mes: string; valor: number }[];
  fonte: "bcb" | "reserva";
  coletadoEm: string | null;
  risco: Risco;
};

const GRAVIDADE: Record<string, string> = { baixa: "Leve", media: "Médio", alta: "Grave" };
const mesBr = (m: string) => `${m.slice(5)}/${m.slice(0, 4)}`;

function Lista({ titulo, itens, ordenada = false }: { titulo: string; itens: string[]; ordenada?: boolean }) {
  if (itens.length === 0) return null;
  const Tag = ordenada ? "ol" : "ul";
  return (
    <Cartao>
      <h2 className="mb-3 text-xl font-bold">{titulo}</h2>
      <Tag className={`space-y-2 pl-6 text-lg ${ordenada ? "list-decimal" : "list-disc"}`}>
        {itens.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </Tag>
    </Cartao>
  );
}

function Limites({ texto }: { texto: string }) {
  return (
    <p className="rounded-xl border border-borda p-4 text-suave">
      <strong className="text-texto">O que esta análise não confirma: </strong>
      {texto}
    </p>
  );
}

export function VerGolpe({ r }: { r: ResultadoGolpe }) {
  const fala = [
    `Resultado: ${ROTULO_RISCO[r.risco]}.`,
    r.resumo_simples,
    r.sinais.length ? `Sinais encontrados: ${r.sinais.map((s) => s.descricao).join(" ")}` : "",
    r.boleto && r.boleto.formato !== "desconhecido"
      ? r.boleto.valido
        ? "O código do boleto é matematicamente válido."
        : `O código do boleto tem problemas. ${r.boleto.problemas.join(" ")}`
      : "",
    r.recomendacoes.length ? `O que fazer agora: ${r.recomendacoes.join(" ")}` : "",
    r.limitacoes,
  ].join(" ");

  const d = r.dados_extraidos;
  const dados = [
    ["Quem recebe o dinheiro", d.beneficiario],
    ["Valor", d.valor],
    ["Chave PIX", d.chave_pix],
    ["Nomes no documento", d.nomes_encontrados.join(", ") || null],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <div className="space-y-4">
      <Semaforo risco={r.risco}>{r.resumo_simples}</Semaforo>
      <Ouvir texto={fala} />

      {r.sinais.length > 0 && (
        <Cartao>
          <h2 className="mb-3 text-xl font-bold">Sinais encontrados</h2>
          <ul className="space-y-3">
            {r.sinais.map((s, i) => (
              <li key={i} className="rounded-xl border border-borda p-4">
                <p className="font-semibold">
                  {ROTULO_SINAL[s.categoria] ?? s.categoria}{" "}
                  <span className="ml-1 rounded-full border border-borda px-2 py-0.5 text-sm font-normal">{GRAVIDADE[s.gravidade]}</span>
                </p>
                <p className="mt-1 text-lg">{s.descricao}</p>
              </li>
            ))}
          </ul>
        </Cartao>
      )}

      {r.boleto && (
        <Cartao>
          <h2 className="mb-1 text-xl font-bold">Conferência do código do boleto</h2>
          <p className="mb-3 text-suave">Cálculo feito pelo sistema sobre os números lidos na imagem.</p>
          {r.boleto.formato === "desconhecido" ? (
            <p className="text-lg">{r.boleto.problemas[0]} Pode ser que a foto tenha cortado parte dos números.</p>
          ) : (
            <>
              <p className={`text-lg font-semibold ${r.boleto.valido ? "text-verde-texto" : "text-vermelho-texto"}`}>
                {r.boleto.valido ? "Os dígitos verificadores conferem." : "Os dígitos verificadores NÃO conferem."}
              </p>
              {r.boleto.problemas.length > 0 && (
                <ul className="mt-2 list-disc pl-6">
                  {r.boleto.problemas.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              )}
              <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {r.boleto.banco && <Par t="Banco emissor (pelo código)" v={`${r.boleto.banco} (${r.boleto.codigoBanco})`} />}
                {r.boleto.valor && <Par t="Valor dentro do código" v={brl(r.boleto.valor)} />}
                {r.boleto.vencimento && <Par t="Vencimento dentro do código" v={r.boleto.vencimento.split("-").reverse().join("/")} />}
              </dl>
              <p className="mt-3 text-sm text-suave">
                Um código válido mostra que o boleto foi gerado corretamente, mas não prova que o dinheiro vai para o dono do imóvel.
                Confira sempre o nome de quem recebe na tela do seu banco antes de confirmar.
              </p>
            </>
          )}
        </Cartao>
      )}

      {dados.length > 0 && (
        <Cartao>
          <h2 className="mb-3 text-xl font-bold">O que foi lido no arquivo</h2>
          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {dados.map(([t, v]) => (
              <Par key={t} t={t} v={v} />
            ))}
          </dl>
          <p className="mt-3 text-suave">{r.o_que_foi_visto}</p>
        </Cartao>
      )}

      <Lista titulo="O que fazer agora" itens={r.recomendacoes} ordenada />
      <Limites texto={r.limitacoes} />
    </div>
  );
}

function Par({ t, v }: { t: string; v: string }) {
  return (
    <div className="py-1">
      <dt className="text-sm text-suave">{t}</dt>
      <dd className="text-lg font-semibold break-words">{v}</dd>
    </div>
  );
}

const AVALIACAO: Record<string, { rotulo: string; classe: string }> = {
  ok: { rotulo: "Normal", classe: "border-verde bg-verde-fundo text-verde-texto" },
  atencao: { rotulo: "Atenção", classe: "border-amarelo bg-amarelo-fundo text-amarelo-texto" },
  abusiva: { rotulo: "Abusiva", classe: "border-vermelho bg-vermelho-fundo text-vermelho-texto" },
};

export function VerContrato({ r }: { r: ContratoResultado }) {
  const ordem = { abusiva: 0, atencao: 1, ok: 2 };
  const clausulas = [...r.clausulas].sort((a, b) => ordem[a.avaliacao] - ordem[b.avaliacao]);
  const problemas = clausulas.filter((c) => c.avaliacao !== "ok");
  const fala = [
    `Resultado: ${ROTULO_RISCO[r.risco]}.`,
    r.resumo_simples,
    problemas.length
      ? `Pontos de atenção: ${problemas.map((c) => `${c.titulo}. ${c.explicacao_simples}`).join(" ")}`
      : "Não encontrei cláusulas abusivas.",
    r.recomendacoes.length ? `O que fazer agora: ${r.recomendacoes.join(" ")}` : "",
    r.limitacoes,
  ].join(" ");

  const p = r.dados_principais;
  const dados = [
    ["Valor do aluguel", p.valor_aluguel],
    ["Prazo", p.prazo],
    ["Garantia", p.garantia],
    ["Índice de reajuste", p.indice_reajuste],
    ["Multa se sair antes", p.multa_rescisao],
    ["Dia do vencimento", p.dia_vencimento],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <div className="space-y-4">
      <Semaforo risco={r.risco}>{r.resumo_simples}</Semaforo>
      <Ouvir texto={fala} />

      {dados.length > 0 && (
        <Cartao>
          <h2 className="mb-3 text-xl font-bold">O contrato em poucas palavras</h2>
          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {dados.map(([t, v]) => (
              <Par key={t} t={t} v={v} />
            ))}
          </dl>
        </Cartao>
      )}

      <Cartao>
        <h2 className="mb-3 text-xl font-bold">Cláusulas explicadas</h2>
        <ul className="space-y-3">
          {clausulas.map((c, i) => (
            <li key={i} className="rounded-xl border border-borda p-4">
              <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                {c.titulo}
                <span className={`rounded-full border px-3 py-0.5 text-sm ${AVALIACAO[c.avaliacao].classe}`}>{AVALIACAO[c.avaliacao].rotulo}</span>
              </p>
              <p className="mt-2 text-lg">{c.explicacao_simples}</p>
              <blockquote className="mt-2 border-l-4 border-borda pl-3 text-suave">“{c.trecho}”</blockquote>
              {c.base_legal && <p className="mt-2 text-sm text-suave">Base legal: {c.base_legal}</p>}
            </li>
          ))}
        </ul>
      </Cartao>

      <Lista titulo="Perguntas para fazer antes de assinar" itens={r.perguntas_para_fazer} />
      <Lista titulo="O que fazer agora" itens={r.recomendacoes} ordenada />
      <Limites texto={r.limitacoes} />
    </div>
  );
}

const POSICAO: Record<Comparacao["posicao"], string> = {
  muito_abaixo: "muito abaixo da média do bairro. Preço bom demais é um dos sinais mais comuns de golpe: visite o imóvel antes de pagar qualquer valor.",
  abaixo: "abaixo da média do bairro. Pode ser um bom negócio, mas confira o imóvel pessoalmente.",
  na_faixa: "dentro da faixa normal do bairro.",
  acima: "acima da média do bairro. Vale negociar.",
  muito_acima: "muito acima da média do bairro. Negocie ou procure outras opções.",
};

export function VerPreco({ r }: { r: Comparacao }) {
  const sinal = r.diferenca >= 0 ? "acima" : "abaixo";
  const frasePreco = `O valor pedido, ${brl(r.valorPedido)}, está ${pct(Math.abs(r.diferenca) * 100, 0)} ${sinal} da referência e fica ${POSICAO[r.posicao]}`;
  const fraseRenda =
    r.comprometimento !== null
      ? `Esse aluguel leva ${pct(r.comprometimento * 100, 0)} da sua renda. ${
          r.comprometimento > 0.3
            ? "O recomendado é até 30%. Acima disso, a conta costuma apertar no fim do mês."
            : "Está dentro do limite recomendado de 30%."
        }`
      : "";
  const fala = `Resultado: ${ROTULO_RISCO[r.risco]}. Para ${r.area} metros quadrados em ${r.bairro.bairro}, a referência é ${brl(r.referencia)} por mês. ${frasePreco} ${fraseRenda}`;

  // Regua: posicao do valor pedido entre 0 e 2x a referencia.
  const escala = (v: number) => Math.max(0, Math.min(100, (v / (r.referencia * 2)) * 100));

  return (
    <div className="space-y-4">
      <Semaforo risco={r.risco}>
        <p>{frasePreco}</p>
        {fraseRenda && <p className="mt-2">{fraseRenda}</p>}
      </Semaforo>
      <Ouvir texto={fala} />

      <Cartao>
        <h2 className="mb-3 text-xl font-bold">Comparação com o bairro</h2>
        <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-3">
          <Par t={`Referência para ${r.area} m²`} v={brl(r.referencia)} />
          <Par t="Faixa normal" v={`${brl(r.minimo)} a ${brl(r.maximo)}`} />
          <Par t="Valor pedido" v={brl(r.valorPedido)} />
        </dl>
        <div className="mt-5" aria-hidden>
          <div className="relative h-4 rounded-full bg-grade">
            <div className="absolute inset-y-0 rounded-full bg-marca/40" style={{ left: `${escala(r.minimo)}%`, width: `${escala(r.maximo) - escala(r.minimo)}%` }} />
            <div className="absolute -top-1.5 h-7 w-1.5 -translate-x-1/2 rounded bg-texto" style={{ left: `${escala(r.valorPedido)}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-sm text-suave">
            <span>R$ 0</span>
            <span>faixa normal em destaque · traço = valor pedido</span>
            <span>{brl(r.referencia * 2)}</span>
          </div>
        </div>
        <p className="mt-4 text-sm text-suave">
          Referência: {brl(r.bairro.preco_m2)} por m² em {r.bairro.bairro} ({r.bairro.zona}). Fonte: {r.bairro.fonte}, {r.bairro.referencia}.
          É uma média: o valor real muda com o estado do imóvel, andar, vaga e condomínio.
        </p>
      </Cartao>

      {r.comprometimento !== null && r.aluguelMaximoPelaRenda !== null && (
        <Cartao>
          <h2 className="mb-3 text-xl font-bold">Peso na sua renda</h2>
          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <Par t="Quanto da renda vai para o aluguel" v={pct(r.comprometimento * 100, 0)} />
            <Par t="Aluguel máximo recomendado (30%)" v={brl(r.aluguelMaximoPelaRenda)} />
          </dl>
          <p className="mt-3 text-sm text-suave">Sua renda não fica guardada: usamos o número só para este cálculo.</p>
        </Cartao>
      )}
    </div>
  );
}

export function VerReajuste({ r }: { r: ResultadoReajuste }) {
  const negativo = r.percentual < 0;
  const frases = [
    `O ${r.indice} acumulado nos 12 meses antes de ${mesBr(r.mesReajuste)} foi de ${pct(r.percentual, 2)}.`,
    negativo
      ? "Como o índice ficou negativo, o aluguel não deve subir."
      : `Com esse índice, o aluguel de ${brl(r.valorAtual)} passa para no máximo ${brl(r.valorCorreto)}.`,
    r.valorCobrado !== null && r.excesso !== null
      ? r.excesso > 1
        ? `Estão cobrando ${brl(r.valorCobrado)}, que é ${brl(r.excesso)} a mais por mês${r.excessoAnual ? `, ou ${brl(r.excessoAnual)} em um ano` : ""}.`
        : `O valor cobrado, ${brl(r.valorCobrado)}, está dentro do índice.`
      : "",
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <Semaforo risco={r.risco}>
        {frases.map((f, i) => (
          <p key={i} className={i ? "mt-2" : ""}>
            {f}
          </p>
        ))}
      </Semaforo>
      <Ouvir texto={`Resultado: ${ROTULO_RISCO[r.risco]}. ${frases.join(" ")}`} />

      {r.risco !== "verde" && (
        <Lista
          titulo="O que fazer agora"
          ordenada
          itens={[
            "Confira no contrato qual é o índice de reajuste combinado. O proprietário só pode usar o índice que está escrito.",
            "Mostre este cálculo para o proprietário ou a imobiliária e peça a correção por escrito.",
            "Se não resolver, procure o Procon-SP ou a Defensoria Pública. O atendimento é gratuito.",
          ]}
        />
      )}

      <Cartao>
        <h2 className="mb-3 text-xl font-bold">Como a conta foi feita</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Variação mensal do {r.indice} nos 12 meses usados no cálculo</caption>
            <thead>
              <tr className="border-b border-borda text-sm text-suave">
                <th className="py-2 pr-4 font-semibold">Mês</th>
                <th className="py-2 text-right font-semibold">{r.indice} do mês</th>
              </tr>
            </thead>
            <tbody>
              {r.meses.map((m) => (
                <tr key={m.mes} className="border-b border-grade">
                  <td className="py-1.5 pr-4">{mesBr(m.mes)}</td>
                  <td className="py-1.5 text-right tabular-nums">{pct(m.valor, 2)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-2 pr-4">Acumulado em 12 meses</td>
                <td className="py-2 text-right tabular-nums">{pct(r.percentual, 2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-suave">
          Fonte: Banco Central do Brasil, Sistema Gerenciador de Séries Temporais (série {r.indice === "IGP-M" ? "189" : "433"}).{" "}
          {r.fonte === "bcb"
            ? "Dados consultados agora na API do Banco Central."
            : `A API do Banco Central não respondeu; usamos a tabela guardada em ${r.coletadoEm?.split("-").reverse().join("/")}.`}
        </p>
      </Cartao>
    </div>
  );
}

/** Mostra um resultado salvo no historico, qualquer que seja o tipo. */
export function VerResultado({ tipo, resultado }: { tipo: string; resultado: unknown }) {
  if (tipo === "contrato") return <VerContrato r={resultado as ContratoResultado} />;
  if (tipo === "preco") return <VerPreco r={resultado as Comparacao} />;
  if (tipo === "reajuste") return <VerReajuste r={resultado as ResultadoReajuste} />;
  return <VerGolpe r={resultado as ResultadoGolpe} />;
}
