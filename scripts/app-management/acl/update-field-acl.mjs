#!/usr/bin/env node
/**
 * Update field permissions of a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/acl/update-field-acl.mjs <appId> <aclJsonPath>
 *
 * Usage (Programmatic):
 *   import { updateFieldAcl } from "./update-field-acl.mjs";
 *   await updateFieldAcl("51", { rights: [...] });
 *
 * JSON file format:
 * {
 *   "rights": [
 *     {
 *       "code": "field_code",
 *       "entities": [
 *         {
 *           "entity": { "type": "USER", "code": "user1" },
 *           "accessibility": "WRITE"
 *         },
 *         {
 *           "entity": { "type": "GROUP", "code": "everyone" },
 *           "accessibility": "READ"
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * accessibility: "READ", "WRITE", "NONE"
 *
 * Note: This updates pre-live settings. Use deploy to apply changes.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update field permissions
 * @param {string|number} appId - The app ID
 * @param {Object} aclSettings - ACL settings
 * @param {Array} aclSettings.rights - Rights array
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ revision: string }>}
 */
export async function updateFieldAcl(appId, aclSettings, options = {}) {
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
    console.log(`\n🔄 Updating field permissions for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Permission entries: ${rights.length}`);
  }

  const result = await client.app.updateFieldAcl({
    app: appId,
    rights
  });

  if (!silent) {
    console.log(`\n✅ Successfully updated field permissions for App ${appId}`);
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
    console.error("Usage: node scripts/app-management/acl/update-field-acl.mjs <appId> <aclJsonPath>");
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

  updateFieldAcl(appId, aclSettings).catch((error) => {
    console.error("\n❌ Failed to update field permissions");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
