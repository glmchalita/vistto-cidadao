import { z } from "zod";
import { acharBairro, compararPreco } from "@/lib/aluguel";
import { schema } from "@/lib/db";
import { lerCorpo, novoId } from "@/lib/entrada";
import { ErroHttp, exigirUsuario, responderErro } from "@/lib/sessao";

const Corpo = z.object({
  bairro: z.string().min(1),
  area: z.number().min(10).max(500),
  valor: z.number().min(100).max(100000),
  renda: z.number().min(0).max(1000000).optional(),
});

export async function POST(req: Request) {
  try {
    const { db, usuario } = await exigirUsuario(req);
    const c = await lerCorpo(req, Corpo);
    const b = acharBairro(c.bairro);
    if (!b) throw new ErroHttp(400, "Ainda não temos dados desse bairro.");

    const resultado = compararPreco(b, c.area, c.valor, c.renda || undefined);
    const id = novoId();
    await db.insert(schema.analises).values({
      id,
      userId: usuario.id,
      tipo: "preco",
      risco: resultado.risco,
      titulo: `Preço comparado em ${b.bairro}`,
      bairro: b.bairro,
      sinais: resultado.sinais,
      // A renda informada nao e gravada: so o percentual calculado.
      resultado: { ...resultado, renda: null, aluguelMaximoPelaRenda: null },
    });
    return Response.json({ id, tipo: "preco", resultado });
  } catch (e) {
    return responderErro(e);
  }
}
