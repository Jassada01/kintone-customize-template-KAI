#!/usr/bin/env node
/**
 * Get all records from a kintone app using ID-based pagination
 *
 * Usage (CLI):
 *   node scripts/app-management/records/get-all-records-with-id.mjs <appId> [--condition="..."] [--fields=field1,field2]
 *
 * Usage (Programmatic):
 *   import { getAllRecordsWithId } from "./get-all-records-with-id.mjs";
 *   const records = await getAllRecordsWithId("51", { condition: "status = \"Open\"" });
 *
 * Note: Records are returned sorted by ID in ascending order.
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Get all records using ID-based pagination
 * @param {string|number} appId - The app ID
 * @param {Object} [options]
 * @param {string} [options.condition] - Query condition (without order by, limit, offset)
 * @param {string[]} [options.fields] - Field codes to include
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object[]>} Array of records sorted by ID ascending
 */
export async function getAllRecordsWithId(appId, options = {}) {
  const { condition, fields, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching all records (by ID) from App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (condition) console.log(`   Condition: ${condition}`);
  }

  const params = { app: appId };
  if (condition) params.condition = condition;
  if (fields) params.fields = fields;

  const records = await client.record.getAllRecordsWithId(params);

  if (!silent) {
    console.log(`\n✅ Successfully fetched ${records.length} record(s)`);
  }

  return records;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const appId = args.find(arg => !arg.startsWith("--"));
  const conditionArg = args.find(arg => arg.startsWith("--condition="));
  const fieldsArg = args.find(arg => arg.startsWith("--fields="));

  if (!appId) {
    console.error("Error: App ID is required");
    console.error("Usage: node scripts/app-management/records/get-all-records-with-id.mjs <appId> [--condition=\"...\"] [--fields=field1,field2]");
    process.exit(1);
  }

  const options = {};
  if (conditionArg) options.condition = conditionArg.replace("--condition=", "");
  if (fieldsArg) options.fields = fieldsArg.replace("--fields=", "").split(",");

  getAllRecordsWithId(appId, options).catch((error) => {
    console.error("\n❌ Failed to get all records");
    console.error(error.message);
    process.exit(1);
  });
}
