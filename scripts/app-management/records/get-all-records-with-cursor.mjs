#!/usr/bin/env node
/**
 * Get all records from a kintone app using cursor API
 *
 * Usage (CLI):
 *   node scripts/app-management/records/get-all-records-with-cursor.mjs <appId> [--query="..."] [--fields=field1,field2]
 *
 * Usage (Programmatic):
 *   import { getAllRecordsWithCursor } from "./get-all-records-with-cursor.mjs";
 *   const records = await getAllRecordsWithCursor("51", { query: "status = \"Open\" order by created_time desc" });
 *
 * Note: This is the recommended method for apps with many records.
 * Handles cursor creation and deletion automatically.
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Get all records using cursor API
 * @param {string|number} appId - The app ID
 * @param {Object} [options]
 * @param {string} [options.query] - Query string (can include order by)
 * @param {string[]} [options.fields] - Field codes to include
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object[]>} Array of records
 */
export async function getAllRecordsWithCursor(appId, options = {}) {
  const { query, fields, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching all records (with cursor) from App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (query) console.log(`   Query: ${query}`);
  }

  const params = { app: appId };
  if (query) params.query = query;
  if (fields) params.fields = fields;

  const records = await client.record.getAllRecordsWithCursor(params);

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
  const queryArg = args.find(arg => arg.startsWith("--query="));
  const fieldsArg = args.find(arg => arg.startsWith("--fields="));

  if (!appId) {
    console.error("Error: App ID is required");
    console.error("Usage: node scripts/app-management/records/get-all-records-with-cursor.mjs <appId> [--query=\"...\"] [--fields=field1,field2]");
    process.exit(1);
  }

  const options = {};
  if (queryArg) options.query = queryArg.replace("--query=", "");
  if (fieldsArg) options.fields = fieldsArg.replace("--fields=", "").split(",");

  getAllRecordsWithCursor(appId, options).catch((error) => {
    console.error("\n❌ Failed to get all records");
    console.error(error.message);
    process.exit(1);
  });
}
