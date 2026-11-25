"use client";

import { Camera, FileText, X } from "lucide-react";
import { useRef, useState } from "react";
import type { ArquivoEnviado } from "@/lib/tipos";

// O limite de corpo de requisicao na Vercel e 4,5 MB. Fotos sao reduzidas no
// proprio aparelho antes do envio, o que tambem economiza o plano de dados.
const LADO_MAXIMO = 1568;
const LIMITE_TOTAL = 3.9 * 1024 * 1024; // em caracteres base64

export type ArquivoPronto = ArquivoEnviado & { nome: string; previa: string | null };

async function reduzirImagem(file: File): Promise<ArquivoPronto> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL("image/jpeg", 0.85);
  return { nome: file.name, media_type: "image/jpeg", data: url.split(",")[1], previa: url };
}

function lerPdf(file: File): Promise<ArquivoPronto> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () =>
      resolve({ nome: file.name, media_type: "application/pdf", data: String(leitor.result).split(",")[1], previa: null });
    leitor.onerror = () => reject(new Error("Não consegui ler o PDF."));
    leitor.readAsDataURL(file);
  });
}

export function EnvioArquivo({
  arquivos,
  aoMudar,
  maximo,
  aceitaPdf = true,
  rotulo,
}: {
  arquivos: ArquivoPronto[];
  aoMudar: (a: ArquivoPronto[]) => void;
  maximo: number;
  aceitaPdf?: boolean;
  rotulo: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState("");

  async function escolher(lista: FileList | null) {
    if (!lista) return;
    setErro("");
    const novos: ArquivoPronto[] = [];
    try {
      for (const f of Array.from(lista)) {
        if (f.type === "application/pdf") {
          if (!aceitaPdf) throw new Error("Aqui só aceitamos fotos ou prints.");
          novos.push(await lerPdf(f));
        } else if (f.type.startsWith("image/")) {
          novos.push(await reduzirImagem(f));
        } else {
          throw new Error("Envie uma foto, um print ou um PDF.");
        }
      }
      const todos = [...arquivos, ...novos].slice(0, maximo);
      const tamanho = todos.reduce((s, a) => s + a.data.length, 0);
      if (tamanho > LIMITE_TOTAL) throw new Error("Os arquivos somam mais de 3 MB. Envie menos páginas ou um PDF menor.");
      aoMudar(todos);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui ler o arquivo.");
    }
    if (ref.current) ref.current.value = "";
  }

  return (
    <div>
      <p className="mb-1 font-semibold">{rotulo}</p>
      <input
        ref={ref}
        type="file"
        accept={aceitaPdf ? "image/*,application/pdf" : "image/*"}
        multiple={maximo > 1}
        className="sr-only"
        id="envio-arquivo"
        onChange={(e) => escolher(e.target.files)}
      />
      <label
        htmlFor="envio-arquivo"
        className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-marca bg-marca-clara p-5 text-center font-semibold text-marca-forte hover:bg-cartao"
      >
        <Camera size={32} aria-hidden />
        <span>Toque para tirar foto ou escolher {aceitaPdf ? "foto ou PDF" : "foto ou print"}</span>
        <span className="text-sm font-normal text-suave">
          {maximo > 1 ? `Até ${maximo} arquivos.` : "Um arquivo."} A foto é reduzida no seu aparelho antes do envio.
        </span>
      </label>

      {erro && (
        <p role="alert" className="mt-2 font-semibold text-vermelho-texto">
          {erro}
        </p>
      )}

      {arquivos.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-3">
          {arquivos.map((a, i) => (
            <li key={i} className="relative flex items-center gap-2 rounded-xl border border-borda bg-cartao p-2 pr-10">
              {a.previa ? (
                // eslint-disable-next-line @next/next/no-img-element -- previa local em data URL, nao passa por otimizacao
                <img src={a.previa} alt={`Prévia de ${a.nome}`} className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <FileText size={40} className="text-marca" aria-hidden />
              )}
              <span className="max-w-40 truncate text-sm">{a.nome}</span>
              <button
                type="button"
                onClick={() => aoMudar(arquivos.filter((_, j) => j !== i))}
                aria-label={`Remover ${a.nome}`}
                className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full hover:bg-vermelho-fundo"
              >
                <X size={18} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Consentimento({ marcado, aoMudar }: { marcado: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-borda bg-cartao p-4">
      <input type="checkbox" checked={marcado} onChange={(e) => aoMudar(e.target.checked)} className="mt-1 h-6 w-6 shrink-0 accent-(--marca)" />
      <span>
        <strong>Concordo em enviar este arquivo para análise por inteligência artificial.</strong> O arquivo não fica guardado:
        ele é lido uma vez e descartado. Só o resultado fica no seu histórico, e você pode apagar quando quiser.
      </span>
    </label>
  );
}
