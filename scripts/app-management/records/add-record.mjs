#!/usr/bin/env node
/**
 * Add a single record to a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/records/add-record.mjs <appId> <recordJsonPath>
 *
 * Usage (Programmatic):
 *   import { addRecord } from "./add-record.mjs";
 *   const result = await addRecord("51", { field_code: { value: "..." } });
 *
 * JSON file format:
 * {
 *   "field_code": { "value": "value1" },
 *   "number_field": { "value": "123" }
 * }
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Add a single record
 * @param {string|number} appId - The app ID
 * @param {Object} record - Record object with field codes and values
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ id: string, revision: string }>}
 */
export async function addRecord(appId, record, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Adding record to App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  const result = await client.record.addRecord({
    app: appId,
    record: record || {}
  });

  if (!silent) {
    console.log(`\n✅ Successfully added record`);
    console.log(`   Record ID: ${result.id}`);
    console.log(`   Revision: ${result.revision}`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appId = process.argv[2];
  const recordJsonPath = process.argv[3];

  if (!appId) {
    console.error("Error: App ID is required");
    console.error("Usage: node scripts/app-management/records/add-record.mjs <appId> [recordJsonPath]");
    process.exit(1);
  }

  let record = {};
  if (recordJsonPath) {
    try {
      const rootDir = getRootDir(import.meta.url);
      const jsonPath = resolve(rootDir, recordJsonPath);
      const jsonContent = readFileSync(jsonPath, "utf-8");
      record = JSON.parse(jsonContent);
    } catch (error) {
      console.error(`Error: Failed to read record JSON from ${recordJsonPath}`);
      console.error(error.message);
      process.exit(1);
    }
  }

  addRecord(appId, record).catch((error) => {
    console.error("\n❌ Failed to add record");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
