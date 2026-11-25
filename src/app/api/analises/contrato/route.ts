import { z } from "zod";
import { analisarContrato } from "@/lib/claude";
import { schema } from "@/lib/db";
import { ArquivoSchema, lerCorpo, novoId } from "@/lib/entrada";
import { exigirUsuario, responderErro } from "@/lib/sessao";

export const maxDuration = 180;

const Corpo = z.object({
  arquivos: z.array(ArquivoSchema).min(1).max(8),
  bairro: z.string().max(60).optional(),
  observacao: z.string().max(500).optional(),
  consentimento: z.literal(true),
});

export async function POST(req: Request) {
  try {
    const { db, usuario } = await exigirUsuario(req);
    const c = await lerCorpo(req, Corpo);

    const resultado = await analisarContrato(c.arquivos, c.observacao);
    const sinais = resultado.clausulas.some((x) => x.avaliacao === "abusiva") ? ["clausula_abusiva"] : [];

    const id = novoId();
    await db.insert(schema.analises).values({
      id,
      userId: usuario.id,
      tipo: "contrato",
      risco: resultado.risco,
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
