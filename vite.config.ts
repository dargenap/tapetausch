import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import pkg from "./package.json" with { type: "json" };
import changelog from "./src/changelog.json" with { type: "json" };

// Version und Changelog müssen zusammenpassen, sonst fehlt den Nutzern der Eintrag zur neuen Version.
if (changelog[0]?.version !== pkg.version) {
  throw new Error(
    `Oben in src/changelog.json fehlt der Eintrag für Version ${pkg.version} (dort steht ${changelog[0]?.version}).`,
  );
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
});
