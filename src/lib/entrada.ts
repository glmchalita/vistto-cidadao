import { z } from "zod";
import { ErroHttp } from "./sessao";

export const ArquivoSchema = z.object({
  media_type: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  data: z.string().min(100).regex(/^[A-Za-z0-9+/=]+$/),
});

/** Le e valida o corpo JSON; devolve erro 400 com mensagem simples se invalido. */
export async function lerCorpo<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let bruto: unknown;
  try {
    bruto = await req.json();
  } catch {
    throw new ErroHttp(400, "Não recebi os dados. Tente enviar de novo.");
  }
  const r = schema.safeParse(bruto);
  if (!r.success) {
    throw new ErroHttp(400, "Confira os campos preenchidos e tente de novo.");
  }
  return r.data;
}

export function novoId() {
  return crypto.randomUUID();
}
