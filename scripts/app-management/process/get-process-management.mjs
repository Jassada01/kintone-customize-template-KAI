#!/usr/bin/env node
/**
 * Get kintone app process management settings
 *
 * Usage (CLI):
 *   node scripts/app-management/get-process-management.mjs <appId> [--preview]
 *   node scripts/app-management/get-process-management.mjs 51
 *   node scripts/app-management/get-process-management.mjs 51 --preview
 *
 * Usage (Programmatic):
 *   import { getProcessManagement } from "./get-process-management.mjs";
 *   const process = await getProcessManagement("51");
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Get process management settings of a kintone app
 * @param {string|number} appId - The app ID
 * @param {Object} options
 * @param {boolean} [options.preview=false] - Whether to get pre-live settings
 * @param {string} [options.lang] - Localized language (default, en, zh, ja, user)
 * @param {boolean} [options.saveToFile=true] - Whether to save result to JSON file
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ enable: boolean, states: Object, actions: Array, revision: string }>}
 */
export async function getProcessManagement(appId, options = {}) {
  const { preview = false, lang, saveToFile = true, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);
  const rootDir = getRootDir(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching process management settings for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (preview) console.log(`   Mode: Preview (pre-live)`);
  }

  const params = { app: appId };
  if (preview) params.preview = true;
  if (lang) params.lang = lang;

  const processManagement = await client.app.getProcessManagement(params);

  if (!silent) {
    console.log(`   Enabled: ${processManagement.enable}`);
    if (processManagement.states) {
      const stateCount = Object.keys(processManagement.states).length;
      console.log(`   States: ${stateCount}`);
    }
    if (processManagement.actions) {
      console.log(`   Actions: ${processManagement.actions.length}`);
    }
  }

  if (saveToFile) {
    const outputDir = resolve(rootDir, "kintone-app-structure");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const suffix = preview ? "_preview" : "";
    const jsonOutputPath = resolve(outputDir, `app_${appId}_processManagement${suffix}.json`);
    writeFileSync(jsonOutputPath, JSON.stringify(processManagement, null, 2), "utf-8");

    if (!silent) {
      console.log(`\n✅ Successfully generated kintone-app-structure/app_${appId}_processManagement${suffix}.json`);
    }
  }

  return processManagement;
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
    console.error("Usage: node scripts/app-management/get-process-management.mjs <appId> [--preview]");
    console.error("");
    console.error("Examples:");
    console.error("  node scripts/app-management/get-process-management.mjs 51");
    console.error("  node scripts/app-management/get-process-management.mjs 51 --preview");
    process.exit(1);
  }

  getProcessManagement(appId, { preview }).catch((error) => {
    console.error("\n❌ Failed to get process management settings");
    console.error(error.message);
    process.exit(1);
  });
}
