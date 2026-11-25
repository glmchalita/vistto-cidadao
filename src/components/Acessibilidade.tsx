"use client";

import { Contrast, Square, Volume2 } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Prefs = { contraste: boolean; fonte: 0 | 1 | 2 };
type Ctx = Prefs & { alternarContraste: () => void; mudarFonte: (d: 1 | -1) => void };

const Contexto = createContext<Ctx | null>(null);
const CHAVE = "vistto-acess";

export function Acessibilidade({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>({ contraste: false, fonte: 0 });

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(CHAVE) || "{}");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura unica do localStorage apos montar
      setPrefs({ contraste: !!p.contraste, fonte: [0, 1, 2].includes(p.fonte) ? p.fonte : 0 });
    } catch {}
  }, []);

  const aplicar = useCallback((p: Prefs) => {
    setPrefs(p);
    document.documentElement.classList.toggle("contraste", p.contraste);
    if (p.fonte) document.documentElement.dataset.fonte = String(p.fonte);
    else delete document.documentElement.dataset.fonte;
    localStorage.setItem(CHAVE, JSON.stringify(p));
  }, []);

  const valor: Ctx = {
    ...prefs,
    alternarContraste: () => aplicar({ ...prefs, contraste: !prefs.contraste }),
    mudarFonte: (d) => aplicar({ ...prefs, fonte: Math.max(0, Math.min(2, prefs.fonte + d)) as 0 | 1 | 2 }),
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function BarraAcessibilidade() {
  const c = useContext(Contexto);
  if (!c) return null;
  const botao =
    "inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-lg border border-borda bg-cartao px-2 text-sm font-semibold text-texto hover:border-marca disabled:opacity-40";
  return (
    <div role="group" aria-label="Acessibilidade" className="flex items-center gap-1">
      <button type="button" className={botao} onClick={() => c.mudarFonte(-1)} disabled={c.fonte === 0} aria-label="Diminuir o tamanho do texto">
        A−
      </button>
      <button type="button" className={botao} onClick={() => c.mudarFonte(1)} disabled={c.fonte === 2} aria-label="Aumentar o tamanho do texto">
        A+
      </button>
      <button type="button" className={botao} onClick={c.alternarContraste} aria-pressed={c.contraste} aria-label="Alto contraste">
        <Contrast size={18} aria-hidden />
        <span className="hidden sm:inline">Contraste</span>
      </button>
    </div>
  );
}

/** Le um texto em voz alta com a voz em portugues do proprio aparelho (Web Speech API). */
export function Ouvir({ texto }: { texto: string }) {
  const [falando, setFalando] = useState(false);
  const [suportado, setSuportado] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deteccao de recurso do navegador apos montar
    setSuportado(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  if (!suportado) return null;

  function alternar() {
    const s = window.speechSynthesis;
    if (falando) {
      s.cancel();
      setFalando(false);
      return;
    }
    s.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    fala.rate = 0.95;
    const voz = s.getVoices().find((v) => v.lang.toLowerCase().startsWith("pt-br"));
    if (voz) fala.voice = voz;
    fala.onend = () => setFalando(false);
    fala.onerror = () => setFalando(false);
    setFalando(true);
    s.speak(fala);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={falando}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border-2 border-marca bg-cartao px-4 py-2 font-semibold text-marca-forte hover:bg-marca-clara"
    >
      {falando ? <Square size={18} aria-hidden /> : <Volume2 size={20} aria-hidden />}
      {falando ? "Parar leitura" : "Ouvir o resultado"}
    </button>
  );
}
