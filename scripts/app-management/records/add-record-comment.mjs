#!/usr/bin/env node
/**
 * Add a comment to a record in a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/records/add-record-comment.mjs <appId> <recordId> "<comment text>"
 *   node scripts/app-management/records/add-record-comment.mjs <appId> <recordId> --json=<commentJsonPath>
 *
 * Usage (Programmatic):
 *   import { addRecordComment } from "./add-record-comment.mjs";
 *   const result = await addRecordComment("51", "1", {
 *     text: "This is a comment",
 *     mentions: [{ code: "user1", type: "USER" }]
 *   });
 *
 * JSON file format:
 * {
 *   "text": "Comment with @mention",
 *   "mentions": [
 *     { "code": "user1", "type": "USER" },
 *     { "code": "group1", "type": "GROUP" }
 *   ]
 * }
 *
 * Mention types: USER, GROUP, ORGANIZATION
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Add a comment to a record
 * @param {string|number} appId - The app ID
 * @param {string|number} recordId - The record ID
 * @param {Object} comment - Comment object
 * @param {string} comment.text - Comment text (max 65535 chars)
 * @param {Object[]} [comment.mentions] - Array of mentions
 * @param {string} comment.mentions[].code - User/group/organization code
 * @param {string} comment.mentions[].type - USER, GROUP, or ORGANIZATION
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ id: string }>}
 */
export async function addRecordComment(appId, recordId, comment, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }
  if (!recordId) {
    throw new Error("Record ID is required");
  }
  if (!comment || !comment.text) {
    throw new Error("Comment text is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Adding comment to record ${recordId} in App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  const result = await client.record.addRecordComment({
    app: appId,
    record: recordId,
    comment
  });

  if (!silent) {
    console.log(`\n✅ Successfully added comment`);
    console.log(`   Comment ID: ${result.id}`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const appId = args[0];
  const recordId = args[1];
  const jsonArg = args.find(arg => arg.startsWith("--json="));

  let comment;
  if (jsonArg) {
    try {
      const rootDir = getRootDir(import.meta.url);
      const jsonPath = resolve(rootDir, jsonArg.replace("--json=", ""));
      const jsonContent = readFileSync(jsonPath, "utf-8");
      comment = JSON.parse(jsonContent);
    } catch (error) {
      console.error(`Error: Failed to read JSON file`);
      console.error(error.message);
      process.exit(1);
    }
  } else {
    const text = args[2];
    if (text) {
      comment = { text };
    }
  }

  if (!appId || !recordId || !comment) {
    console.error("Error: App ID, Record ID, and comment text are required");
    console.error("Usage: node scripts/app-management/records/add-record-comment.mjs <appId> <recordId> \"<comment text>\"");
    console.error("       node scripts/app-management/records/add-record-comment.mjs <appId> <recordId> --json=<commentJsonPath>");
    process.exit(1);
  }

  addRecordComment(appId, recordId, comment).catch((error) => {
    console.error("\n❌ Failed to add comment");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
