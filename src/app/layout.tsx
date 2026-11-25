import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Acessibilidade } from "@/components/Acessibilidade";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vistto Cidadão — aluguel sem golpe e sem abuso",
  description:
    "Ferramenta gratuita para quem mora de aluguel em São Paulo: confira anúncios, boletos e contratos antes de pagar ou assinar.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Aplica as preferencias de acessibilidade antes da primeira pintura, para a tela nao piscar.
const PREFERENCIAS = `try{var p=JSON.parse(localStorage.getItem("vistto-acess")||"{}");if(p.contraste)document.documentElement.classList.add("contraste");if(p.fonte)document.documentElement.dataset.fonte=String(p.fonte)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFERENCIAS }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-marca focus:px-4 focus:py-2 focus:text-sobre-marca"
        >
          Pular para o conteúdo
        </a>
        <Acessibilidade>{children}</Acessibilidade>
      </body>
    </html>
  );
}
