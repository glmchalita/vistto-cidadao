import { z } from "zod";
import { conferirBoleto } from "@/lib/boleto";
import { analisarGolpe } from "@/lib/claude";
import { schema } from "@/lib/db";
import { ArquivoSchema, lerCorpo, novoId } from "@/lib/entrada";
import { exigirUsuario, responderErro } from "@/lib/sessao";
import { ROTULO_TIPO, TIPOS_GOLPE, type Risco } from "@/lib/tipos";

export const maxDuration = 120;

const Corpo = z.object({
  tipo: z.enum(TIPOS_GOLPE),
  arquivos: z.array(ArquivoSchema).min(1).max(4),
  proprietario: z.string().max(120).optional(),
  valor: z.string().max(40).optional(),
  bairro: z.string().max(60).optional(),
  observacao: z.string().max(500).optional(),
  consentimento: z.literal(true),
});

export async function POST(req: Request) {
  try {
    const { db, usuario } = await exigirUsuario(req);
    const c = await lerCorpo(req, Corpo);

    const ia = await analisarGolpe(c.tipo, c.arquivos, c);

    // Conferencia deterministica do boleto: a IA le os numeros, o codigo valida.
    let boleto = null;
    let risco: Risco = ia.risco;
    const sinais = new Set<string>(ia.sinais.map((s) => s.categoria));
    if (c.tipo === "boleto" && ia.dados_extraidos.linha_digitavel) {
      boleto = conferirBoleto(ia.dados_extraidos.linha_digitavel);
      if (boleto.formato !== "desconhecido" && !boleto.valido) {
        risco = "vermelho";
        sinais.add("boleto_invalido");
      }
    }

    const resultado = { ...ia, risco, boleto };
    const id = novoId();
    await db.insert(schema.analises).values({
      id,
      userId: usuario.id,
      tipo: c.tipo,
      risco,
      titulo: `${ROTULO_TIPO[c.tipo]} analisado`,
      bairro: c.bairro || null,
      sinais: [...sinais],
      resultado,
    });
    // Os arquivos nao sao gravados em lugar nenhum: saem da memoria ao fim da requisicao.
    return Response.json({ id, tipo: c.tipo, resultado });
  } catch (e) {
    return responderErro(e);
  }
}
