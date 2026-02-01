#!/usr/bin/env node
/**
 * Add unlimited records to a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/records/add-all-records.mjs <appId> <recordsJsonPath>
 *
 * Usage (Programmatic):
 *   import { addAllRecords } from "./add-all-records.mjs";
 *   const result = await addAllRecords("51", [
 *     { field_code: { value: "value1" } },
 *     // ... can have more than 100 records
 *   ]);
 *
 * JSON file format (array of records):
 * [
 *   { "field_code": { "value": "value1" } },
 *   { "field_code": { "value": "value2" } }
 * ]
 *
 * WARNING: Records are processed in chunks of 2000. Rollback is per chunk.
 * If an error occurs, some records may have been added.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Add unlimited records
 * @param {string|number} appId - The app ID
 * @param {Object[]} records - Array of record objects (no limit)
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ records: Array<{id: string, revision: string}> }>}
 */
export async function addAllRecords(appId, records, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error("Records array is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Adding ${records.length} record(s) to App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (records.length > 100) {
      console.log(`   ⚠️  Processing in chunks (rollback is per 2000 records)`);
    }
  }

  const result = await client.record.addAllRecords({
    app: appId,
    records
  });

  if (!silent) {
    console.log(`\n✅ Successfully added ${result.records.length} record(s)`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appId = process.argv[2];
  const recordsJsonPath = process.argv[3];

  if (!appId || !recordsJsonPath) {
    console.error("Error: App ID and records JSON path are required");
    console.error("Usage: node scripts/app-management/records/add-all-records.mjs <appId> <recordsJsonPath>");
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

  addAllRecords(appId, records).catch((error) => {
    console.error("\n❌ Failed to add all records");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    // Check for partial success
    if (error.processedRecordsResult) {
      console.error("\n⚠️  Partial records were added:");
      console.error(`   Added: ${error.processedRecordsResult.records?.length || 0}`);
    }
    process.exit(1);
  });
}
