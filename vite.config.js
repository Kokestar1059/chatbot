import { defineConfig } from "vite";

// 最小構成。ルート直下の index.html をエントリにする。
export default defineConfig({
  server: {
    port: 5173,
  },
});
