/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgrPlugin from "vite-plugin-svgr";
import viteTsconfigPaths from "vite-tsconfig-paths";
import type { UserConfig as VitestUserConfigInterface } from "vitest/config";
import constants from "../constants/constants.json";

const vitestConfig: VitestUserConfigInterface = {
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
  server: {
    host: constants.DEFAULT_HOST,
    port: constants.DEV_MODE_FRONTEND_PORT,
    open: true,
  },
  preview: {
    port: constants.DEV_MODE_FRONTEND_PORT,
  },
  test: vitestConfig.test,
});
