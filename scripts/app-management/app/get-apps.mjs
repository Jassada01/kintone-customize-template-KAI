#!/usr/bin/env node
/**
 * Get all kintone apps and save to JSON
 *
 * Usage (CLI):
 *   node scripts/app-management/get-apps.mjs
 *
 * Usage (Programmatic):
 *   import { getApps } from "./get-apps.mjs";
 *   const apps = await getApps();
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Get all kintone apps
 * @param {Object} options
 * @param {boolean} [options.saveToFile=true] - Whether to save result to JSON file
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ apps: Array }>}
 */
export async function getApps(options = {}) {
  const { saveToFile = true, silent = false } = options;

  const { client, credentials } = await createKintoneClient(import.meta.url);
  const rootDir = getRootDir(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching all apps from ${credentials.domain}...`);
  }

  const apps = await client.app.getApps({});

  if (saveToFile) {
    const outputDir = resolve(rootDir, "kintone-app-structure");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const jsonOutputPath = resolve(outputDir, "apps.json");
    writeFileSync(jsonOutputPath, JSON.stringify(apps, null, 2), "utf-8");

    if (!silent) {
      console.log(`✅ Successfully generated kintone-app-structure/apps.json`);
      console.log(`   Total apps: ${apps.apps.length}`);
    }
  }

  return apps;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  getApps().catch((error) => {
    console.error("\n❌ Failed to fetch apps");
    console.error(error.message);
    process.exit(1);
  });
}
