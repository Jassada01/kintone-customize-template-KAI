#!/usr/bin/env node
/**
 * Delete form fields from a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/form/delete-form-fields.mjs <appId> <fieldCode1> [fieldCode2] ...
 *
 * Usage (Programmatic):
 *   import { deleteFormFields } from "./delete-form-fields.mjs";
 *   await deleteFormFields("51", ["field1", "field2"]);
 *
 * Note: This updates pre-live settings. Use deploy to apply changes.
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Delete form fields from a kintone app
 * @param {string|number} appId - The app ID
 * @param {Array<string>} fields - Array of field codes to delete
 * @param {Object} options
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ revision: string }>}
 */
export async function deleteFormFields(appId, fields, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  if (!fields || fields.length === 0) {
    throw new Error("At least one field code is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Deleting ${fields.length} field(s) from App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Fields: ${fields.join(", ")}`);
  }

  const result = await client.app.deleteFormFields({
    app: appId,
    fields
  });

  if (!silent) {
    console.log(`\n✅ Successfully deleted fields from App ${appId}`);
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
  const args = process.argv.slice(2);
  const appId = args[0];
  const fields = args.slice(1);

  if (!appId || fields.length === 0) {
    console.error("Error: App ID and at least one field code are required");
    console.error("Usage: node scripts/app-management/form/delete-form-fields.mjs <appId> <fieldCode1> [fieldCode2] ...");
    console.error("Example: node scripts/app-management/form/delete-form-fields.mjs 51 old_field unused_field");
    process.exit(1);
  }

  deleteFormFields(appId, fields).catch((error) => {
    console.error("\n❌ Failed to delete form fields");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
