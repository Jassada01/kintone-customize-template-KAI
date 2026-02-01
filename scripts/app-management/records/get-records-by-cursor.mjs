#!/usr/bin/env node
/**
 * Get records using a cursor
 *
 * Usage (CLI):
 *   node scripts/app-management/records/get-records-by-cursor.mjs <cursorId>
 *
 * Usage (Programmatic):
 *   import { getRecordsByCursor } from "./get-records-by-cursor.mjs";
 *   const result = await getRecordsByCursor("cursor-id");
 *   // result.next indicates if more records are available
 *
 * Note: Call this repeatedly until result.next is false.
 * The cursor is automatically deleted when all records are retrieved.
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Get records using cursor
 * @param {string} cursorId - The cursor ID
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ records: Object[], next: boolean }>}
 */
export async function getRecordsByCursor(cursorId, options = {}) {
  const { silent = false } = options;

  if (!cursorId) {
    throw new Error("Cursor ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching records by cursor...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Cursor ID: ${cursorId}`);
  }

  const result = await client.record.getRecordsByCursor({ id: cursorId });

  if (!silent) {
    console.log(`\n✅ Fetched ${result.records.length} record(s)`);
    console.log(`   More records available: ${result.next ? "Yes" : "No"}`);
    if (result.next) {
      console.log(`\n📝 Run again with same cursor ID to get more records`);
    } else {
      console.log(`\n📝 Cursor has been automatically deleted`);
    }
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const cursorId = process.argv[2];

  if (!cursorId) {
    console.error("Error: Cursor ID is required");
    console.error("Usage: node scripts/app-management/records/get-records-by-cursor.mjs <cursorId>");
    process.exit(1);
  }

  getRecordsByCursor(cursorId).catch((error) => {
    console.error("\n❌ Failed to get records by cursor");
    console.error(error.message);
    process.exit(1);
  });
}
