#!/usr/bin/env node
/**
 * Delete a cursor
 *
 * Usage (CLI):
 *   node scripts/app-management/records/delete-cursor.mjs <cursorId>
 *
 * Usage (Programmatic):
 *   import { deleteCursor } from "./delete-cursor.mjs";
 *   await deleteCursor("cursor-id");
 *
 * Note: Cursors are automatically deleted when all records are retrieved,
 * but you should manually delete them if you don't need all records.
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Delete a cursor
 * @param {string} cursorId - The cursor ID
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{}>}
 */
export async function deleteCursor(cursorId, options = {}) {
  const { silent = false } = options;

  if (!cursorId) {
    throw new Error("Cursor ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Deleting cursor...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Cursor ID: ${cursorId}`);
  }

  await client.record.deleteCursor({ id: cursorId });

  if (!silent) {
    console.log(`\n✅ Successfully deleted cursor`);
  }

  return {};
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const cursorId = process.argv[2];

  if (!cursorId) {
    console.error("Error: Cursor ID is required");
    console.error("Usage: node scripts/app-management/records/delete-cursor.mjs <cursorId>");
    process.exit(1);
  }

  deleteCursor(cursorId).catch((error) => {
    console.error("\n❌ Failed to delete cursor");
    console.error(error.message);
    process.exit(1);
  });
}
