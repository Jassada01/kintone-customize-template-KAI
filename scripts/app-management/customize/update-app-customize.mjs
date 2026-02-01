#!/usr/bin/env node
/**
 * Update JavaScript/CSS customization settings of a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/customize/update-app-customize.mjs <appId> <customizeJsonPath>
 *
 * Usage (Programmatic):
 *   import { updateAppCustomize } from "./update-app-customize.mjs";
 *   await updateAppCustomize("51", { scope: "ALL", desktop: { js: [...] } });
 *
 * JSON file format:
 * {
 *   "scope": "ALL",
 *   "desktop": {
 *     "js": [
 *       { "type": "URL", "url": "https://example.com/script.js" },
 *       { "type": "FILE", "file": { "fileKey": "..." } }
 *     ],
 *     "css": [
 *       { "type": "URL", "url": "https://example.com/style.css" }
 *     ]
 *   },
 *   "mobile": {
 *     "js": [],
 *     "css": []
 *   }
 * }
 *
 * Note: This updates pre-live settings. Use deploy to apply changes.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update app customization settings
 * @param {string|number} appId - The app ID
 * @param {Object} customizeSettings - Customization settings
 * @param {string} [customizeSettings.scope] - Scope (ALL, ADMIN, NONE)
 * @param {Object} [customizeSettings.desktop] - Desktop settings
 * @param {Object} [customizeSettings.mobile] - Mobile settings
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ revision: string }>}
 */
export async function updateAppCustomize(appId, customizeSettings, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  if (!customizeSettings || Object.keys(customizeSettings).length === 0) {
    throw new Error("Customize settings object is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Updating customization settings for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (customizeSettings.scope) console.log(`   Scope: ${customizeSettings.scope}`);
  }

  const result = await client.app.updateAppCustomize({
    app: appId,
    ...customizeSettings
  });

  if (!silent) {
    console.log(`\n✅ Successfully updated customization settings for App ${appId}`);
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
  const customizeJsonPath = process.argv[3];

  if (!appId || !customizeJsonPath) {
    console.error("Error: App ID and customize JSON path are required");
    console.error("Usage: node scripts/app-management/customize/update-app-customize.mjs <appId> <customizeJsonPath>");
    process.exit(1);
  }

  const rootDir = getRootDir(import.meta.url);
  const jsonPath = resolve(rootDir, customizeJsonPath);

  let customizeSettings;
  try {
    const jsonContent = readFileSync(jsonPath, "utf-8");
    customizeSettings = JSON.parse(jsonContent);
  } catch (error) {
    console.error(`Error: Failed to read customize JSON from ${customizeJsonPath}`);
    console.error(error.message);
    process.exit(1);
  }

  updateAppCustomize(appId, customizeSettings).catch((error) => {
    console.error("\n❌ Failed to update app customization");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
