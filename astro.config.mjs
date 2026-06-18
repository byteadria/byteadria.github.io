import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://byteadria.github.io",
  integrations: [tailwind()],
});
