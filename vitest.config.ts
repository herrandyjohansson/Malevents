import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${here("./src")}/` },
      // Adapters import "server-only", which throws outside a React Server build.
      { find: /^server-only$/, replacement: here("./node_modules/server-only/empty.js") },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "benchmarks/**/*.test.ts"],
  },
});
