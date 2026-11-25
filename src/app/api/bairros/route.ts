import { BAIRROS } from "@/lib/aluguel";

export async function GET() {
  return Response.json({ bairros: BAIRROS });
}
