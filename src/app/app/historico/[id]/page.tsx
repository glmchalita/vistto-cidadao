"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { VerResultado } from "@/components/Resultados";
import { Botao, chamar, Erro, Titulo } from "@/components/ui";

type Detalhe = { id: string; tipo: string; titulo: string; criadoEm: string; resultado: unknown };

export default function DetalheAnalise() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [d, setD] = useState<Detalhe | null>(null);
  const [erro, setErro] = useState("");
  const [apagando, setApagando] = useState(false);

  useEffect(() => {
    chamar<Detalhe>(`/api/historico/${id}`).then(setD).catch((e) => setErro(e.message));
  }, [id]);

  async function apagar() {
    setApagando(true);
    try {
      await chamar(`/api/historico/${id}`, { method: "DELETE" });
      router.replace("/app/historico");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui apagar.");
      setApagando(false);
    }
  }

  return (
    <>
      <Link href="/app/historico" className="mb-4 inline-flex items-center gap-1 font-semibold text-marca-forte">
        <ArrowLeft size={18} aria-hidden /> Voltar ao histórico
      </Link>
      <Erro>{erro}</Erro>
      {!d && !erro && <p role="status">Carregando…</p>}
      {d && (
        <>
          <Titulo sub={`Feita em ${new Date(d.criadoEm).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}`}>{d.titulo}</Titulo>
          <VerResultado tipo={d.tipo} resultado={d.resultado} />
          <Botao variante="perigo" className="mt-6" onClick={apagar} carregando={apagando}>
            Apagar esta análise
          </Botao>
        </>
      )}
    </>
  );
}
