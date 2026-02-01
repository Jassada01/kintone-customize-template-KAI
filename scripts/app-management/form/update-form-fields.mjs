#!/usr/bin/env node
/**
 * Update form fields of a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/form/update-form-fields.mjs <appId> <fieldsJsonPath>
 *
 * Usage (Programmatic):
 *   import { updateFormFields } from "./update-form-fields.mjs";
 *   await updateFormFields("51", { field_code: { label: "New Label" } });
 *
 * Note: This updates pre-live settings. Use deploy to apply changes.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update form fields of a kintone app
 * @param {string|number} appId - The app ID
 * @param {Object} properties - Field properties to update
 * @param {Object} options
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ revision: string }>}
 */
export async function updateFormFields(appId, properties, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  if (!properties || Object.keys(properties).length === 0) {
    throw new Error("Properties object is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  const fieldCount = Object.keys(properties).length;
  if (!silent) {
    console.log(`\n🔄 Updating ${fieldCount} field(s) in App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  const result = await client.app.updateFormFields({
    app: appId,
    properties
  });

  if (!silent) {
    console.log(`\n✅ Successfully updated fields in App ${appId}`);
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
  const fieldsJsonPath = process.argv[3];

  if (!appId || !fieldsJsonPath) {
    console.error("Error: App ID and fields JSON path are required");
    console.error("Usage: node scripts/app-management/form/update-form-fields.mjs <appId> <fieldsJsonPath>");
    process.exit(1);
  }

  const rootDir = getRootDir(import.meta.url);
  const jsonPath = resolve(rootDir, fieldsJsonPath);

  let properties;
  try {
    const jsonContent = readFileSync(jsonPath, "utf-8");
    const parsed = JSON.parse(jsonContent);
    properties = parsed.properties || parsed;
  } catch (error) {
    console.error(`Error: Failed to read fields JSON from ${fieldsJsonPath}`);
    console.error(error.message);
    process.exit(1);
  }

  updateFormFields(appId, properties).catch((error) => {
    console.error("\n❌ Failed to update form fields");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
