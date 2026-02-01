#!/usr/bin/env node
/**
 * Get a single kintone app information
 *
 * Usage (CLI):
 *   node scripts/app-management/app/get-app.mjs <appId>
 *
 * Usage (Programmatic):
 *   import { getApp } from "./get-app.mjs";
 *   const app = await getApp("51");
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Get a single kintone app
 * @param {string|number} appId - The app ID
 * @param {Object} options
 * @param {boolean} [options.saveToFile=true] - Whether to save result to JSON file
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object>} App information
 */
export async function getApp(appId, options = {}) {
  const { saveToFile = true, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);
  const rootDir = getRootDir(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching app ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  const app = await client.app.getApp({ id: appId });

  if (!silent) {
    console.log(`   Name: ${app.name}`);
    console.log(`   Created: ${app.createdAt}`);
  }

  if (saveToFile) {
    const outputDir = resolve(rootDir, "kintone-app-structure");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const jsonOutputPath = resolve(outputDir, `app_${appId}_info.json`);
    writeFileSync(jsonOutputPath, JSON.stringify(app, null, 2), "utf-8");

    if (!silent) {
      console.log(`\n✅ Successfully generated kintone-app-structure/app_${appId}_info.json`);
    }
  }

  return app;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appId = process.argv[2];

  if (!appId) {
    console.error("Error: App ID is required");
    console.error("Usage: node scripts/app-management/app/get-app.mjs <appId>");
    process.exit(1);
  }

  getApp(appId).catch((error) => {
    console.error("\n❌ Failed to get app");
    console.error(error.message);
    process.exit(1);
  });
}
