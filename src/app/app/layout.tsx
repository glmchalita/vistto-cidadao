"use client";

import { BarChart3, FileText, History, Home, LogOut, Scale, ShieldAlert, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BarraAcessibilidade } from "@/components/Acessibilidade";
import { Logo } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

const MENU = [
  { href: "/app", rotulo: "Início", Icone: Home },
  { href: "/app/golpe", rotulo: "É golpe?", Icone: ShieldAlert },
  { href: "/app/contrato", rotulo: "Contrato", Icone: FileText },
  { href: "/app/aluguel", rotulo: "Aluguel justo", Icone: Scale },
  { href: "/app/painel", rotulo: "Painel", Icone: BarChart3 },
  { href: "/app/historico", rotulo: "Histórico", Icone: History },
  { href: "/app/privacidade", rotulo: "Meus dados", Icone: UserRound },
];

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  const { data: sessao, isPending } = authClient.useSession();
  const router = useRouter();
  const caminho = usePathname();

  useEffect(() => {
    if (!isPending && !sessao) router.replace("/entrar");
  }, [isPending, sessao, router]);

  if (isPending || !sessao) {
    return (
      <p className="p-10 text-center text-lg" role="status">
        Carregando…
      </p>
    );
  }

  async function sair() {
    await authClient.signOut();
    router.replace("/");
  }

  return (
    <>
      <header className="border-b border-borda bg-cartao">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/app" className="no-underline" aria-label="Vistto Cidadão, início">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <BarraAcessibilidade />
            <button
              type="button"
              onClick={sair}
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-borda bg-cartao px-3 text-sm font-semibold hover:border-marca"
            >
              <LogOut size={16} aria-hidden /> Sair
            </button>
          </div>
        </div>
        <nav aria-label="Principal" className="mx-auto max-w-5xl overflow-x-auto px-2">
          <ul className="flex gap-1">
            {MENU.map(({ href, rotulo, Icone }) => {
              const ativo = href === "/app" ? caminho === "/app" : caminho.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={ativo ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-2 whitespace-nowrap border-b-4 px-3 font-semibold no-underline ${
                      ativo ? "border-marca text-marca-forte" : "border-transparent text-suave hover:text-texto"
                    }`}
                  >
                    <Icone size={18} aria-hidden />
                    {rotulo}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-borda px-4 py-5 text-center text-sm text-suave">
        Vistto Cidadão é uma orientação inicial e gratuita. Não substitui o Procon, a Defensoria Pública ou um advogado.
      </footer>
    </>
  );
}
