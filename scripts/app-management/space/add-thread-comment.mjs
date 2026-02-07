#!/usr/bin/env node
/**
 * Add a comment to a thread of a kintone space
 *
 * Usage (CLI):
 *   node scripts/app-management/space/add-thread-comment.mjs <spaceId> <threadId> "comment text"
 *   node scripts/app-management/space/add-thread-comment.mjs <spaceId> <threadId> --json=<commentJsonPath>
 *
 * Usage (Programmatic):
 *   import { addThreadComment } from "./add-thread-comment.mjs";
 *   const result = await addThreadComment("1", "222", { text: "Hello" });
 *
 * JSON file format (for advanced comments with mentions/files):
 * {
 *   "text": "Comment text",
 *   "mentions": [
 *     { "code": "user1", "type": "USER" }
 *   ],
 *   "files": [
 *     { "fileKey": "xxx", "width": 250 }
 *   ]
 * }
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Add a comment to a thread of a kintone space
 * @param {string|number} spaceId - The space ID
 * @param {string|number} threadId - The thread ID
 * @param {Object} comment - Comment object
 * @param {string} [comment.text] - Comment text
 * @param {Array} [comment.mentions] - Mentions array
 * @param {Array} [comment.files] - File attachments array
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ id: string }>} Created comment ID
 */
export async function addThreadComment(spaceId, threadId, comment, options = {}) {
  const { silent = false } = options;

  if (!spaceId) {
    throw new Error("Space ID is required");
  }
  if (!threadId) {
    throw new Error("Thread ID is required");
  }
  if (!comment || (!comment.text && !comment.files)) {
    throw new Error("Comment text or files are required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Adding comment to thread ${threadId} in space ${spaceId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (comment.text) {
      const preview = comment.text.length > 50 ? comment.text.substring(0, 50) + "..." : comment.text;
      console.log(`   Text: ${preview}`);
    }
    if (comment.mentions) {
      console.log(`   Mentions: ${comment.mentions.length}`);
    }
  }

  const result = await client.space.addThreadComment({
    space: spaceId,
    thread: threadId,
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
  const positionalArgs = args.filter((arg) => !arg.startsWith("--"));
  const jsonArg = args.find((arg) => arg.startsWith("--json="));

  const spaceId = positionalArgs[0];
  const threadId = positionalArgs[1];

  if (!spaceId || !threadId) {
    console.error("Error: Space ID and Thread ID are required");
    console.error('Usage: node scripts/app-management/space/add-thread-comment.mjs <spaceId> <threadId> "text"');
    console.error("       node scripts/app-management/space/add-thread-comment.mjs <spaceId> <threadId> --json=<path>");
    process.exit(1);
  }

  let comment;
  if (jsonArg) {
    const rootDir = getRootDir(import.meta.url);
    const jsonPath = resolve(rootDir, jsonArg.replace("--json=", ""));
    try {
      const jsonContent = readFileSync(jsonPath, "utf-8");
      comment = JSON.parse(jsonContent);
    } catch (error) {
      console.error(`Error: Failed to read comment JSON`);
      console.error(error.message);
      process.exit(1);
    }
  } else {
    const text = positionalArgs[2];
    if (!text) {
      console.error("Error: Comment text or --json path is required");
      process.exit(1);
    }
    comment = { text };
  }

  addThreadComment(spaceId, threadId, comment).catch((error) => {
    console.error("\n❌ Failed to add thread comment");
    console.error(error.message);
    process.exit(1);
  });
}
