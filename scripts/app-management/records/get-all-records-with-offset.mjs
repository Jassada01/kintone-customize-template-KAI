#!/usr/bin/env node
/**
 * Get all records from a kintone app using offset-based pagination
 *
 * Usage (CLI):
 *   node scripts/app-management/records/get-all-records-with-offset.mjs <appId> [--condition="..."] [--fields=field1,field2] [--orderBy="..."]
 *
 * Usage (Programmatic):
 *   import { getAllRecordsWithOffset } from "./get-all-records-with-offset.mjs";
 *   const records = await getAllRecordsWithOffset("51", { condition: "status = \"Open\"", orderBy: "created_time desc" });
 *
 * WARNING: If the app has over 10,000 records, consider using getAllRecordsWithCursor instead.
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Get all records using offset-based pagination
 * @param {string|number} appId - The app ID
 * @param {Object} [options]
 * @param {string} [options.condition] - Query condition (without order by, limit, offset)
 * @param {string[]} [options.fields] - Field codes to include
 * @param {string} [options.orderBy] - Sort order as query
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object[]>} Array of records
 */
export async function getAllRecordsWithOffset(appId, options = {}) {
  const { condition, fields, orderBy, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching all records (with offset) from App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   ⚠️  Warning: Use cursor method for apps with >10,000 records`);
    if (condition) console.log(`   Condition: ${condition}`);
    if (orderBy) console.log(`   Order by: ${orderBy}`);
  }

  const params = { app: appId };
  if (condition) params.condition = condition;
  if (fields) params.fields = fields;
  if (orderBy) params.orderBy = orderBy;

  const records = await client.record.getAllRecordsWithOffset(params);

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
  const orderByArg = args.find(arg => arg.startsWith("--orderBy="));

  if (!appId) {
    console.error("Error: App ID is required");
    console.error("Usage: node scripts/app-management/records/get-all-records-with-offset.mjs <appId> [--condition=\"...\"] [--fields=field1,field2] [--orderBy=\"...\"]");
    process.exit(1);
  }

  const options = {};
  if (conditionArg) options.condition = conditionArg.replace("--condition=", "");
  if (fieldsArg) options.fields = fieldsArg.replace("--fields=", "").split(",");
  if (orderByArg) options.orderBy = orderByArg.replace("--orderBy=", "");

  getAllRecordsWithOffset(appId, options).catch((error) => {
    console.error("\n❌ Failed to get all records");
    console.error(error.message);
    process.exit(1);
  });
}
