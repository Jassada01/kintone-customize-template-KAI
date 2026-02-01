#!/usr/bin/env node
/**
 * Get comments from a record in a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/records/get-record-comments.mjs <appId> <recordId> [--order=asc|desc] [--offset=N] [--limit=N]
 *
 * Usage (Programmatic):
 *   import { getRecordComments } from "./get-record-comments.mjs";
 *   const comments = await getRecordComments("51", "1", { order: "desc", limit: 10 });
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Get record comments
 * @param {string|number} appId - The app ID
 * @param {string|number} recordId - The record ID
 * @param {Object} [options]
 * @param {string} [options.order] - Sort order: "asc" or "desc"
 * @param {number} [options.offset] - Number of comments to skip
 * @param {number} [options.limit] - Number of comments to retrieve (max 10)
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ comments: Object[], older: boolean, newer: boolean }>}
 */
export async function getRecordComments(appId, recordId, options = {}) {
  const { order, offset, limit, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }
  if (!recordId) {
    throw new Error("Record ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching comments for record ${recordId} in App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  const params = { app: appId, record: recordId };
  if (order) params.order = order;
  if (offset !== undefined) params.offset = offset;
  if (limit !== undefined) params.limit = limit;

  const result = await client.record.getRecordComments(params);

  if (!silent) {
    console.log(`\n✅ Successfully fetched ${result.comments.length} comment(s)`);
    if (result.older) console.log(`   Has older comments: Yes`);
    if (result.newer) console.log(`   Has newer comments: Yes`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const appId = args.find(arg => !arg.startsWith("--"));
  const recordId = args.filter(arg => !arg.startsWith("--"))[1];
  const orderArg = args.find(arg => arg.startsWith("--order="));
  const offsetArg = args.find(arg => arg.startsWith("--offset="));
  const limitArg = args.find(arg => arg.startsWith("--limit="));

  if (!appId || !recordId) {
    console.error("Error: App ID and Record ID are required");
    console.error("Usage: node scripts/app-management/records/get-record-comments.mjs <appId> <recordId> [--order=asc|desc] [--offset=N] [--limit=N]");
    process.exit(1);
  }

  const options = {};
  if (orderArg) options.order = orderArg.replace("--order=", "");
  if (offsetArg) options.offset = parseInt(offsetArg.replace("--offset=", ""));
  if (limitArg) options.limit = parseInt(limitArg.replace("--limit=", ""));

  getRecordComments(appId, recordId, options).catch((error) => {
    console.error("\n❌ Failed to get record comments");
    console.error(error.message);
    process.exit(1);
  });
}
