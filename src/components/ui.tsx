"use client";

import { AlertTriangle, CheckCircle2, Loader2, OctagonAlert } from "lucide-react";
import Link from "next/link";
import type { Risco } from "@/lib/tipos";
import { ROTULO_RISCO } from "@/lib/tipos";

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const pct = (n: number, casas = 1) =>
  `${n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;

export function Logo({ grande = false }: { grande?: boolean }) {
  return (
    <span className={`font-bold tracking-tight ${grande ? "text-3xl" : "text-xl"}`}>
      <span className="text-vistto">Vistto</span> <span className="text-marca">Cidadão</span>
    </span>
  );
}

export function Cartao({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-borda bg-cartao p-5 sm:p-6 ${className}`}>{children}</section>;
}

type BotaoProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { carregando?: boolean; variante?: "primario" | "secundario" | "perigo" };

export function Botao({ carregando, variante = "primario", children, className = "", disabled, ...resto }: BotaoProps) {
  const cores = {
    primario: "bg-marca text-sobre-marca hover:bg-marca-forte border-marca",
    secundario: "bg-cartao text-texto border-borda hover:border-marca",
    perigo: "bg-cartao text-vermelho-texto border-vermelho hover:bg-vermelho-fundo",
  }[variante];
  return (
    <button
      {...resto}
      disabled={disabled || carregando}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-5 py-2.5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${cores} ${className}`}
    >
      {carregando && <Loader2 size={20} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkBotao({ href, children, variante = "primario" }: { href: string; children: React.ReactNode; variante?: "primario" | "secundario" }) {
  const cores =
    variante === "primario"
      ? "bg-marca text-sobre-marca hover:bg-marca-forte border-marca"
      : "bg-cartao text-texto border-borda hover:border-marca";
  return (
    <Link href={href} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-5 py-2.5 text-base font-semibold no-underline ${cores}`}>
      {children}
    </Link>
  );
}

export function Campo({ rotulo, ajuda, children }: { rotulo: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-semibold">{rotulo}</span>
      {children}
      {ajuda && <span className="mt-1 block text-sm text-suave">{ajuda}</span>}
    </label>
  );
}

export const entrada =
  "block w-full min-h-12 rounded-xl border-2 border-borda bg-cartao px-4 py-2.5 text-base text-texto placeholder:text-suave/70 focus:border-marca";

const ESTILO_RISCO: Record<Risco, { caixa: string; texto: string; Icone: typeof CheckCircle2 }> = {
  verde: { caixa: "border-verde bg-verde-fundo", texto: "text-verde-texto", Icone: CheckCircle2 },
  amarelo: { caixa: "border-amarelo bg-amarelo-fundo", texto: "text-amarelo-texto", Icone: AlertTriangle },
  vermelho: { caixa: "border-vermelho bg-vermelho-fundo", texto: "text-vermelho-texto", Icone: OctagonAlert },
};

/** Semaforo: sempre cor + icone + texto, nunca so a cor. */
export function Semaforo({ risco, children }: { risco: Risco; children?: React.ReactNode }) {
  const e = ESTILO_RISCO[risco];
  return (
    <div role="status" className={`rounded-2xl border-2 p-5 ${e.caixa}`}>
      <p className={`flex items-center gap-3 text-2xl font-bold ${e.texto}`}>
        <e.Icone size={36} aria-hidden />
        {ROTULO_RISCO[risco]}
      </p>
      {children && <div className="mt-3 text-lg text-texto">{children}</div>}
    </div>
  );
}

export function EtiquetaRisco({ risco }: { risco: Risco }) {
  const e = ESTILO_RISCO[risco];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${e.caixa} ${e.texto}`}>
      <e.Icone size={16} aria-hidden />
      {ROTULO_RISCO[risco]}
    </span>
  );
}

export function Erro({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl border-2 border-vermelho bg-vermelho-fundo p-4 font-semibold text-vermelho-texto">
      {children}
    </p>
  );
}

export function Titulo({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-bold leading-tight">{children}</h1>
      {sub && <p className="mt-2 max-w-2xl text-lg text-suave">{sub}</p>}
    </header>
  );
}

/** Chama a API e devolve o JSON; erros viram mensagens simples. */
export async function chamar<T>(url: string, init?: RequestInit): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(url, init);
  } catch {
    throw new Error("Sem conexão com a internet. Confira sua rede e tente de novo.");
  }
  if (resp.status === 413) throw new Error("O arquivo ficou grande demais. Tente menos páginas ou uma foto menor.");
  const corpo = await resp.json().catch(() => null);
  if (!resp.ok) throw new Error(corpo?.erro ?? "Algo deu errado. Tente de novo em instantes.");
  return corpo as T;
}

export function postar<T>(url: string, dados: unknown) {
  return chamar<T>(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
}
