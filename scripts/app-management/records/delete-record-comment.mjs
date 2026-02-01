#!/usr/bin/env node
/**
 * Delete a comment from a record in a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/records/delete-record-comment.mjs <appId> <recordId> <commentId>
 *
 * Usage (Programmatic):
 *   import { deleteRecordComment } from "./delete-record-comment.mjs";
 *   await deleteRecordComment("51", "1", "5");
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Delete a comment from a record
 * @param {string|number} appId - The app ID
 * @param {string|number} recordId - The record ID
 * @param {string|number} commentId - The comment ID
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{}>}
 */
export async function deleteRecordComment(appId, recordId, commentId, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }
  if (!recordId) {
    throw new Error("Record ID is required");
  }
  if (!commentId) {
    throw new Error("Comment ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Deleting comment ${commentId} from record ${recordId} in App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  await client.record.deleteRecordComment({
    app: appId,
    record: recordId,
    comment: commentId
  });

  if (!silent) {
    console.log(`\n✅ Successfully deleted comment ${commentId}`);
  }

  return {};
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appId = process.argv[2];
  const recordId = process.argv[3];
  const commentId = process.argv[4];

  if (!appId || !recordId || !commentId) {
    console.error("Error: App ID, Record ID, and Comment ID are required");
    console.error("Usage: node scripts/app-management/records/delete-record-comment.mjs <appId> <recordId> <commentId>");
    process.exit(1);
  }

  deleteRecordComment(appId, recordId, commentId).catch((error) => {
    console.error("\n❌ Failed to delete comment");
    console.error(error.message);
    process.exit(1);
  });
}
