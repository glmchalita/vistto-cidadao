import { and, eq } from "drizzle-orm";
import { schema } from "@/lib/db";
import { ErroHttp, exigirUsuario, responderErro } from "@/lib/sessao";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { db, usuario } = await exigirUsuario(req);
    const { id } = await ctx.params;
    const [item] = await db
      .select()
      .from(schema.analises)
      .where(and(eq(schema.analises.id, id), eq(schema.analises.userId, usuario.id)));
    if (!item) throw new ErroHttp(404, "Análise não encontrada.");
    return Response.json({
      id: item.id,
      tipo: item.tipo,
      titulo: item.titulo,
      criadoEm: item.createdAt,
      resultado: item.resultado,
    });
  } catch (e) {
    return responderErro(e);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { db, usuario } = await exigirUsuario(req);
    const { id } = await ctx.params;
    await db.delete(schema.analises).where(and(eq(schema.analises.id, id), eq(schema.analises.userId, usuario.id)));
    return Response.json({ ok: true });
  } catch (e) {
    return responderErro(e);
  }
}
