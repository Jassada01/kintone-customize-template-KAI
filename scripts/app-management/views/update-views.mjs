#!/usr/bin/env node
/**
 * Update view settings of a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/views/update-views.mjs <appId> <viewsJsonPath>
 *
 * Usage (Programmatic):
 *   import { updateViews } from "./update-views.mjs";
 *   await updateViews("51", { views: {...} });
 *
 * JSON file format:
 * {
 *   "views": {
 *     "一覧": {
 *       "type": "LIST",
 *       "name": "一覧",
 *       "fields": ["field1", "field2"],
 *       "filterCond": "",
 *       "sort": "record_id desc",
 *       "index": "0"
 *     },
 *     "カレンダー": {
 *       "type": "CALENDAR",
 *       "name": "カレンダー",
 *       "date": "date_field",
 *       "title": "title_field",
 *       "index": "1"
 *     }
 *   }
 * }
 *
 * Note: This updates pre-live settings. Use deploy to apply changes.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update view settings of a kintone app
 * @param {string|number} appId - The app ID
 * @param {Object} viewsSettings - Views settings
 * @param {Object} viewsSettings.views - Views object
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ revision: string, views: Object }>}
 */
export async function updateViews(appId, viewsSettings, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const views = viewsSettings.views || viewsSettings;
  if (!views || Object.keys(views).length === 0) {
    throw new Error("Views object is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  const viewCount = Object.keys(views).length;
  if (!silent) {
    console.log(`\n🔄 Updating ${viewCount} view(s) for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  const result = await client.app.updateViews({
    app: appId,
    views
  });

  if (!silent) {
    console.log(`\n✅ Successfully updated views for App ${appId}`);
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
  const viewsJsonPath = process.argv[3];

  if (!appId || !viewsJsonPath) {
    console.error("Error: App ID and views JSON path are required");
    console.error("Usage: node scripts/app-management/views/update-views.mjs <appId> <viewsJsonPath>");
    process.exit(1);
  }

  const rootDir = getRootDir(import.meta.url);
  const jsonPath = resolve(rootDir, viewsJsonPath);

  let viewsSettings;
  try {
    const jsonContent = readFileSync(jsonPath, "utf-8");
    viewsSettings = JSON.parse(jsonContent);
  } catch (error) {
    console.error(`Error: Failed to read views JSON from ${viewsJsonPath}`);
    console.error(error.message);
    process.exit(1);
  }

  updateViews(appId, viewsSettings).catch((error) => {
    console.error("\n❌ Failed to update views");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
