"use client";

import { FileBadge, Megaphone, MessageCircle, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { Consentimento, EnvioArquivo, type ArquivoPronto } from "@/components/EnvioArquivo";
import { VerGolpe, type ResultadoGolpe } from "@/components/Resultados";
import { Botao, Campo, Cartao, chamar, entrada, Erro, postar, Titulo } from "@/components/ui";
import type { TipoGolpe } from "@/lib/tipos";

const TIPOS: { id: TipoGolpe; rotulo: string; ajuda: string; Icone: typeof Megaphone }[] = [
  { id: "anuncio", rotulo: "Anúncio", ajuda: "Foto ou print do anúncio do imóvel", Icone: Megaphone },
  { id: "conversa", rotulo: "Conversa", ajuda: "Print do WhatsApp com quem oferece o imóvel", Icone: MessageCircle },
  { id: "boleto", rotulo: "Boleto ou PIX", ajuda: "Boleto, QR Code ou dados do PIX que te mandaram", Icone: Receipt },
  { id: "documento", rotulo: "Documento", ajuda: "Matrícula, IPTU ou documento do suposto dono", Icone: FileBadge },
];

export default function Golpe() {
  const [tipo, setTipo] = useState<TipoGolpe>("anuncio");
  const [arquivos, setArquivos] = useState<ArquivoPronto[]>([]);
  const [proprietario, setProprietario] = useState("");
  const [valor, setValor] = useState("");
  const [bairro, setBairro] = useState("");
  const [observacao, setObservacao] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [bairros, setBairros] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<ResultadoGolpe | null>(null);

  useEffect(() => {
    chamar<{ bairros: { bairro: string }[] }>("/api/bairros")
      .then((r) => setBairros(r.bairros.map((b) => b.bairro)))
      .catch(() => {});
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (arquivos.length === 0) return setErro("Escolha pelo menos um arquivo para analisar.");
    if (!consentimento) return setErro("Marque a caixa de concordância para continuar.");
    setCarregando(true);
    try {
      const r = await postar<{ resultado: ResultadoGolpe }>("/api/analises/golpe", {
        tipo,
        arquivos: arquivos.map(({ media_type, data }) => ({ media_type, data })),
        proprietario: proprietario || undefined,
        valor: valor || undefined,
        bairro: bairro || undefined,
        observacao: observacao || undefined,
        consentimento: true,
      });
      setResultado(r.resultado);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Algo deu errado.");
    } finally {
      setCarregando(false);
    }
  }

  if (resultado) {
    return (
      <>
        <Titulo>Resultado da análise</Titulo>
        <VerGolpe r={resultado} />
        <Botao
          variante="secundario"
          className="mt-6"
          onClick={() => {
            setResultado(null);
            setArquivos([]);
            setConsentimento(false);
          }}
        >
          Fazer outra análise
        </Botao>
      </>
    );
  }

  return (
    <>
      <Titulo sub="Envie o que te mandaram. A inteligência artificial lê a imagem e procura os sinais mais comuns de golpe de aluguel.">
        É golpe?
      </Titulo>
      <form onSubmit={enviar} className="space-y-5">
        <Cartao>
          <fieldset>
            <legend className="mb-3 text-xl font-bold">1. O que você quer conferir?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {TIPOS.map(({ id, rotulo, ajuda, Icone }) => (
                <label
                  key={id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 ${
                    tipo === id ? "border-marca bg-marca-clara" : "border-borda"
                  }`}
                >
                  <input type="radio" name="tipo" value={id} checked={tipo === id} onChange={() => setTipo(id)} className="sr-only" />
                  <Icone size={28} className="shrink-0 text-marca-forte" aria-hidden />
                  <span>
                    <span className="block font-bold">{rotulo}</span>
                    <span className="block text-sm text-suave">{ajuda}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </Cartao>

        <Cartao>
          <h2 className="mb-3 text-xl font-bold">2. Envie o arquivo</h2>
          <EnvioArquivo arquivos={arquivos} aoMudar={setArquivos} maximo={4} rotulo="Foto, print ou PDF" />
        </Cartao>

        <Cartao>
          <h2 className="mb-1 text-xl font-bold">3. Conte um pouco mais</h2>
          <p className="mb-4 text-suave">Opcional, mas ajuda a análise a comparar as informações.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Nome de quem diz ser o dono" ajuda="Usado só para comparar com o nome que aparece no arquivo.">
              <input className={entrada} value={proprietario} onChange={(e) => setProprietario(e.target.value)} maxLength={120} autoComplete="off" />
            </Campo>
            <Campo rotulo="Valor pedido">
              <input className={entrada} value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Ex.: R$ 1.200" maxLength={40} inputMode="decimal" />
            </Campo>
            <Campo rotulo="Bairro do imóvel">
              <select className={entrada} value={bairro} onChange={(e) => setBairro(e.target.value)}>
                <option value="">Não sei ou prefiro não dizer</option>
                {bairros.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Algo que te deixou em dúvida?">
              <input className={entrada} value={observacao} onChange={(e) => setObservacao(e.target.value)} maxLength={500} />
            </Campo>
          </div>
        </Cartao>

        <Consentimento marcado={consentimento} aoMudar={setConsentimento} />
        <Erro>{erro}</Erro>
        <Botao type="submit" carregando={carregando} className="w-full sm:w-auto">
          {carregando ? "Analisando… pode levar até 1 minuto" : "Analisar agora"}
        </Botao>
      </form>
    </>
  );
}
