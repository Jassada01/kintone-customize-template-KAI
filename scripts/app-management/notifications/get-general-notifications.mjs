#!/usr/bin/env node
/**
 * Get general notification settings of a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/notifications/get-general-notifications.mjs <appId> [--preview]
 *
 * Usage (Programmatic):
 *   import { getGeneralNotifications } from "./get-general-notifications.mjs";
 *   const notifications = await getGeneralNotifications("51");
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Get general notification settings
 * @param {string|number} appId - The app ID
 * @param {Object} options
 * @param {boolean} [options.preview=false] - Whether to get pre-live settings
 * @param {boolean} [options.saveToFile=true] - Whether to save result to JSON file
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object>}
 */
export async function getGeneralNotifications(appId, options = {}) {
  const { preview = false, saveToFile = true, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);
  const rootDir = getRootDir(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching general notifications for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (preview) console.log(`   Mode: Preview (pre-live)`);
  }

  const params = { app: appId };
  if (preview) params.preview = true;

  const result = await client.app.getGeneralNotifications(params);

  if (!silent) {
    console.log(`   Notification entries: ${result.notifications?.length || 0}`);
  }

  if (saveToFile) {
    const outputDir = resolve(rootDir, "kintone-app-structure");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const suffix = preview ? "_preview" : "";
    const jsonOutputPath = resolve(outputDir, `app_${appId}_generalNotifications${suffix}.json`);
    writeFileSync(jsonOutputPath, JSON.stringify(result, null, 2), "utf-8");

    if (!silent) {
      console.log(`\n✅ Successfully generated kintone-app-structure/app_${appId}_generalNotifications${suffix}.json`);
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
    console.error("Usage: node scripts/app-management/notifications/get-general-notifications.mjs <appId> [--preview]");
    process.exit(1);
  }

  getGeneralNotifications(appId, { preview }).catch((error) => {
    console.error("\n❌ Failed to get general notifications");
    console.error(error.message);
    process.exit(1);
  });
}
