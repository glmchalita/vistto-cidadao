"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BarraAcessibilidade } from "@/components/Acessibilidade";
import { Botao, Campo, Cartao, entrada, Erro, Logo } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

const MENSAGENS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  USER_ALREADY_EXISTS: "Já existe uma conta com esse e-mail. Tente entrar.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com esse e-mail. Tente entrar.",
  PASSWORD_TOO_SHORT: "A senha precisa ter pelo menos 8 caracteres.",
  INVALID_EMAIL: "Confira o e-mail digitado.",
};

export function FormAuth({ modo }: { modo: "entrar" | "cadastro" }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const cadastro = modo === "cadastro";

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const r = cadastro
      ? await authClient.signUp.email({ name: nome.trim(), email: email.trim(), password: senha })
      : await authClient.signIn.email({ email: email.trim(), password: senha });
    setCarregando(false);
    if (r.error) {
      setErro(MENSAGENS[r.error.code ?? ""] ?? "Não foi possível continuar. Confira os dados e tente de novo.");
      return;
    }
    router.replace("/app");
  }

  return (
    <main id="conteudo" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/" className="no-underline">
          <Logo />
        </Link>
        <BarraAcessibilidade />
      </div>
      <Cartao>
        <h1 className="mb-1 text-2xl font-bold">{cadastro ? "Criar conta gratuita" : "Entrar"}</h1>
        <p className="mb-5 text-suave">
          {cadastro ? "Só precisamos de nome e e-mail. Não pedimos CPF nem cartão." : "Use o e-mail e a senha que você cadastrou."}
        </p>
        <form onSubmit={enviar} className="space-y-4">
          {cadastro && (
            <Campo rotulo="Seu nome">
              <input className={entrada} value={nome} onChange={(e) => setNome(e.target.value)} required autoComplete="name" maxLength={80} />
            </Campo>
          )}
          <Campo rotulo="E-mail">
            <input type="email" className={entrada} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </Campo>
          <Campo rotulo="Senha" ajuda={cadastro ? "Pelo menos 8 caracteres." : undefined}>
            <input
              type="password"
              className={entrada}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={8}
              autoComplete={cadastro ? "new-password" : "current-password"}
            />
          </Campo>
          <Erro>{erro}</Erro>
          <Botao type="submit" carregando={carregando} className="w-full">
            {cadastro ? "Criar conta" : "Entrar"}
          </Botao>
        </form>
        <p className="mt-5 text-center">
          {cadastro ? "Já tem conta? " : "Ainda não tem conta? "}
          <Link href={cadastro ? "/entrar" : "/cadastro"} className="font-semibold text-marca-forte">
            {cadastro ? "Entrar" : "Criar conta gratuita"}
          </Link>
        </p>
      </Cartao>
    </main>
  );
}
