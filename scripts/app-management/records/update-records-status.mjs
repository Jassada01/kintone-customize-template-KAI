#!/usr/bin/env node
/**
 * Update status of multiple records (Process Management)
 *
 * Usage (CLI):
 *   node scripts/app-management/records/update-records-status.mjs <appId> <recordsJsonPath>
 *
 * Usage (Programmatic):
 *   import { updateRecordsStatus } from "./update-records-status.mjs";
 *   await updateRecordsStatus("51", [
 *     { id: "1", action: "Approve" },
 *     { id: "2", action: "Approve", assignee: "user1" }
 *   ]);
 *
 * JSON file format:
 * [
 *   { "id": "1", "action": "Approve" },
 *   { "id": "2", "action": "Approve", "assignee": "next_user" }
 * ]
 *
 * Note: This requires Process Management to be enabled on the app.
 * Maximum 100 records per call.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update multiple record statuses
 * @param {string|number} appId - The app ID
 * @param {Object[]} records - Array of status update objects
 * @param {string|number} records[].id - Record ID
 * @param {string} records[].action - Action name
 * @param {string} [records[].assignee] - Next assignee
 * @param {string|number} [records[].revision] - Expected revision
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ records: Array<{id: string, revision: string}> }>}
 */
export async function updateRecordsStatus(appId, records, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error("Records array is required");
  }
  if (records.length > 100) {
    throw new Error("Maximum 100 records allowed per call");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Updating status for ${records.length} record(s) in App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  const result = await client.record.updateRecordsStatus({
    app: appId,
    records
  });

  if (!silent) {
    console.log(`\n✅ Successfully updated ${result.records.length} record(s)`);
    console.log(`   Record IDs: ${result.records.map(r => r.id).join(", ")}`);
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
    console.error("Usage: node scripts/app-management/records/update-records-status.mjs <appId> <recordsJsonPath>");
    console.error("");
    console.error("JSON format:");
    console.error('[{ "id": "1", "action": "Approve" }, { "id": "2", "action": "Approve", "assignee": "user1" }]');
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

  updateRecordsStatus(appId, records).catch((error) => {
    console.error("\n❌ Failed to update records status");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
