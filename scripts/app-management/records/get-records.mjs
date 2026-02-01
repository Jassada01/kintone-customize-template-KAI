#!/usr/bin/env node
/**
 * Get multiple records from a kintone app (max 500)
 *
 * Usage (CLI):
 *   node scripts/app-management/records/get-records.mjs <appId> [--query="..."] [--fields=field1,field2]
 *
 * Usage (Programmatic):
 *   import { getRecords } from "./get-records.mjs";
 *   const records = await getRecords("51", { query: "status = \"Open\"", fields: ["field1", "field2"] });
 *
 * Note: Maximum 500 records. Use getAllRecords for more.
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Get multiple records
 * @param {string|number} appId - The app ID
 * @param {Object} [options]
 * @param {string} [options.query] - Query string for filtering
 * @param {string[]} [options.fields] - Field codes to include
 * @param {boolean} [options.totalCount=false] - Include total count
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ records: Object[], totalCount: string|null }>}
 */
export async function getRecords(appId, options = {}) {
  const { query, fields, totalCount = false, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching records from App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (query) console.log(`   Query: ${query}`);
  }

  const params = { app: appId };
  if (query) params.query = query;
  if (fields) params.fields = fields;
  if (totalCount) params.totalCount = true;

  const result = await client.record.getRecords(params);

  if (!silent) {
    console.log(`\n✅ Successfully fetched ${result.records.length} record(s)`);
    if (result.totalCount !== null) {
      console.log(`   Total matching: ${result.totalCount}`);
    }
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const appId = args.find(arg => !arg.startsWith("--"));
  const queryArg = args.find(arg => arg.startsWith("--query="));
  const fieldsArg = args.find(arg => arg.startsWith("--fields="));
  const totalCount = args.includes("--totalCount");

  if (!appId) {
    console.error("Error: App ID is required");
    console.error("Usage: node scripts/app-management/records/get-records.mjs <appId> [--query=\"...\"] [--fields=field1,field2] [--totalCount]");
    process.exit(1);
  }

  const options = { totalCount };
  if (queryArg) options.query = queryArg.replace("--query=", "");
  if (fieldsArg) options.fields = fieldsArg.replace("--fields=", "").split(",");

  getRecords(appId, options).catch((error) => {
    console.error("\n❌ Failed to get records");
    console.error(error.message);
    process.exit(1);
  });
}
