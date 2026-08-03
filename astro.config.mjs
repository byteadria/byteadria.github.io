import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://byteadria.github.io",
  build: {
    inlineStylesheets: "always",
  },
  integrations: [tailwind()],
});
