"use client";

import { useEffect, useState } from "react";
import { VerPreco, VerReajuste, type ResultadoReajuste } from "@/components/Resultados";
import { Botao, Campo, Cartao, chamar, entrada, Erro, postar, Titulo } from "@/components/ui";
import type { Bairro, Comparacao } from "@/lib/aluguel";

/** Aceita "1.200,50", "1200.50" ou "1200". */
function numero(texto: string): number {
  const limpo = texto.replace(/[^\d.,]/g, "");
  if (limpo.includes(",")) return Number(limpo.replace(/\./g, "").replace(",", "."));
  return Number(limpo);
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
                    {b.bairro} ({b.zona})
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

export default function Aluguel() {
  const [aba, setAba] = useState<"preco" | "reajuste">("preco");
  const [bairros, setBairros] = useState<Bairro[]>([]);

  useEffect(() => {
    chamar<{ bairros: Bairro[] }>("/api/bairros")
      .then((r) => setBairros(r.bairros))
      .catch(() => {});
  }, []);

  const abas = [
    { id: "preco" as const, rotulo: "O preço está justo?" },
    { id: "reajuste" as const, rotulo: "O reajuste está certo?" },
  ];

  return (
    <>
      <Titulo sub="Contas feitas com dados públicos: preço médio por bairro e índices oficiais do Banco Central.">Aluguel justo</Titulo>
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
      <div role="tabpanel">{aba === "preco" ? <Comparar bairros={bairros} /> : <Reajuste />}</div>
    </>
  );
}
