#!/usr/bin/env node
/**
 * Update kintone app process management settings
 *
 * Usage (CLI):
 *   node scripts/app-management/update-process-management.mjs <appId> <processJsonPath>
 *   node scripts/app-management/update-process-management.mjs 51 ./process.json
 *
 * Usage (Programmatic):
 *   import { updateProcessManagement } from "./update-process-management.mjs";
 *   await updateProcessManagement("51", { enable: true, states: {...}, actions: [...] });
 *
 * JSON file format:
 * {
 *   "enable": true,
 *   "states": {
 *     "未着手": { "name": "未着手", "index": "0" },
 *     "進行中": { "name": "進行中", "index": "1" },
 *     "完了": { "name": "完了", "index": "2" }
 *   },
 *   "actions": [
 *     { "name": "開始", "from": "未着手", "to": "進行中" },
 *     { "name": "完了", "from": "進行中", "to": "完了" }
 *   ]
 * }
 *
 * Note: This updates pre-live settings. Use deploy-app.mjs to apply changes.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update process management settings of a kintone app
 * @param {string|number} appId - The app ID
 * @param {Object} processSettings - Process management settings
 * @param {boolean} [processSettings.enable] - Whether to enable process management
 * @param {Object} [processSettings.states] - Status definitions
 * @param {Array} [processSettings.actions] - Action definitions
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ revision: string }>}
 */
export async function updateProcessManagement(appId, processSettings, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  if (!processSettings || Object.keys(processSettings).length === 0) {
    throw new Error("Process settings object is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Updating process management settings for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (processSettings.enable !== undefined) {
      console.log(`   Enable: ${processSettings.enable}`);
    }
    if (processSettings.states) {
      console.log(`   States: ${Object.keys(processSettings.states).length}`);
    }
    if (processSettings.actions) {
      console.log(`   Actions: ${processSettings.actions.length}`);
    }
  }

  const result = await client.app.updateProcessManagement({
    app: appId,
    ...processSettings
  });

  if (!silent) {
    console.log(`\n✅ Successfully updated process management settings for App ${appId}`);
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
  const processJsonPath = process.argv[3];

  if (!appId || !processJsonPath) {
    console.error("Error: App ID and process JSON path are required");
    console.error("");
    console.error("Usage: node scripts/app-management/update-process-management.mjs <appId> <processJsonPath>");
    console.error("");
    console.error("Examples:");
    console.error("  node scripts/app-management/update-process-management.mjs 51 ./process.json");
    console.error("");
    console.error("JSON file format:");
    console.error(`{
  "enable": true,
  "states": {
    "未着手": { "name": "未着手", "index": "0" },
    "進行中": { "name": "進行中", "index": "1" }
  },
  "actions": [
    { "name": "開始", "from": "未着手", "to": "進行中" }
  ]
}`);
    process.exit(1);
  }

  const rootDir = getRootDir(import.meta.url);
  const jsonPath = resolve(rootDir, processJsonPath);

  let processSettings;
  try {
    const jsonContent = readFileSync(jsonPath, "utf-8");
    processSettings = JSON.parse(jsonContent);
  } catch (error) {
    console.error(`Error: Failed to read process JSON from ${processJsonPath}`);
    console.error(error.message);
    process.exit(1);
  }

  updateProcessManagement(appId, processSettings).catch((error) => {
    console.error("\n❌ Failed to update process management settings");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
