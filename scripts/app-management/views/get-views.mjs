#!/usr/bin/env node
/**
 * Get view settings of a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/views/get-views.mjs <appId> [--preview]
 *
 * Usage (Programmatic):
 *   import { getViews } from "./get-views.mjs";
 *   const views = await getViews("51");
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Get view settings of a kintone app
 * @param {string|number} appId - The app ID
 * @param {Object} options
 * @param {boolean} [options.preview=false] - Whether to get pre-live settings
 * @param {string} [options.lang] - Localized language
 * @param {boolean} [options.saveToFile=true] - Whether to save result to JSON file
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ views: Object, revision: string }>}
 */
export async function getViews(appId, options = {}) {
  const { preview = false, lang, saveToFile = true, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);
  const rootDir = getRootDir(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching views for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (preview) console.log(`   Mode: Preview (pre-live)`);
  }

  const params = { app: appId };
  if (preview) params.preview = true;
  if (lang) params.lang = lang;

  const result = await client.app.getViews(params);

  if (!silent) {
    const viewCount = Object.keys(result.views).length;
    console.log(`   Views: ${viewCount}`);
    Object.entries(result.views).forEach(([name, view]) => {
      console.log(`     - ${name} (${view.type})`);
    });
  }

  if (saveToFile) {
    const outputDir = resolve(rootDir, "kintone-app-structure");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const suffix = preview ? "_preview" : "";
    const jsonOutputPath = resolve(outputDir, `app_${appId}_views${suffix}.json`);
    writeFileSync(jsonOutputPath, JSON.stringify(result, null, 2), "utf-8");

    if (!silent) {
      console.log(`\n✅ Successfully generated kintone-app-structure/app_${appId}_views${suffix}.json`);
    }
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const appId = args.find((arg) => !arg.startsWith("--"));
  const preview = args.includes("--preview");

  if (!appId) {
    console.error("Error: App ID is required");
    console.error("Usage: node scripts/app-management/views/get-views.mjs <appId> [--preview]");
    process.exit(1);
  }

  getViews(appId, { preview }).catch((error) => {
    console.error("\n❌ Failed to get views");
    console.error(error.message);
    process.exit(1);
  });
}
