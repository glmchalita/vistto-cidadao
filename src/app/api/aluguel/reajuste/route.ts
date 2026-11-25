import { z } from "zod";
import { acumulado12Meses, buscarSerie } from "@/lib/bcb";
import { schema } from "@/lib/db";
import { lerCorpo, novoId } from "@/lib/entrada";
import { ErroHttp, exigirUsuario, responderErro } from "@/lib/sessao";
import type { Risco } from "@/lib/tipos";

const Corpo = z.object({
  indice: z.enum(["IGP-M", "IPCA"]),
  valorAtual: z.number().min(100).max(100000),
  mesReajuste: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  valorCobrado: z.number().min(0).max(200000).optional(),
});

export async function POST(req: Request) {
  try {
    const { db, usuario } = await exigirUsuario(req);
    const c = await lerCorpo(req, Corpo);

    const serie = await buscarSerie(c.indice);
    const ac = acumulado12Meses(serie.pontos, c.mesReajuste);
    if (!ac.ok) {
      throw new ErroHttp(
        400,
        `O índice ${c.indice} ainda não foi divulgado para todos os meses desse período (falta ${ac.faltando.join(", ")}). Escolha um mês de reajuste anterior.`,
      );
    }

    // Indice negativo: a pratica de mercado e manter o valor, nao reduzir.
    const percentualAplicado = Math.max(ac.percentual, 0);
    const valorCorreto = c.valorAtual * (1 + percentualAplicado / 100);
    const cobrado = c.valorCobrado && c.valorCobrado > 0 ? c.valorCobrado : null;
    const excesso = cobrado !== null ? cobrado - valorCorreto : null;

    let risco: Risco = "verde";
    const sinais: string[] = [];
    if (excesso !== null && excesso > Math.max(1, valorCorreto * 0.005)) {
      sinais.push("reajuste_acima_indice");
      risco = excesso > valorCorreto * 0.05 ? "vermelho" : "amarelo";
    }

    const resultado = {
      indice: c.indice,
      mesReajuste: c.mesReajuste,
      valorAtual: c.valorAtual,
      percentual: ac.percentual,
      percentualAplicado,
      valorCorreto,
      valorCobrado: cobrado,
      excesso,
      excessoAnual: excesso !== null && excesso > 0 ? excesso * 12 : null,
      meses: ac.meses,
      fonte: serie.fonte,
      coletadoEm: serie.coletadoEm ?? null,
      risco,
    };

    const id = novoId();
    await db.insert(schema.analises).values({
      id,
      userId: usuario.id,
      tipo: "reajuste",
      risco,
      titulo: `Reajuste conferido pelo ${c.indice}`,
      bairro: null,
      sinais,
      resultado,
    });
    return Response.json({ id, tipo: "reajuste", resultado });
  } catch (e) {
    return responderErro(e);
  }
}
