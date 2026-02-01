#!/usr/bin/env node
/**
 * Get a single record from a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/records/get-record.mjs <appId> <recordId>
 *
 * Usage (Programmatic):
 *   import { getRecord } from "./get-record.mjs";
 *   const record = await getRecord("51", "1");
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Get a single record
 * @param {string|number} appId - The app ID
 * @param {string|number} recordId - The record ID
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ record: Object }>}
 */
export async function getRecord(appId, recordId, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }
  if (!recordId) {
    throw new Error("Record ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching record ${recordId} from App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  const result = await client.record.getRecord({
    app: appId,
    id: recordId
  });

  if (!silent) {
    console.log(`\n✅ Successfully fetched record ${recordId}`);
    console.log(`   Fields: ${Object.keys(result.record).length}`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appId = process.argv[2];
  const recordId = process.argv[3];

  if (!appId || !recordId) {
    console.error("Error: App ID and Record ID are required");
    console.error("Usage: node scripts/app-management/records/get-record.mjs <appId> <recordId>");
    process.exit(1);
  }

  getRecord(appId, recordId).catch((error) => {
    console.error("\n❌ Failed to get record");
    console.error(error.message);
    process.exit(1);
  });
}
