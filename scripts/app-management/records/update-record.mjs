#!/usr/bin/env node
/**
 * Update a single record in a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/records/update-record.mjs <appId> <recordId> <recordJsonPath>
 *   node scripts/app-management/records/update-record.mjs <appId> --updateKey=<field>:<value> <recordJsonPath>
 *
 * Usage (Programmatic):
 *   import { updateRecord } from "./update-record.mjs";
 *   // By record ID
 *   await updateRecord("51", { id: "1", record: { field_code: { value: "..." } } });
 *   // By unique key
 *   await updateRecord("51", { updateKey: { field: "unique_field", value: "key1" }, record: {...} });
 *
 * JSON file format:
 * {
 *   "field_code": { "value": "updated_value" },
 *   "number_field": { "value": "456" }
 * }
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update a single record
 * @param {string|number} appId - The app ID
 * @param {Object} params - Update parameters
 * @param {string|number} [params.id] - The record ID (required if updateKey not specified)
 * @param {Object} [params.updateKey] - Unique key for update (required if id not specified)
 * @param {string} params.updateKey.field - Field code of unique key
 * @param {string|number} params.updateKey.value - Value of unique key
 * @param {Object} [params.record] - Record fields to update
 * @param {string|number} [params.revision] - Expected revision number
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ revision: string }>}
 */
export async function updateRecord(appId, params, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }
  if (!params.id && !params.updateKey) {
    throw new Error("Either id or updateKey is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  const identifier = params.id ? `ID: ${params.id}` : `Key: ${params.updateKey.field}=${params.updateKey.value}`;
  if (!silent) {
    console.log(`\n🔄 Updating record in App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   ${identifier}`);
  }

  const requestParams = { app: appId };
  if (params.id) requestParams.id = params.id;
  if (params.updateKey) requestParams.updateKey = params.updateKey;
  if (params.record) requestParams.record = params.record;
  if (params.revision) requestParams.revision = params.revision;

  const result = await client.record.updateRecord(requestParams);

  if (!silent) {
    console.log(`\n✅ Successfully updated record`);
    console.log(`   Revision: ${result.revision}`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const appId = args[0];

  // Parse --updateKey=field:value format
  const updateKeyArg = args.find(arg => arg.startsWith("--updateKey="));
  let recordId = null;
  let updateKey = null;
  let jsonPathIndex = 2;

  if (updateKeyArg) {
    const keyValue = updateKeyArg.replace("--updateKey=", "");
    const [field, ...valueParts] = keyValue.split(":");
    updateKey = { field, value: valueParts.join(":") };
    jsonPathIndex = args.findIndex(arg => !arg.startsWith("--") && arg !== appId);
    if (jsonPathIndex === -1) jsonPathIndex = args.length;
  } else {
    recordId = args[1];
  }

  const recordJsonPath = args[jsonPathIndex] || args[2];

  if (!appId || (!recordId && !updateKey)) {
    console.error("Error: App ID and Record ID (or --updateKey) are required");
    console.error("Usage: node scripts/app-management/records/update-record.mjs <appId> <recordId> <recordJsonPath>");
    console.error("       node scripts/app-management/records/update-record.mjs <appId> --updateKey=<field>:<value> <recordJsonPath>");
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

  const params = { record };
  if (recordId) params.id = recordId;
  if (updateKey) params.updateKey = updateKey;

  updateRecord(appId, params).catch((error) => {
    console.error("\n❌ Failed to update record");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
