#!/usr/bin/env node
/**
 * Update multiple records in a kintone app (max 100)
 *
 * Usage (CLI):
 *   node scripts/app-management/records/update-records.mjs <appId> <recordsJsonPath> [--upsert]
 *
 * Usage (Programmatic):
 *   import { updateRecords } from "./update-records.mjs";
 *   const result = await updateRecords("51", [
 *     { id: "1", record: { field_code: { value: "updated" } } },
 *     { updateKey: { field: "unique_field", value: "key1" }, record: {...} }
 *   ]);
 *
 * JSON file format (array of update objects):
 * [
 *   { "id": "1", "record": { "field_code": { "value": "updated1" } } },
 *   { "id": "2", "record": { "field_code": { "value": "updated2" } } }
 * ]
 *
 * Or with updateKey:
 * [
 *   { "updateKey": { "field": "unique_field", "value": "key1" }, "record": {...} }
 * ]
 *
 * Note: Maximum 100 records. Use updateAllRecords for more.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update multiple records
 * @param {string|number} appId - The app ID
 * @param {Object[]} records - Array of update objects with id/updateKey and record
 * @param {Object} [options]
 * @param {boolean} [options.upsert=false] - Enable UPSERT mode
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ records: Array<{id: string, revision: string, operation?: string}> }>}
 */
export async function updateRecords(appId, records, options = {}) {
  const { upsert = false, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error("Records array is required");
  }
  if (records.length > 100) {
    throw new Error("Maximum 100 records allowed. Use updateAllRecords for more.");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Updating ${records.length} record(s) in App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (upsert) console.log(`   Mode: UPSERT`);
  }

  const params = { app: appId, records };
  if (upsert) params.upsert = true;

  const result = await client.record.updateRecords(params);

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
    console.error("Usage: node scripts/app-management/records/update-records.mjs <appId> <recordsJsonPath> [--upsert]");
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

  updateRecords(appId, records, { upsert }).catch((error) => {
    console.error("\n❌ Failed to update records");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
