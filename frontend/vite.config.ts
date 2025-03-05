import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgrPlugin from "vite-plugin-svgr";
import viteTsconfigPaths from "vite-tsconfig-paths";
import constants from "../constants/constants.json";

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
});
