#!/usr/bin/env node
/**
 * Get kintone app form layout and save to JSON
 *
 * Usage (CLI):
 *   node scripts/app-management/get-form-layout.mjs <appId>
 *   node scripts/app-management/get-form-layout.mjs 51
 *
 * Usage (Programmatic):
 *   import { getFormLayout } from "./get-form-layout.mjs";
 *   const layout = await getFormLayout("51");
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Get form layout of a kintone app
 * @param {string|number} appId - The app ID
 * @param {Object} options
 * @param {boolean} [options.saveToFile=true] - Whether to save result to JSON file
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ layout: Array, revision: string }>}
 */
export async function getFormLayout(appId, options = {}) {
  const { saveToFile = true, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);
  const rootDir = getRootDir(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching form layout for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  const formLayout = await client.app.getFormLayout({ app: appId });

  if (saveToFile) {
    const outputDir = resolve(rootDir, "kintone-app-structure");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const jsonOutputPath = resolve(outputDir, `app_${appId}_formLayout.json`);
    writeFileSync(jsonOutputPath, JSON.stringify(formLayout, null, 2), "utf-8");

    if (!silent) {
      console.log(`\n✅ Successfully generated kintone-app-structure/app_${appId}_formLayout.json`);
    }
  }

  return formLayout;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appId = process.argv[2];

  if (!appId) {
    console.error("Error: App ID is required");
    console.error("Usage: node scripts/app-management/get-form-layout.mjs <appId>");
    console.error("Example: node scripts/app-management/get-form-layout.mjs 51");
    process.exit(1);
  }

  getFormLayout(appId).catch((error) => {
    console.error("\n❌ Failed to fetch form layout");
    console.error(error.message);
    process.exit(1);
  });
}
