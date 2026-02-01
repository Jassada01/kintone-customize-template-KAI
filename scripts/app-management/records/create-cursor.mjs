#!/usr/bin/env node
/**
 * Create a cursor for retrieving large amounts of records
 *
 * Usage (CLI):
 *   node scripts/app-management/records/create-cursor.mjs <appId> [--query="..."] [--fields=field1,field2] [--size=N]
 *
 * Usage (Programmatic):
 *   import { createCursor } from "./create-cursor.mjs";
 *   const cursor = await createCursor("51", { query: "status = \"Open\"", size: 500 });
 *   // Use cursor.id with getRecordsByCursor
 *
 * Note: Remember to delete the cursor after use with deleteCursor.
 * Maximum size is 500 records per getRecordsByCursor call.
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Create a cursor for record retrieval
 * @param {string|number} appId - The app ID
 * @param {Object} [options]
 * @param {string} [options.query] - Query string
 * @param {string[]} [options.fields] - Field codes to include
 * @param {number} [options.size] - Max records per fetch (default 100, max 500)
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ id: string, totalCount: string }>}
 */
export async function createCursor(appId, options = {}) {
  const { query, fields, size, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Creating cursor for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (query) console.log(`   Query: ${query}`);
    if (size) console.log(`   Size: ${size}`);
  }

  const params = { app: appId };
  if (query) params.query = query;
  if (fields) params.fields = fields;
  if (size) params.size = size;

  const result = await client.record.createCursor(params);

  if (!silent) {
    console.log(`\n✅ Successfully created cursor`);
    console.log(`   Cursor ID: ${result.id}`);
    console.log(`   Total records: ${result.totalCount}`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Fetch records: npm run record:get-by-cursor "${result.id}"`);
    console.log(`   2. Delete cursor: npm run record:delete-cursor "${result.id}"`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const appId = args.find(arg => !arg.startsWith("--"));
  const queryArg = args.find(arg => arg.startsWith("--query="));
  const fieldsArg = args.find(arg => arg.startsWith("--fields="));
  const sizeArg = args.find(arg => arg.startsWith("--size="));

  if (!appId) {
    console.error("Error: App ID is required");
    console.error("Usage: node scripts/app-management/records/create-cursor.mjs <appId> [--query=\"...\"] [--fields=field1,field2] [--size=N]");
    process.exit(1);
  }

  const options = {};
  if (queryArg) options.query = queryArg.replace("--query=", "");
  if (fieldsArg) options.fields = fieldsArg.replace("--fields=", "").split(",");
  if (sizeArg) options.size = parseInt(sizeArg.replace("--size=", ""));

  createCursor(appId, options).catch((error) => {
    console.error("\n❌ Failed to create cursor");
    console.error(error.message);
    process.exit(1);
  });
}
