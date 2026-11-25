"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Botao, Cartao, chamar, Erro, Titulo } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

export default function Privacidade() {
  const router = useRouter();
  const { data: sessao } = authClient.useSession();
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [confirmar, setConfirmar] = useState<"" | "historico" | "conta">("");
  const [ocupado, setOcupado] = useState(false);

  async function baixar() {
    setErro("");
    try {
      const dados = await chamar<unknown>("/api/conta");
      const url = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "meus-dados-vistto-cidadao.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui baixar.");
    }
  }

  async function executar() {
    setOcupado(true);
    setErro("");
    try {
      if (confirmar === "historico") {
        await chamar("/api/historico", { method: "DELETE" });
        setAviso("Seu histórico foi apagado.");
        setConfirmar("");
      } else if (confirmar === "conta") {
        await chamar("/api/conta", { method: "DELETE" });
        await authClient.signOut().catch(() => {});
        router.replace("/");
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui apagar.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <Titulo sub="Você manda nos seus dados. Veja o que guardamos e apague quando quiser.">Meus dados</Titulo>
      <div className="space-y-5">
        <Cartao>
          <h2 className="mb-3 text-xl font-bold">O que guardamos</h2>
          <ul className="list-disc space-y-2 pl-6 text-lg">
            <li>
              Seu nome e e-mail ({sessao?.user.email}), para você entrar na conta. A senha fica embaralhada (hash) e ninguém consegue ler.
            </li>
            <li>O resultado de cada análise, para você consultar depois no histórico.</li>
          </ul>
          <h2 className="mb-3 mt-6 text-xl font-bold">O que não guardamos</h2>
          <ul className="list-disc space-y-2 pl-6 text-lg">
            <li>As fotos, prints e PDFs que você envia. Eles são lidos uma vez pela inteligência artificial e descartados.</li>
            <li>Sua renda. Ela é usada só na hora do cálculo.</li>
            <li>CPF, endereço ou dados bancários. Nunca pedimos isso.</li>
          </ul>
          <h2 className="mb-3 mt-6 text-xl font-bold">Como a inteligência artificial é usada</h2>
          <p className="text-lg">
            Os arquivos são analisados pelo modelo Claude, da Anthropic, que lê imagens e textos. A análise é uma orientação, não uma
            decisão: quem decide pagar ou assinar é sempre você. O resultado mostra os sinais encontrados e também o que a análise não
            consegue confirmar. O painel público usa apenas totais, sem identificar ninguém.
          </p>
        </Cartao>

        <Cartao>
          <h2 className="mb-3 text-xl font-bold">Seus direitos (LGPD)</h2>
          {aviso && <p role="status" className="mb-3 rounded-xl border-2 border-verde bg-verde-fundo p-3 font-semibold text-verde-texto">{aviso}</p>}
          <Erro>{erro}</Erro>
          <div className="mt-3 flex flex-wrap gap-3">
            <Botao variante="secundario" onClick={baixar}>Baixar meus dados</Botao>
            <Botao variante="perigo" onClick={() => setConfirmar("historico")}>Apagar meu histórico</Botao>
            <Botao variante="perigo" onClick={() => setConfirmar("conta")}>Apagar minha conta</Botao>
          </div>
          {confirmar && (
            <div role="alertdialog" aria-labelledby="titulo-confirmar" className="mt-4 rounded-xl border-2 border-vermelho bg-vermelho-fundo p-4">
              <p id="titulo-confirmar" className="text-lg font-bold">
                {confirmar === "conta"
                  ? "Apagar a conta e todas as análises? Isso não pode ser desfeito."
                  : "Apagar todas as análises do histórico? Isso não pode ser desfeito."}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Botao variante="perigo" onClick={executar} carregando={ocupado}>Sim, apagar</Botao>
                <Botao variante="secundario" onClick={() => setConfirmar("")}>Cancelar</Botao>
              </div>
            </div>
          )}
        </Cartao>
      </div>
    </>
  );
}
