import { count, eq } from "drizzle-orm";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import * as schema from "./schema";
import { gerarSeed } from "./seed";

// Producao (Vercel): Postgres gerenciado na nuvem (Neon), via DATABASE_URL.
// Desenvolvimento sem DATABASE_URL: PGlite, um Postgres embutido que grava em
// ./.pglite, para o projeto rodar com `npm run dev` sem instalar nada.

export type Db = NodePgDatabase<typeof schema>;

type Estado = { db: Db; pronto: Promise<void> };
const g = globalThis as unknown as { __vistto?: Estado };

function criar(): Estado {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  let db: Db;
  let executar: (sqlText: string) => Promise<unknown>;

  if (url) {
    const pool = new Pool({ connectionString: url, max: 3 });
    db = drizzlePg(pool, { schema });
    executar = (s) => pool.query(s);
  } else {
    // Na Vercel sem banco conectado, o unico diretorio gravavel e /tmp: os dados
    // somem quando a instancia e reciclada. Serve so ate o Neon ser conectado.
    const lite = new PGlite(process.env.PGLITE_DIR ?? (process.env.VERCEL ? "/tmp/pglite" : "./.pglite"));
    db = drizzlePglite(lite, { schema }) as unknown as Db;
    executar = (s) => lite.exec(s);
  }

  const pronto = (async () => {
    await executar(schema.SCHEMA_SQL);
    const [{ n }] = await db
      .select({ n: count() })
      .from(schema.analises)
      .where(eq(schema.analises.demo, true));
    if (n === 0) {
      const linhas = gerarSeed();
      for (let i = 0; i < linhas.length; i += 50) {
        await db.insert(schema.analises).values(linhas.slice(i, i + 50)).onConflictDoNothing();
      }
    }
  })();

  return { db, pronto };
}

export async function getDb(): Promise<Db> {
  if (!g.__vistto) g.__vistto = criar();
  try {
    await g.__vistto.pronto;
  } catch (e) {
    g.__vistto = undefined; // permite nova tentativa na proxima requisicao
    throw e;
  }
  return g.__vistto.db;
}

/** Instancia sem aguardar a criacao das tabelas (uso exclusivo do BetterAuth). */
export function dbSemEspera(): Db {
  if (!g.__vistto) g.__vistto = criar();
  return g.__vistto.db;
}

export { schema };
