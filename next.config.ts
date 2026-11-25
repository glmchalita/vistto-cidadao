import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // PGlite (banco local de desenvolvimento) carrega WASM e nao deve ser empacotado.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
