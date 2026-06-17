import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 15000,
  retries: 1,
  use: {
    baseURL: "http://localhost:4321",
    browserName: "chromium",
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    port: 4321,
    timeout: 30000,
    reuseExistingServer: true,
  },
});
