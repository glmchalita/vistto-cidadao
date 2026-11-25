import { z } from "zod";
import { analisarContrato } from "@/lib/claude";
import { schema } from "@/lib/db";
import { ArquivoSchema, lerCorpo, novoId } from "@/lib/entrada";
import { conferirHis, IDS_FAIXA, valorEmReais, type FaixaId } from "@/lib/his";
import type { Risco } from "@/lib/tipos";
import { exigirUsuario, responderErro } from "@/lib/sessao";

export const maxDuration = 180;

const Corpo = z.object({
  arquivos: z.array(ArquivoSchema).min(1).max(8),
  bairro: z.string().max(60).optional(),
  observacao: z.string().max(500).optional(),
  faixaHis: z.enum(IDS_FAIXA).optional(),
  consentimento: z.literal(true),
});

export async function POST(req: Request) {
  try {
    const { db, usuario } = await exigirUsuario(req);
    const c = await lerCorpo(req, Corpo);

    const ia = await analisarContrato(c.arquivos, c.observacao, c.faixaHis);
    const sinais = ia.clausulas.some((x) => x.avaliacao === "abusiva") ? ["clausula_abusiva"] : [];

    // HIS/HMP: a IA identifica a classificacao no documento; o teto e calculado por codigo.
    const lida = ia.habitacao_social.classificacao;
    const faixaHis: FaixaId | null =
      c.faixaHis ?? (lida === "HIS-1" || lida === "HIS-2" || lida === "HMP" ? lida : null);
    const his = faixaHis ? conferirHis(faixaHis, valorEmReais(ia.dados_principais.valor_aluguel) ?? undefined) : null;
    let risco: Risco = ia.risco;
    if (his?.acimaDoTeto) {
      risco = "vermelho";
      sinais.push("aluguel_acima_teto_his");
    }
    const resultado = { ...ia, risco, his, faixaHisInformada: c.faixaHis ?? null };

    const id = novoId();
    await db.insert(schema.analises).values({
      id,
      userId: usuario.id,
      tipo: "contrato",
      risco,
      titulo: "Contrato analisado",
      bairro: c.bairro || null,
      sinais,
      resultado,
    });
    return Response.json({ id, tipo: "contrato", resultado });
  } catch (e) {
    return responderErro(e);
  }
}
