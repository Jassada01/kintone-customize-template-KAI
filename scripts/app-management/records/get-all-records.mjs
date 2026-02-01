#!/usr/bin/env node
/**
 * Get all records from a kintone app (no limit)
 *
 * Usage (CLI):
 *   node scripts/app-management/records/get-all-records.mjs <appId> [--condition="..."] [--fields=field1,field2] [--orderBy="..."]
 *
 * Usage (Programmatic):
 *   import { getAllRecords } from "./get-all-records.mjs";
 *   const records = await getAllRecords("51", { condition: "status = \"Open\"", orderBy: "created_time desc" });
 *
 * Note: This method can retrieve records exceeding the 500 limit.
 * Uses cursor API internally when orderBy is specified.
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Get all records
 * @param {string|number} appId - The app ID
 * @param {Object} [options]
 * @param {string} [options.condition] - Query condition (without order by, limit, offset)
 * @param {string[]} [options.fields] - Field codes to include
 * @param {string} [options.orderBy] - Sort order as query
 * @param {boolean} [options.withCursor=true] - Whether to use cursor API
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object[]>} Array of records
 */
export async function getAllRecords(appId, options = {}) {
  const { condition, fields, orderBy, withCursor = true, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching all records from App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (condition) console.log(`   Condition: ${condition}`);
    if (orderBy) console.log(`   Order by: ${orderBy}`);
  }

  const params = { app: appId };
  if (condition) params.condition = condition;
  if (fields) params.fields = fields;
  if (orderBy) params.orderBy = orderBy;
  params.withCursor = withCursor;

  const records = await client.record.getAllRecords(params);

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
  const noCursor = args.includes("--noCursor");

  if (!appId) {
    console.error("Error: App ID is required");
    console.error("Usage: node scripts/app-management/records/get-all-records.mjs <appId> [--condition=\"...\"] [--fields=field1,field2] [--orderBy=\"...\"] [--noCursor]");
    process.exit(1);
  }

  const options = { withCursor: !noCursor };
  if (conditionArg) options.condition = conditionArg.replace("--condition=", "");
  if (fieldsArg) options.fields = fieldsArg.replace("--fields=", "").split(",");
  if (orderByArg) options.orderBy = orderByArg.replace("--orderBy=", "");

  getAllRecords(appId, options).catch((error) => {
    console.error("\n❌ Failed to get all records");
    console.error(error.message);
    process.exit(1);
  });
}
