"use client";

import { useState } from "react";
import { Consentimento, EnvioArquivo, type ArquivoPronto } from "@/components/EnvioArquivo";
import { VerContrato } from "@/components/Resultados";
import { Botao, Campo, Cartao, entrada, Erro, postar, Titulo } from "@/components/ui";
import type { ContratoResultado } from "@/lib/claude";

export default function Contrato() {
  const [arquivos, setArquivos] = useState<ArquivoPronto[]>([]);
  const [observacao, setObservacao] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<ContratoResultado | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (arquivos.length === 0) return setErro("Envie o contrato em PDF ou as fotos das páginas.");
    if (!consentimento) return setErro("Marque a caixa de concordância para continuar.");
    setCarregando(true);
    try {
      const r = await postar<{ resultado: ContratoResultado }>("/api/analises/contrato", {
        arquivos: arquivos.map(({ media_type, data }) => ({ media_type, data })),
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
        <Titulo>Seu contrato explicado</Titulo>
        <VerContrato r={resultado} />
        <Botao
          variante="secundario"
          className="mt-6"
          onClick={() => {
            setResultado(null);
            setArquivos([]);
            setConsentimento(false);
          }}
        >
          Analisar outro contrato
        </Botao>
      </>
    );
  }

  return (
    <>
      <Titulo sub="Envie o contrato antes de assinar. A gente explica cada parte em palavras simples e confere com a Lei do Inquilinato.">
        Entenda o contrato
      </Titulo>
      <form onSubmit={enviar} className="space-y-5">
        <Cartao>
          <h2 className="mb-3 text-xl font-bold">1. Envie o contrato</h2>
          <EnvioArquivo arquivos={arquivos} aoMudar={setArquivos} maximo={8} rotulo="PDF do contrato ou fotos das páginas (em ordem)" />
          <p className="mt-3 text-sm text-suave">
            Dica: tire as fotos com boa luz, uma página por foto, pegando a folha inteira.
          </p>
        </Cartao>
        <Cartao>
          <h2 className="mb-3 text-xl font-bold">2. Tem alguma dúvida específica?</h2>
          <Campo rotulo="Sua dúvida (opcional)" ajuda="Ex.: posso sair antes do prazo? Quem paga o IPTU?">
            <input className={entrada} value={observacao} onChange={(e) => setObservacao(e.target.value)} maxLength={500} />
          </Campo>
        </Cartao>
        <Consentimento marcado={consentimento} aoMudar={setConsentimento} />
        <Erro>{erro}</Erro>
        <Botao type="submit" carregando={carregando} className="w-full sm:w-auto">
          {carregando ? "Lendo o contrato… pode levar até 2 minutos" : "Explicar meu contrato"}
        </Botao>
      </form>
    </>
  );
}
