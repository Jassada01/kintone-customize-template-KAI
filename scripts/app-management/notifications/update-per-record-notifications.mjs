#!/usr/bin/env node
/**
 * Update per-record notification settings of a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/notifications/update-per-record-notifications.mjs <appId> <notificationsJsonPath>
 *
 * Usage (Programmatic):
 *   import { updatePerRecordNotifications } from "./update-per-record-notifications.mjs";
 *   await updatePerRecordNotifications("51", { notifications: [...] });
 *
 * JSON file format:
 * {
 *   "notifications": [
 *     {
 *       "filterCond": "status = \"Open\"",
 *       "title": "Record updated",
 *       "targets": [
 *         {
 *           "entity": { "type": "USER", "code": "user1" },
 *           "includeSubs": false
 *         },
 *         {
 *           "entity": { "type": "FIELD_ENTITY", "code": "assignee_field" },
 *           "includeSubs": false
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * Note: This updates pre-live settings. Use deploy to apply changes.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update per-record notification settings
 * @param {string|number} appId - The app ID
 * @param {Object} notificationSettings - Notification settings
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ revision: string }>}
 */
export async function updatePerRecordNotifications(appId, notificationSettings, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Updating per-record notifications for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (notificationSettings.notifications) {
      console.log(`   Notification entries: ${notificationSettings.notifications.length}`);
    }
  }

  const result = await client.app.updatePerRecordNotifications({
    app: appId,
    ...notificationSettings
  });

  if (!silent) {
    console.log(`\n✅ Successfully updated per-record notifications for App ${appId}`);
    console.log(`   Revision: ${result.revision}`);
    console.log("");
    console.log("📝 Next step:");
    console.log(`   Deploy app: npm run app:deploy ${appId}`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appId = process.argv[2];
  const jsonPath = process.argv[3];

  if (!appId || !jsonPath) {
    console.error("Error: App ID and notifications JSON path are required");
    console.error("Usage: node scripts/app-management/notifications/update-per-record-notifications.mjs <appId> <jsonPath>");
    process.exit(1);
  }

  const rootDir = getRootDir(import.meta.url);
  const fullPath = resolve(rootDir, jsonPath);

  let notificationSettings;
  try {
    const jsonContent = readFileSync(fullPath, "utf-8");
    notificationSettings = JSON.parse(jsonContent);
  } catch (error) {
    console.error(`Error: Failed to read JSON from ${jsonPath}`);
    console.error(error.message);
    process.exit(1);
  }

  updatePerRecordNotifications(appId, notificationSettings).catch((error) => {
    console.error("\n❌ Failed to update per-record notifications");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
