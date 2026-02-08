import { defineConfig, loadEnv, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { crx, ManifestV3Export } from "@crxjs/vite-plugin";
import chromeManifest from "./public/manifests/manifest.chrome.json";
import firefoxManifest from "./public/manifests/manifest.firefox.json";
import { readFileSync, writeFileSync } from "fs";

const manifestMap = {
  chrome: chromeManifest,
  firefox: firefoxManifest,
};

const postProcessManifest = (target: "chrome" | "firefox"): PluginOption => ({
  name: "post-process-manifest",
  apply: "build",
  enforce: "post",
  writeBundle(options) {
    if (target === "firefox") {
      const manifestPath = resolve(options.dir!, "manifest.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as {
        web_accessible_resources: unknown[];
      };
      if (manifest && Array.isArray(manifest.web_accessible_resources)) {
        for (const resource of manifest.web_accessible_resources) {
          delete (resource as { use_dynamic_url?: boolean }).use_dynamic_url;
        }
      }
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = (env.BUILD_TARGET || "chrome") as "chrome" | "firefox";
  const manifest = manifestMap[target] as ManifestV3Export;

  return {
    plugins: [react(), crx({ manifest }), postProcessManifest(target)],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    build: {
      rollupOptions: {
        input: {
          panel: "index.html",
        },
        output: {
          manualChunks(id) {
            if (
              id.includes("node_modules/@langchain") ||
              id.includes("node_modules/langchain")
            ) {
              return "langchain";
            }
          },
        },
      },
    },
  };
});
