import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://byteadria.github.io",
  build: {
    inlineStylesheets: "always",
  },
  integrations: [tailwind(), sitemap()],
});
