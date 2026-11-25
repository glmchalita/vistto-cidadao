import { eq } from "drizzle-orm";
import { schema } from "@/lib/db";
import { exigirUsuario, responderErro } from "@/lib/sessao";

/** Exporta os dados do usuario (direito de acesso e portabilidade, LGPD art. 18, II e V). */
export async function GET(req: Request) {
  try {
    const { db, usuario } = await exigirUsuario(req);
    const analises = await db.select().from(schema.analises).where(eq(schema.analises.userId, usuario.id));
    return Response.json({
      conta: { nome: usuario.name, email: usuario.email, criadaEm: usuario.createdAt },
      analises: analises.map((a) => ({
        id: a.id,
        tipo: a.tipo,
        risco: a.risco,
        titulo: a.titulo,
        bairro: a.bairro,
        criadoEm: a.createdAt,
        resultado: a.resultado,
      })),
    });
  } catch (e) {
    return responderErro(e);
  }
}

/** Apaga a conta e tudo ligado a ela (sessoes, credenciais e historico em cascata). */
export async function DELETE(req: Request) {
  try {
    const { db, usuario } = await exigirUsuario(req);
    await db.delete(schema.user).where(eq(schema.user.id, usuario.id));
    return Response.json({ ok: true });
  } catch (e) {
    return responderErro(e);
  }
}
