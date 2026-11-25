import { z } from "zod";
import { schema } from "@/lib/db";
import { lerCorpo, novoId } from "@/lib/entrada";
import { conferirHis, IDS_FAIXA } from "@/lib/his";
import { exigirUsuario, responderErro } from "@/lib/sessao";

const Corpo = z.object({
  faixa: z.enum(IDS_FAIXA),
  aluguel: z.number().min(0).max(100000).optional(),
  rendaFamiliar: z.number().min(0).max(1000000).optional(),
  pessoas: z.number().int().min(1).max(20).optional(),
  bairro: z.string().max(60).optional(),
});

export async function POST(req: Request) {
  try {
    const { db, usuario } = await exigirUsuario(req);
    const c = await lerCorpo(req, Corpo);
    const resultado = conferirHis(c.faixa, c.aluguel, c.rendaFamiliar, c.pessoas);

    const id = novoId();
    await db.insert(schema.analises).values({
      id,
      userId: usuario.id,
      tipo: "his",
      risco: resultado.risco,
      titulo: `Teto de aluguel conferido (${resultado.nomeFaixa})`,
      bairro: c.bairro || null,
      sinais: resultado.sinais,
      resultado, // a renda informada nao entra no resultado, so o enquadramento
    });
    return Response.json({ id, tipo: "his", resultado });
  } catch (e) {
    return responderErro(e);
  }
}
