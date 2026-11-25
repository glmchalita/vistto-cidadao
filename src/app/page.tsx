import { Accessibility, FileText, Lock, Scale, ShieldAlert } from "lucide-react";
import { BarraAcessibilidade } from "@/components/Acessibilidade";
import { LinkBotao, Logo } from "@/components/ui";

const FERRAMENTAS = [
  {
    Icone: ShieldAlert,
    titulo: "É golpe?",
    texto: "Mande a foto do anúncio, do boleto ou o print da conversa. A inteligência artificial lê a imagem e mostra os sinais de golpe.",
  },
  {
    Icone: FileText,
    titulo: "Entenda o contrato",
    texto: "Mande o contrato em foto ou PDF. Você recebe a explicação em palavras simples e o aviso de cláusulas abusivas.",
  },
  {
    Icone: Scale,
    titulo: "Aluguel justo",
    texto: "Compare o preço com a média do bairro, veja o peso na sua renda e confira o reajuste pelo índice oficial.",
  },
];

export default function Home() {
  return (
    <>
      <header className="border-b border-borda bg-cartao">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <BarraAcessibilidade />
            <LinkBotao href="/entrar" variante="secundario">Entrar</LinkBotao>
          </div>
        </div>
      </header>

      <main id="conteudo" className="mx-auto w-full max-w-5xl flex-1 px-4">
        <section className="py-12 sm:py-16">
          <p className="mb-3 font-semibold text-marca-forte">Gratuito · Para quem mora de aluguel em São Paulo</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Antes de pagar ou assinar, confira se o aluguel é seguro.
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-suave">
            O Vistto Cidadão usa inteligência artificial para ler anúncios, boletos e contratos e avisar, em palavras simples,
            quando há sinal de golpe, cláusula abusiva ou preço fora do normal.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <LinkBotao href="/cadastro">Criar conta gratuita</LinkBotao>
            <LinkBotao href="/entrar" variante="secundario">Já tenho conta</LinkBotao>
          </div>
        </section>

        <section aria-labelledby="t-ferramentas" className="pb-12">
          <h2 id="t-ferramentas" className="mb-5 text-2xl font-bold">Três conferências em um lugar só</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {FERRAMENTAS.map(({ Icone, titulo, texto }) => (
              <li key={titulo} className="rounded-2xl border border-borda bg-cartao p-6">
                <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-marca-clara text-marca-forte">
                  <Icone size={30} aria-hidden />
                </span>
                <h3 className="text-xl font-bold">{titulo}</h3>
                <p className="mt-2 text-suave">{texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="t-compromissos" className="pb-16">
          <h2 id="t-compromissos" className="mb-5 text-2xl font-bold">Feito para todo mundo conseguir usar</h2>
          <ul className="grid gap-4 md:grid-cols-2">
            <li className="flex gap-4 rounded-2xl border border-borda bg-cartao p-6">
              <Accessibility size={32} className="shrink-0 text-marca-forte" aria-hidden />
              <div>
                <h3 className="text-lg font-bold">Acessível</h3>
                <p className="mt-1 text-suave">
                  Resultado em verde, amarelo ou vermelho, sempre com ícone e texto. Leitura em voz alta, letra maior e alto contraste.
                  Funciona no celular e gasta pouca internet.
                </p>
              </div>
            </li>
            <li className="flex gap-4 rounded-2xl border border-borda bg-cartao p-6">
              <Lock size={32} className="shrink-0 text-marca-forte" aria-hidden />
              <div>
                <h3 className="text-lg font-bold">Seus dados são seus</h3>
                <p className="mt-1 text-suave">
                  As fotos e os arquivos não ficam guardados. Só o resultado vai para o seu histórico, e você pode baixar ou apagar tudo
                  quando quiser.
                </p>
              </div>
            </li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-borda px-4 py-6 text-center text-sm text-suave">
        Vistto Cidadão · Projeto acadêmico FIAP (Global Solution, CitizenTech). Orientação inicial: não substitui o Procon, a
        Defensoria Pública ou um advogado.
      </footer>
    </>
  );
}
