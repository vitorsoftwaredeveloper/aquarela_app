import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Lógica pura → ambiente node (sem jsdom). Testes RTL (.test.tsx) usam
    // `// @vitest-environment jsdom` no topo do arquivo para rodar em jsdom.
    // `describe/it/expect` são importados explicitamente de "vitest" nos testes,
    // então não precisamos de globals nem de mexer no tsconfig/eslint.
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
