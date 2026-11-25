import { auth } from "./auth";
import { getDb } from "./db";

export class ErroHttp extends Error {
  constructor(
    public status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

/** Garante banco pronto e usuario autenticado; devolve ambos. */
export async function exigirUsuario(req: Request) {
  const db = await getDb();
  const sessao = await auth.api.getSession({ headers: req.headers });
  if (!sessao) throw new ErroHttp(401, "Faça login para continuar.");
  return { db, usuario: sessao.user };
}

export function responderErro(e: unknown) {
  if (e instanceof ErroHttp) return Response.json({ erro: e.message }, { status: e.status });
  console.error(e);
  return Response.json(
    { erro: "Algo deu errado do nosso lado. Tente de novo em instantes." },
    { status: 500 },
  );
}
