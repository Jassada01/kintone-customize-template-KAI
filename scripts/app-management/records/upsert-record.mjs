#!/usr/bin/env node
/**
 * Upsert (update or insert) a single record in a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/records/upsert-record.mjs <appId> <updateKeyField> <updateKeyValue> <recordJsonPath>
 *
 * Usage (Programmatic):
 *   import { upsertRecord } from "./upsert-record.mjs";
 *   await upsertRecord("51", {
 *     updateKey: { field: "unique_field", value: "key1" },
 *     record: { field_code: { value: "..." } }
 *   });
 *
 * JSON file format:
 * {
 *   "field_code": { "value": "value1" },
 *   "number_field": { "value": "123" }
 * }
 *
 * Note: The updateKey field must have "Prohibit duplicate values" option enabled.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Upsert a single record
 * @param {string|number} appId - The app ID
 * @param {Object} params - Upsert parameters
 * @param {Object} params.updateKey - Unique key for upsert
 * @param {string} params.updateKey.field - Field code of unique key
 * @param {string|number} params.updateKey.value - Value of unique key
 * @param {Object} [params.record] - Record fields
 * @param {string|number} [params.revision] - Expected revision number (for update)
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ id: string, revision: string }>}
 */
export async function upsertRecord(appId, params, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }
  if (!params.updateKey || !params.updateKey.field || params.updateKey.value === undefined) {
    throw new Error("updateKey with field and value is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Upserting record in App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Key: ${params.updateKey.field}=${params.updateKey.value}`);
  }

  const requestParams = {
    app: appId,
    updateKey: params.updateKey
  };
  if (params.record) requestParams.record = params.record;
  if (params.revision) requestParams.revision = params.revision;

  const result = await client.record.upsertRecord(requestParams);

  if (!silent) {
    console.log(`\n✅ Successfully upserted record`);
    console.log(`   Record ID: ${result.id}`);
    console.log(`   Revision: ${result.revision}`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appId = process.argv[2];
  const updateKeyField = process.argv[3];
  const updateKeyValue = process.argv[4];
  const recordJsonPath = process.argv[5];

  if (!appId || !updateKeyField || updateKeyValue === undefined) {
    console.error("Error: App ID, updateKey field and value are required");
    console.error("Usage: node scripts/app-management/records/upsert-record.mjs <appId> <updateKeyField> <updateKeyValue> [recordJsonPath]");
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

  upsertRecord(appId, {
    updateKey: { field: updateKeyField, value: updateKeyValue },
    record
  }).catch((error) => {
    console.error("\n❌ Failed to upsert record");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
