#!/usr/bin/env node
/**
 * Delete unlimited records from a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/records/delete-all-records.mjs <appId> <recordsJsonPath>
 *
 * Usage (Programmatic):
 *   import { deleteAllRecords } from "./delete-all-records.mjs";
 *   await deleteAllRecords("51", [
 *     { id: "1" },
 *     { id: "2", revision: "5" },
 *     // ... can have more than 100 records
 *   ]);
 *
 * JSON file format (array of objects with id and optional revision):
 * [
 *   { "id": "1" },
 *   { "id": "2", "revision": "5" }
 * ]
 *
 * WARNING: Records are processed in chunks of 2000. Rollback is per chunk.
 * If an error occurs, some records may have been deleted.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Delete unlimited records
 * @param {string|number} appId - The app ID
 * @param {Object[]} records - Array of objects with id and optional revision
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{}>}
 */
export async function deleteAllRecords(appId, records, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error("Records array is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Deleting ${records.length} record(s) from App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (records.length > 100) {
      console.log(`   ⚠️  Processing in chunks (rollback is per 2000 records)`);
    }
  }

  await client.record.deleteAllRecords({
    app: appId,
    records
  });

  if (!silent) {
    console.log(`\n✅ Successfully deleted ${records.length} record(s)`);
  }

  return {};
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appId = process.argv[2];
  const recordsJsonPath = process.argv[3];

  if (!appId || !recordsJsonPath) {
    console.error("Error: App ID and records JSON path are required");
    console.error("Usage: node scripts/app-management/records/delete-all-records.mjs <appId> <recordsJsonPath>");
    console.error("");
    console.error("JSON format: [{ \"id\": \"1\" }, { \"id\": \"2\", \"revision\": \"5\" }]");
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

  deleteAllRecords(appId, records).catch((error) => {
    console.error("\n❌ Failed to delete all records");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    if (error.processedRecordsResult) {
      console.error("\n⚠️  Partial records were deleted before error");
    }
    process.exit(1);
  });
}
