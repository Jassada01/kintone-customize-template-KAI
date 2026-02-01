#!/usr/bin/env node
/**
 * Update unlimited records in a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/records/update-all-records.mjs <appId> <recordsJsonPath> [--upsert]
 *
 * Usage (Programmatic):
 *   import { updateAllRecords } from "./update-all-records.mjs";
 *   const result = await updateAllRecords("51", [
 *     { id: "1", record: { field_code: { value: "updated" } } },
 *     // ... can have more than 100 records
 *   ]);
 *
 * JSON file format (array of update objects):
 * [
 *   { "id": "1", "record": { "field_code": { "value": "updated1" } } },
 *   { "id": "2", "record": { "field_code": { "value": "updated2" } } }
 * ]
 *
 * WARNING: Records are processed in chunks of 2000. Rollback is per chunk.
 * If an error occurs, some records may have been updated.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update unlimited records
 * @param {string|number} appId - The app ID
 * @param {Object[]} records - Array of update objects (no limit)
 * @param {Object} [options]
 * @param {boolean} [options.upsert=false] - Enable UPSERT mode
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ records: Array<{id: string, revision: string, operation?: string}> }>}
 */
export async function updateAllRecords(appId, records, options = {}) {
  const { upsert = false, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error("Records array is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Updating ${records.length} record(s) in App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (upsert) console.log(`   Mode: UPSERT`);
    if (records.length > 100) {
      console.log(`   ⚠️  Processing in chunks (rollback is per 2000 records)`);
    }
  }

  const params = { app: appId, records };
  if (upsert) params.upsert = true;

  const result = await client.record.updateAllRecords(params);

  if (!silent) {
    console.log(`\n✅ Successfully updated ${result.records.length} record(s)`);
    if (upsert) {
      const inserts = result.records.filter(r => r.operation === "INSERT").length;
      const updates = result.records.filter(r => r.operation === "UPDATE").length;
      console.log(`   Inserted: ${inserts}, Updated: ${updates}`);
    }
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const appId = args.find(arg => !arg.startsWith("--"));
  const recordsJsonPath = args.find(arg => !arg.startsWith("--") && arg !== appId);
  const upsert = args.includes("--upsert");

  if (!appId || !recordsJsonPath) {
    console.error("Error: App ID and records JSON path are required");
    console.error("Usage: node scripts/app-management/records/update-all-records.mjs <appId> <recordsJsonPath> [--upsert]");
    process.exit(1);
  }

  let records;
  try {
    const rootDir = getRootDir(import.meta.url);
    const jsonPath = resolve(rootDir, recordsJsonPath);
    const jsonContent = readFileSync(jsonPath, "utf-8");
    records = JSON.parse(jsonContent);
  } catch (error) {
    console.error(`Error: Failed to read records JSON from ${recordsJsonPath}`);
    console.error(error.message);
    process.exit(1);
  }

  updateAllRecords(appId, records, { upsert }).catch((error) => {
    console.error("\n❌ Failed to update all records");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    if (error.processedRecordsResult) {
      console.error("\n⚠️  Partial records were updated:");
      console.error(`   Updated: ${error.processedRecordsResult.records?.length || 0}`);
    }
    process.exit(1);
  });
}
