import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: false,
  entry: {
    main: "electron/main.ts",
    preload: "electron/preload.ts",
  },
  external: ["electron", "better-sqlite3", "drizzle-orm/better-sqlite3"],
  format: ["cjs"],
  outDir: "dist-electron",
  outExtension() {
    return {
      js: ".cjs",
    };
  },
  sourcemap: true,
  splitting: false,
  target: "node22",
});
