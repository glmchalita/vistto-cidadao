"use client";

import { useEffect, useState } from "react";
import { VerHis, VerPreco, VerReajuste, type ResultadoReajuste } from "@/components/Resultados";
import { Botao, brl, Campo, Cartao, chamar, entrada, Erro, postar, Titulo } from "@/components/ui";
import { FAIXAS_HIS, HIS_REFERENCIA, tetoAluguel, type ConferenciaHis, type FaixaId } from "@/lib/his";
import type { Bairro, Comparacao } from "@/lib/aluguel";

/** Aceita "1.200,50", "1200.50" ou "1200". */
function numero(texto: string): number {
  const limpo = texto.replace(/[^\d.,]/g, "");
  if (limpo.includes(",")) return Number(limpo.replace(/\./g, "").replace(",", "."));
  // Sem virgula, ponto seguido de exatamente 3 digitos e separador de milhar ("2.100").
  return Number(limpo.replace(/\.(?=\d{3}(\.|$))/g, ""));
}

function Comparar({ bairros }: { bairros: Bairro[] }) {
  const [bairro, setBairro] = useState("");
  const [area, setArea] = useState("");
  const [valor, setValor] = useState("");
  const [renda, setRenda] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [r, setR] = useState<Comparacao | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!bairro) return setErro("Escolha o bairro.");
    const a = numero(area), v = numero(valor), rd = renda ? numero(renda) : undefined;
    if (!(a >= 10 && a <= 500)) return setErro("Informe o tamanho do imóvel em metros quadrados (entre 10 e 500).");
    if (!(v >= 100)) return setErro("Informe o valor do aluguel pedido.");
    setCarregando(true);
    try {
      const resp = await postar<{ resultado: Comparacao }>("/api/aluguel/comparar", { bairro, area: a, valor: v, renda: rd });
      setR(resp.resultado);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="space-y-5">
      <Cartao>
        <form onSubmit={enviar} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Bairro">
              <select className={entrada} value={bairro} onChange={(e) => setBairro(e.target.value)}>
                <option value="">Escolha o bairro</option>
                {bairros.map((b) => (
                  <option key={b.bairro} value={b.bairro}>
                    {b.zona === "cidade inteira" ? b.bairro : `${b.bairro} (${b.zona})`}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Tamanho do imóvel (m²)" ajuda="Está no anúncio. Uma kitnet tem perto de 30 m².">
              <input className={entrada} value={area} onChange={(e) => setArea(e.target.value)} inputMode="decimal" placeholder="Ex.: 45" />
            </Campo>
            <Campo rotulo="Aluguel pedido (R$ por mês)">
              <input className={entrada} value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="Ex.: 1.500" />
            </Campo>
            <Campo rotulo="Renda da casa por mês (opcional)" ajuda="Não fica guardada. Serve só para calcular o peso do aluguel.">
              <input className={entrada} value={renda} onChange={(e) => setRenda(e.target.value)} inputMode="decimal" placeholder="Ex.: 3.000" />
            </Campo>
          </div>
          <Erro>{erro}</Erro>
          <Botao type="submit" carregando={carregando}>
            Comparar preço
          </Botao>
        </form>
      </Cartao>
      {r && <VerPreco r={r} />}
    </div>
  );
}

function Reajuste() {
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const [indice, setIndice] = useState("IGP-M");
  const [valorAtual, setValorAtual] = useState("");
  const [mes, setMes] = useState(mesAtual);
  const [cobrado, setCobrado] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [r, setR] = useState<ResultadoReajuste | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const v = numero(valorAtual);
    if (!(v >= 100)) return setErro("Informe o valor do aluguel antes do reajuste.");
    if (!/^\d{4}-\d{2}$/.test(mes)) return setErro("Informe o mês do reajuste.");
    setCarregando(true);
    try {
      const resp = await postar<{ resultado: ResultadoReajuste }>("/api/aluguel/reajuste", {
        indice,
        valorAtual: v,
        mesReajuste: mes,
        valorCobrado: cobrado ? numero(cobrado) : undefined,
      });
      setR(resp.resultado);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="space-y-5">
      <Cartao>
        <form onSubmit={enviar} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Índice do contrato" ajuda="Está escrito no contrato, na parte de reajuste.">
              <select className={entrada} value={indice} onChange={(e) => setIndice(e.target.value)}>
                <option value="IGP-M">IGP-M (FGV)</option>
                <option value="IPCA">IPCA (IBGE)</option>
              </select>
            </Campo>
            <Campo rotulo="Mês do reajuste" ajuda="O mês de aniversário do contrato.">
              <input type="month" className={entrada} value={mes} max={mesAtual} onChange={(e) => setMes(e.target.value)} />
            </Campo>
            <Campo rotulo="Aluguel antes do reajuste (R$)">
              <input className={entrada} value={valorAtual} onChange={(e) => setValorAtual(e.target.value)} inputMode="decimal" placeholder="Ex.: 1.500" />
            </Campo>
            <Campo rotulo="Novo valor que estão cobrando (opcional)">
              <input className={entrada} value={cobrado} onChange={(e) => setCobrado(e.target.value)} inputMode="decimal" placeholder="Ex.: 1.650" />
            </Campo>
          </div>
          <Erro>{erro}</Erro>
          <Botao type="submit" carregando={carregando}>
            Conferir reajuste
          </Botao>
        </form>
      </Cartao>
      {r && <VerReajuste r={r} />}
    </div>
  );
}

function His() {
  const [faixaId, setFaixaId] = useState<FaixaId>("HIS-1");
  const [aluguel, setAluguel] = useState("");
  const [renda, setRenda] = useState("");
  const [pessoas, setPessoas] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [r, setR] = useState<ConferenciaHis | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const p = pessoas ? Math.round(numero(pessoas)) : undefined;
    if (p !== undefined && !(p >= 1 && p <= 20)) return setErro("Informe quantas pessoas moram na casa (de 1 a 20).");
    setCarregando(true);
    try {
      const resp = await postar<{ resultado: ConferenciaHis }>("/api/aluguel/his", {
        faixa: faixaId,
        aluguel: aluguel ? numero(aluguel) : undefined,
        rendaFamiliar: renda ? numero(renda) : undefined,
        pessoas: p,
      });
      setR(resp.resultado);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="space-y-5">
      <Cartao>
        <h2 className="mb-2 text-xl font-bold">O que é HIS e HMP</h2>
        <p className="text-lg">
          São apartamentos construídos com incentivo da Prefeitura de São Paulo, em qualquer região da cidade, reservados por 10 anos a
          famílias com renda limitada. Nesses imóveis, o aluguel tem valor máximo: 30% da renda máxima da faixa.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Faixas de renda e aluguel máximo de HIS e HMP em {HIS_REFERENCIA.ano}</caption>
            <thead>
              <tr className="border-b border-borda text-sm text-suave">
                <th className="py-2 pr-3 font-semibold">Tipo</th>
                <th className="py-2 pr-3 text-right font-semibold">Renda familiar até</th>
                <th className="py-2 pr-3 text-right font-semibold">ou renda por pessoa até</th>
                <th className="py-2 text-right font-semibold">Aluguel máximo</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {FAIXAS_HIS.map((f) => (
                <tr key={f.id} className="border-b border-grade">
                  <th scope="row" className="py-2 pr-3 font-semibold">{f.nome}</th>
                  <td className="py-2 pr-3 text-right">{brl(f.rendaFamiliar)}</td>
                  <td className="py-2 pr-3 text-right">{brl(f.rendaPerCapita)}</td>
                  <td className="py-2 text-right font-bold">{brl(tetoAluguel(f.id))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-suave">
          Valores de {HIS_REFERENCIA.ano}. Faixas: {HIS_REFERENCIA.decretoRenda}. Teto: {HIS_REFERENCIA.decretoAluguel}.
        </p>
        <h3 className="mt-5 text-lg font-bold">Como saber se o imóvel é HIS ou HMP</h3>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-lg">
          <li>Na matrícula do imóvel, pedida no cartório de registro de imóveis: a destinação fica averbada.</li>
          <li>No contrato de aluguel: ele precisa ter uma cláusula sobre o enquadramento da renda da família.</li>
          <li>No prédio e na propaganda: o empreendimento deve ter placa de identificação da prefeitura.</li>
          <li>
            Ou envie o contrato ou a matrícula em <strong>Contrato</strong>: a análise procura essa informação para você.
          </li>
        </ul>
      </Cartao>

      <Cartao>
        <form onSubmit={enviar} className="space-y-4">
          <h2 className="text-xl font-bold">Conferir o meu caso</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Tipo do imóvel">
              <select className={entrada} value={faixaId} onChange={(e) => setFaixaId(e.target.value as FaixaId)}>
                {FAIXAS_HIS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Aluguel cobrado (R$ por mês, opcional)">
              <input className={entrada} value={aluguel} onChange={(e) => setAluguel(e.target.value)} inputMode="decimal" placeholder="Ex.: 2.300" />
            </Campo>
            <Campo rotulo="Renda da família por mês (opcional)" ajuda="Não fica guardada. Serve para ver se a família se enquadra na faixa.">
              <input className={entrada} value={renda} onChange={(e) => setRenda(e.target.value)} inputMode="decimal" placeholder="Ex.: 4.000" />
            </Campo>
            <Campo rotulo="Pessoas na casa (opcional)">
              <input className={entrada} value={pessoas} onChange={(e) => setPessoas(e.target.value)} inputMode="numeric" placeholder="Ex.: 3" />
            </Campo>
          </div>
          <Erro>{erro}</Erro>
          <Botao type="submit" carregando={carregando}>
            Ver o aluguel máximo
          </Botao>
        </form>
      </Cartao>
      {r && <VerHis r={r} />}
    </div>
  );
}

export default function Aluguel() {
  const [aba, setAba] = useState<"preco" | "reajuste" | "his">("preco");
  const [bairros, setBairros] = useState<Bairro[]>([]);

  useEffect(() => {
    chamar<{ bairros: Bairro[] }>("/api/bairros")
      .then((r) => setBairros(r.bairros))
      .catch(() => {});
  }, []);

  const abas = [
    { id: "preco" as const, rotulo: "O preço está justo?" },
    { id: "reajuste" as const, rotulo: "O reajuste está certo?" },
    { id: "his" as const, rotulo: "É HIS? Qual o teto?" },
  ];

  return (
    <>
      <Titulo sub="Contas feitas com dados públicos: preço médio por bairro, índices do Banco Central e o teto de aluguel dos imóveis de habitação social (HIS e HMP).">Aluguel justo</Titulo>
      <div role="tablist" aria-label="Tipo de conferência" className="mb-5 flex flex-wrap gap-2">
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={aba === a.id}
            onClick={() => setAba(a.id)}
            className={`min-h-12 rounded-xl border-2 px-5 font-semibold ${
              aba === a.id ? "border-marca bg-marca text-sobre-marca" : "border-borda bg-cartao"
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>
      <div role="tabpanel">{aba === "preco" ? <Comparar bairros={bairros} /> : aba === "reajuste" ? <Reajuste /> : <His />}</div>
    </>
  );
}
