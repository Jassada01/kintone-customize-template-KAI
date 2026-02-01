#!/usr/bin/env node
/**
 * Get kintone app settings (name, description, icon, theme, etc.)
 *
 * Usage (CLI):
 *   node scripts/app-management/get-app-settings.mjs <appId> [--preview]
 *   node scripts/app-management/get-app-settings.mjs 51
 *   node scripts/app-management/get-app-settings.mjs 51 --preview
 *
 * Usage (Programmatic):
 *   import { getAppSettings } from "./get-app-settings.mjs";
 *   const settings = await getAppSettings("51");
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Get app settings of a kintone app
 * @param {string|number} appId - The app ID
 * @param {Object} options
 * @param {boolean} [options.preview=false] - Whether to get pre-live settings
 * @param {string} [options.lang] - Localized language (default, en, zh, ja, user)
 * @param {boolean} [options.saveToFile=true] - Whether to save result to JSON file
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object>} App settings object
 */
export async function getAppSettings(appId, options = {}) {
  const { preview = false, lang, saveToFile = true, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);
  const rootDir = getRootDir(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching app settings for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (preview) console.log(`   Mode: Preview (pre-live)`);
  }

  const params = { app: appId };
  if (preview) params.preview = true;
  if (lang) params.lang = lang;

  const settings = await client.app.getAppSettings(params);

  if (saveToFile) {
    const outputDir = resolve(rootDir, "kintone-app-structure");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const suffix = preview ? "_preview" : "";
    const jsonOutputPath = resolve(outputDir, `app_${appId}_settings${suffix}.json`);
    writeFileSync(jsonOutputPath, JSON.stringify(settings, null, 2), "utf-8");

    if (!silent) {
      console.log(`\n✅ Successfully generated kintone-app-structure/app_${appId}_settings${suffix}.json`);
    }
  }

  return settings;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const appId = args.find((arg) => !arg.startsWith("--"));
  const preview = args.includes("--preview");

  if (!appId) {
    console.error("Error: App ID is required");
    console.error("");
    console.error("Usage: node scripts/app-management/get-app-settings.mjs <appId> [--preview]");
    console.error("");
    console.error("Examples:");
    console.error("  node scripts/app-management/get-app-settings.mjs 51");
    console.error("  node scripts/app-management/get-app-settings.mjs 51 --preview");
    process.exit(1);
  }

  getAppSettings(appId, { preview }).catch((error) => {
    console.error("\n❌ Failed to get app settings");
    console.error(error.message);
    process.exit(1);
  });
}
