#!/usr/bin/env node
/**
 * Update kintone app settings (name, description, icon, theme, etc.)
 *
 * Usage (CLI):
 *   node scripts/app-management/update-app-settings.mjs <appId> <settingsJsonPath>
 *   node scripts/app-management/update-app-settings.mjs 51 ./settings.json
 *
 * Usage (Programmatic):
 *   import { updateAppSettings } from "./update-app-settings.mjs";
 *   await updateAppSettings("51", { name: "New Name", theme: "BLUE" });
 *
 * JSON file format:
 * {
 *   "name": "App Name",
 *   "description": "<p>App description</p>",
 *   "theme": "BLUE",
 *   "icon": { "type": "PRESET", "key": "APP72" }
 * }
 *
 * Note: This updates pre-live settings. Use deploy-app.mjs to apply changes.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update app settings of a kintone app
 * @param {string|number} appId - The app ID
 * @param {Object} settings - Settings to update
 * @param {string} [settings.name] - App name
 * @param {string} [settings.description] - App description (HTML)
 * @param {Object} [settings.icon] - Icon settings
 * @param {string} [settings.theme] - Color theme (WHITE, RED, BLUE, GREEN, YELLOW, BLACK)
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ revision: string }>}
 */
export async function updateAppSettings(appId, settings, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  if (!settings || Object.keys(settings).length === 0) {
    throw new Error("Settings object is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Updating app settings for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (settings.name) console.log(`   Name: ${settings.name}`);
    if (settings.theme) console.log(`   Theme: ${settings.theme}`);
  }

  const result = await client.app.updateAppSettings({
    app: appId,
    ...settings
  });

  if (!silent) {
    console.log(`\n✅ Successfully updated app settings for App ${appId}`);
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
  const settingsJsonPath = process.argv[3];

  if (!appId || !settingsJsonPath) {
    console.error("Error: App ID and settings JSON path are required");
    console.error("");
    console.error("Usage: node scripts/app-management/update-app-settings.mjs <appId> <settingsJsonPath>");
    console.error("");
    console.error("Examples:");
    console.error("  node scripts/app-management/update-app-settings.mjs 51 ./settings.json");
    console.error("");
    console.error("JSON file format:");
    console.error(`{
  "name": "App Name",
  "description": "<p>Description</p>",
  "theme": "BLUE"
}`);
    process.exit(1);
  }

  const rootDir = getRootDir(import.meta.url);
  const jsonPath = resolve(rootDir, settingsJsonPath);

  let settings;
  try {
    const jsonContent = readFileSync(jsonPath, "utf-8");
    settings = JSON.parse(jsonContent);
  } catch (error) {
    console.error(`Error: Failed to read settings JSON from ${settingsJsonPath}`);
    console.error(error.message);
    process.exit(1);
  }

  updateAppSettings(appId, settings).catch((error) => {
    console.error("\n❌ Failed to update app settings");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
