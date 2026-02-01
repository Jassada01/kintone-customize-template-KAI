#!/usr/bin/env node
/**
 * Update app permissions of a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/acl/update-app-acl.mjs <appId> <aclJsonPath>
 *
 * Usage (Programmatic):
 *   import { updateAppAcl } from "./update-app-acl.mjs";
 *   await updateAppAcl("51", { rights: [...] });
 *
 * JSON file format:
 * {
 *   "rights": [
 *     {
 *       "entity": { "type": "USER", "code": "user1" },
 *       "appEditable": true,
 *       "recordViewable": true,
 *       "recordAddable": true,
 *       "recordEditable": true,
 *       "recordDeletable": true
 *     },
 *     {
 *       "entity": { "type": "GROUP", "code": "everyone" },
 *       "recordViewable": true
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
 * Update app permissions
 * @param {string|number} appId - The app ID
 * @param {Object} aclSettings - ACL settings
 * @param {Array} aclSettings.rights - Rights array
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ revision: string }>}
 */
export async function updateAppAcl(appId, aclSettings, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const rights = aclSettings.rights || aclSettings;
  if (!rights || !Array.isArray(rights)) {
    throw new Error("Rights array is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Updating app permissions for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Permission entries: ${rights.length}`);
  }

  const result = await client.app.updateAppAcl({
    app: appId,
    rights
  });

  if (!silent) {
    console.log(`\n✅ Successfully updated app permissions for App ${appId}`);
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
  const aclJsonPath = process.argv[3];

  if (!appId || !aclJsonPath) {
    console.error("Error: App ID and ACL JSON path are required");
    console.error("Usage: node scripts/app-management/acl/update-app-acl.mjs <appId> <aclJsonPath>");
    process.exit(1);
  }

  const rootDir = getRootDir(import.meta.url);
  const jsonPath = resolve(rootDir, aclJsonPath);

  let aclSettings;
  try {
    const jsonContent = readFileSync(jsonPath, "utf-8");
    aclSettings = JSON.parse(jsonContent);
  } catch (error) {
    console.error(`Error: Failed to read ACL JSON from ${aclJsonPath}`);
    console.error(error.message);
    process.exit(1);
  }

  updateAppAcl(appId, aclSettings).catch((error) => {
    console.error("\n❌ Failed to update app permissions");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
