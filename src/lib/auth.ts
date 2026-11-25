import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { dbSemEspera, schema } from "./db";

function urlBase() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

const origens = [urlBase(), "http://localhost:3000"];
if (process.env.VERCEL_URL) origens.push(`https://${process.env.VERCEL_URL}`);

export const auth = betterAuth({
  baseURL: urlBase(),
  trustedOrigins: origens,
  database: drizzleAdapter(dbSemEspera(), {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
});
