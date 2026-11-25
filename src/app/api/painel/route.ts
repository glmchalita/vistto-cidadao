import { schema } from "@/lib/db";
import { exigirUsuario, responderErro } from "@/lib/sessao";

// Painel agregado e anonimo: conta analises por tipo, risco, sinal, bairro e mes.
// Nenhum dado pessoal sai daqui, apenas totais.
export async function GET(req: Request) {
  try {
    const { db } = await exigirUsuario(req);
    const linhas = await db
      .select({
        tipo: schema.analises.tipo,
        risco: schema.analises.risco,
        bairro: schema.analises.bairro,
        sinais: schema.analises.sinais,
        demo: schema.analises.demo,
        criadoEm: schema.analises.createdAt,
      })
      .from(schema.analises);

    const conta = (m: Map<string, number>, k: string, n = 1) => m.set(k, (m.get(k) ?? 0) + n);
    const porRisco = new Map<string, number>();
    const porSinal = new Map<string, number>();
    const porTipo = new Map<string, { total: number; vermelho: number }>();
    const porBairro = new Map<string, { total: number; alertas: number }>();
    const porMes = new Map<string, { total: number; vermelho: number; amarelo: number; verde: number }>();
    let demo = 0;

    for (const l of linhas) {
      if (l.demo) demo++;
      conta(porRisco, l.risco);
      for (const s of l.sinais ?? []) conta(porSinal, s);
      const t = porTipo.get(l.tipo) ?? { total: 0, vermelho: 0 };
      t.total++;
      if (l.risco === "vermelho") t.vermelho++;
      porTipo.set(l.tipo, t);
      if (l.bairro) {
        const b = porBairro.get(l.bairro) ?? { total: 0, alertas: 0 };
        b.total++;
        if (l.risco !== "verde") b.alertas++;
        porBairro.set(l.bairro, b);
      }
      const mes = new Date(l.criadoEm).toISOString().slice(0, 7);
      const m = porMes.get(mes) ?? { total: 0, vermelho: 0, amarelo: 0, verde: 0 };
      m.total++;
      m[l.risco as "vermelho" | "amarelo" | "verde"]++;
      porMes.set(mes, m);
    }

    return Response.json({
      total: linhas.length,
      demo,
      reais: linhas.length - demo,
      porRisco: Object.fromEntries(porRisco),
      porSinal: [...porSinal].map(([sinal, n]) => ({ sinal, n })).sort((a, b) => b.n - a.n),
      porTipo: [...porTipo].map(([tipo, v]) => ({ tipo, ...v })).sort((a, b) => b.total - a.total),
      porBairro: [...porBairro].map(([bairro, v]) => ({ bairro, ...v })).sort((a, b) => b.alertas - a.alertas),
      porMes: [...porMes].map(([mes, v]) => ({ mes, ...v })).sort((a, b) => a.mes.localeCompare(b.mes)),
    });
  } catch (e) {
    return responderErro(e);
  }
}
