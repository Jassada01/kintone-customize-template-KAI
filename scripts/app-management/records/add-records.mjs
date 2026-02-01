#!/usr/bin/env node
/**
 * Add multiple records to a kintone app (max 100)
 *
 * Usage (CLI):
 *   node scripts/app-management/records/add-records.mjs <appId> <recordsJsonPath>
 *
 * Usage (Programmatic):
 *   import { addRecords } from "./add-records.mjs";
 *   const result = await addRecords("51", [
 *     { field_code: { value: "value1" } },
 *     { field_code: { value: "value2" } }
 *   ]);
 *
 * JSON file format (array of records):
 * [
 *   { "field_code": { "value": "value1" } },
 *   { "field_code": { "value": "value2" } }
 * ]
 *
 * Note: Maximum 100 records. Use addAllRecords for more.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Add multiple records
 * @param {string|number} appId - The app ID
 * @param {Object[]} records - Array of record objects
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ ids: string[], revisions: string[], records: Array<{id: string, revision: string}> }>}
 */
export async function addRecords(appId, records, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error("Records array is required");
  }
  if (records.length > 100) {
    throw new Error("Maximum 100 records allowed. Use addAllRecords for more.");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Adding ${records.length} record(s) to App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  const result = await client.record.addRecords({
    app: appId,
    records
  });

  if (!silent) {
    console.log(`\n✅ Successfully added ${result.records.length} record(s)`);
    console.log(`   Record IDs: ${result.ids.join(", ")}`);
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
    console.error("Usage: node scripts/app-management/records/add-records.mjs <appId> <recordsJsonPath>");
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

  addRecords(appId, records).catch((error) => {
    console.error("\n❌ Failed to add records");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
