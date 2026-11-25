import { desc, eq } from "drizzle-orm";
import { schema } from "@/lib/db";
import { exigirUsuario, responderErro } from "@/lib/sessao";

export async function GET(req: Request) {
  try {
    const { db, usuario } = await exigirUsuario(req);
    const itens = await db
      .select({
        id: schema.analises.id,
        tipo: schema.analises.tipo,
        risco: schema.analises.risco,
        titulo: schema.analises.titulo,
        bairro: schema.analises.bairro,
        criadoEm: schema.analises.createdAt,
      })
      .from(schema.analises)
      .where(eq(schema.analises.userId, usuario.id))
      .orderBy(desc(schema.analises.createdAt))
      .limit(100);
    return Response.json({ itens });
  } catch (e) {
    return responderErro(e);
  }
}

/** Apaga todo o historico do usuario (direito de eliminacao, LGPD art. 18, VI). */
export async function DELETE(req: Request) {
  try {
    const { db, usuario } = await exigirUsuario(req);
    await db.delete(schema.analises).where(eq(schema.analises.userId, usuario.id));
    return Response.json({ ok: true });
  } catch (e) {
    return responderErro(e);
  }
}
