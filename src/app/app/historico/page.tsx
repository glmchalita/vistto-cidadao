"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cartao, chamar, Erro, EtiquetaRisco, Titulo } from "@/components/ui";
import { ROTULO_TIPO, type Risco } from "@/lib/tipos";

type Item = { id: string; tipo: string; risco: Risco; titulo: string; bairro: string | null; criadoEm: string };

export default function Historico() {
  const [itens, setItens] = useState<Item[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    chamar<{ itens: Item[] }>("/api/historico")
      .then((r) => setItens(r.itens))
      .catch((e) => setErro(e.message));
  }, []);

  return (
    <>
      <Titulo sub="Aqui ficam só os resultados. As fotos e os arquivos que você enviou não são guardados.">Histórico</Titulo>
      <Erro>{erro}</Erro>
      {itens === null && !erro && <p role="status">Carregando…</p>}
      {itens && itens.length === 0 && (
        <Cartao>
          <p>Você ainda não fez nenhuma análise.</p>
        </Cartao>
      )}
      {itens && itens.length > 0 && (
        <Cartao>
          <ul className="divide-y divide-borda">
            {itens.map((i) => (
              <li key={i.id}>
                <Link href={`/app/historico/${i.id}`} className="flex flex-wrap items-center justify-between gap-2 py-4 no-underline">
                  <span>
                    <span className="text-lg font-semibold text-texto">{i.titulo}</span>
                    <span className="block text-sm text-suave">
                      {ROTULO_TIPO[i.tipo]}
                      {i.bairro ? ` · ${i.bairro}` : ""} · {new Date(i.criadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </span>
                  <EtiquetaRisco risco={i.risco} />
                </Link>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </>
  );
}
