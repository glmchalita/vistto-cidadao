"use client";

import { FileText, Scale, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Cartao, chamar, EtiquetaRisco, Titulo } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { ROTULO_TIPO, type Risco } from "@/lib/tipos";

type Item = { id: string; tipo: string; risco: Risco; titulo: string; criadoEm: string };

const FERRAMENTAS = [
  {
    href: "/app/golpe",
    Icone: ShieldAlert,
    titulo: "É golpe?",
    texto: "Envie a foto do anúncio, do boleto, do documento ou o print da conversa. A gente procura sinais de golpe.",
  },
  {
    href: "/app/contrato",
    Icone: FileText,
    titulo: "Entenda o contrato",
    texto: "Envie o contrato ou a matrícula. A gente explica em palavras simples, aponta cláusulas abusivas e diz se o imóvel é HIS.",
  },
  {
    href: "/app/aluguel",
    Icone: Scale,
    titulo: "Aluguel justo",
    texto: "Compare o preço com a média do bairro, confira o reajuste e veja o aluguel máximo se o imóvel for HIS ou HMP.",
  },
];

export default function Inicio() {
  const { data: sessao } = authClient.useSession();
  const [itens, setItens] = useState<Item[] | null>(null);

  useEffect(() => {
    chamar<{ itens: Item[] }>("/api/historico")
      .then((r) => setItens(r.itens.slice(0, 4)))
      .catch(() => setItens([]));
  }, []);

  const nome = sessao?.user.name?.split(" ")[0];

  return (
    <>
      <Titulo sub="Antes de pagar ou assinar qualquer coisa, confira aqui. É gratuito.">
        {nome ? `Olá, ${nome}. ` : ""}O que você quer conferir hoje?
      </Titulo>

      <ul className="grid gap-4 md:grid-cols-3">
        {FERRAMENTAS.map(({ href, Icone, titulo, texto }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex h-full flex-col gap-3 rounded-2xl border-2 border-borda bg-cartao p-6 no-underline hover:border-marca"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-marca-clara text-marca-forte">
                <Icone size={30} aria-hidden />
              </span>
              <span className="text-xl font-bold text-texto">{titulo}</span>
              <span className="text-suave">{texto}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Cartao className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Suas últimas análises</h2>
          <Link href="/app/historico" className="font-semibold text-marca-forte">
            Ver todas
          </Link>
        </div>
        {itens === null ? (
          <p role="status">Carregando…</p>
        ) : itens.length === 0 ? (
          <p className="text-suave">Você ainda não fez nenhuma análise. Escolha uma das opções acima para começar.</p>
        ) : (
          <ul className="divide-y divide-borda">
            {itens.map((i) => (
              <li key={i.id}>
                <Link href={`/app/historico/${i.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 no-underline">
                  <span>
                    <span className="font-semibold text-texto">{i.titulo}</span>
                    <span className="block text-sm text-suave">
                      {ROTULO_TIPO[i.tipo]} · {new Date(i.criadoEm).toLocaleDateString("pt-BR")}
                    </span>
                  </span>
                  <EtiquetaRisco risco={i.risco} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </>
  );
}
