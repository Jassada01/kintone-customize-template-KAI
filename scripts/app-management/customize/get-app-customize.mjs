#!/usr/bin/env node
/**
 * Get JavaScript/CSS customization settings of a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/customize/get-app-customize.mjs <appId> [--preview]
 *
 * Usage (Programmatic):
 *   import { getAppCustomize } from "./get-app-customize.mjs";
 *   const customize = await getAppCustomize("51");
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Get app customization settings
 * @param {string|number} appId - The app ID
 * @param {Object} options
 * @param {boolean} [options.preview=false] - Whether to get pre-live settings
 * @param {boolean} [options.saveToFile=true] - Whether to save result to JSON file
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object>} Customization settings
 */
export async function getAppCustomize(appId, options = {}) {
  const { preview = false, saveToFile = true, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);
  const rootDir = getRootDir(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching customization settings for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (preview) console.log(`   Mode: Preview (pre-live)`);
  }

  const params = { app: appId };
  if (preview) params.preview = true;

  const customize = await client.app.getAppCustomize(params);

  if (!silent) {
    console.log(`   Scope: ${customize.scope}`);
    console.log(`   Desktop JS: ${customize.desktop?.js?.length || 0} file(s)`);
    console.log(`   Desktop CSS: ${customize.desktop?.css?.length || 0} file(s)`);
    console.log(`   Mobile JS: ${customize.mobile?.js?.length || 0} file(s)`);
    console.log(`   Mobile CSS: ${customize.mobile?.css?.length || 0} file(s)`);
  }

  if (saveToFile) {
    const outputDir = resolve(rootDir, "kintone-app-structure");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const suffix = preview ? "_preview" : "";
    const jsonOutputPath = resolve(outputDir, `app_${appId}_customize${suffix}.json`);
    writeFileSync(jsonOutputPath, JSON.stringify(customize, null, 2), "utf-8");

    if (!silent) {
      console.log(`\n✅ Successfully generated kintone-app-structure/app_${appId}_customize${suffix}.json`);
    }
  }

  return customize;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const appId = args.find((arg) => !arg.startsWith("--"));
  const preview = args.includes("--preview");

  if (!appId) {
    console.error("Error: App ID is required");
    console.error("Usage: node scripts/app-management/customize/get-app-customize.mjs <appId> [--preview]");
    process.exit(1);
  }

  getAppCustomize(appId, { preview }).catch((error) => {
    console.error("\n❌ Failed to get app customization");
    console.error(error.message);
    process.exit(1);
  });
}
