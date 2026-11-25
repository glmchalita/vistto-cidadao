import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

const h = toNextJsHandler(auth);

export async function GET(req: Request) {
  await getDb();
  return h.GET(req);
}

export async function POST(req: Request) {
  await getDb();
  return h.POST(req);
}
