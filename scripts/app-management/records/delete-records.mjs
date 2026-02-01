#!/usr/bin/env node
/**
 * Delete multiple records from a kintone app (max 100)
 *
 * Usage (CLI):
 *   node scripts/app-management/records/delete-records.mjs <appId> <recordIds...>
 *   node scripts/app-management/records/delete-records.mjs <appId> --json=<jsonPath>
 *
 * Usage (Programmatic):
 *   import { deleteRecords } from "./delete-records.mjs";
 *   await deleteRecords("51", { ids: ["1", "2", "3"] });
 *   // With revision check
 *   await deleteRecords("51", { ids: ["1", "2"], revisions: ["5", "3"] });
 *
 * JSON file format (array of record IDs):
 * ["1", "2", "3"]
 *
 * Or with revisions:
 * { "ids": ["1", "2"], "revisions": ["5", "3"] }
 *
 * Note: Maximum 100 records. Use deleteAllRecords for more.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Delete multiple records
 * @param {string|number} appId - The app ID
 * @param {Object} params - Delete parameters
 * @param {(string|number)[]} params.ids - Array of record IDs to delete
 * @param {(string|number)[]} [params.revisions] - Array of expected revision numbers
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{}>}
 */
export async function deleteRecords(appId, params, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }
  if (!params.ids || !Array.isArray(params.ids) || params.ids.length === 0) {
    throw new Error("Record IDs array is required");
  }
  if (params.ids.length > 100) {
    throw new Error("Maximum 100 records allowed. Use deleteAllRecords for more.");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Deleting ${params.ids.length} record(s) from App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Record IDs: ${params.ids.join(", ")}`);
  }

  const requestParams = { app: appId, ids: params.ids };
  if (params.revisions) requestParams.revisions = params.revisions;

  await client.record.deleteRecords(requestParams);

  if (!silent) {
    console.log(`\n✅ Successfully deleted ${params.ids.length} record(s)`);
  }

  return {};
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const appId = args[0];
  const jsonArg = args.find(arg => arg.startsWith("--json="));

  let ids;
  let revisions;

  if (jsonArg) {
    try {
      const rootDir = getRootDir(import.meta.url);
      const jsonPath = resolve(rootDir, jsonArg.replace("--json=", ""));
      const jsonContent = readFileSync(jsonPath, "utf-8");
      const data = JSON.parse(jsonContent);
      if (Array.isArray(data)) {
        ids = data;
      } else {
        ids = data.ids;
        revisions = data.revisions;
      }
    } catch (error) {
      console.error(`Error: Failed to read JSON file`);
      console.error(error.message);
      process.exit(1);
    }
  } else {
    ids = args.slice(1).filter(arg => !arg.startsWith("--"));
  }

  if (!appId || !ids || ids.length === 0) {
    console.error("Error: App ID and record IDs are required");
    console.error("Usage: node scripts/app-management/records/delete-records.mjs <appId> <recordIds...>");
    console.error("       node scripts/app-management/records/delete-records.mjs <appId> --json=<jsonPath>");
    process.exit(1);
  }

  const params = { ids };
  if (revisions) params.revisions = revisions;

  deleteRecords(appId, params).catch((error) => {
    console.error("\n❌ Failed to delete records");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
