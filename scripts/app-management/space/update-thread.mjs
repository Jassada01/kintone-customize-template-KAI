#!/usr/bin/env node
/**
 * Update a thread of a kintone space
 *
 * Usage (CLI):
 *   node scripts/app-management/space/update-thread.mjs <threadId> [--name="New Name"] [--body-file=<htmlPath>]
 *
 * Usage (Programmatic):
 *   import { updateThread } from "./update-thread.mjs";
 *   await updateThread("222", { name: "New Name", body: "<p>Body</p>" });
 *
 * Note: Thread ID can be found in the URL: https://domain.kintone.com/k/#/space/111/thread/222
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update a thread of a kintone space
 * @param {string|number} threadId - The thread ID
 * @param {Object} threadData - Thread data to update
 * @param {string} [threadData.name] - New thread name (1-128 characters)
 * @param {string} [threadData.body] - New thread body as HTML
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object>}
 */
export async function updateThread(threadId, threadData, options = {}) {
  const { silent = false } = options;

  if (!threadId) {
    throw new Error("Thread ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Updating thread ${threadId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    if (threadData.name) console.log(`   New name: ${threadData.name}`);
    if (threadData.body) console.log(`   Body length: ${threadData.body.length} characters`);
  }

  const params = { id: threadId };
  if (threadData.name) params.name = threadData.name;
  if (threadData.body) params.body = threadData.body;

  const result = await client.space.updateThread(params);

  if (!silent) {
    console.log(`\n✅ Successfully updated thread ${threadId}`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const threadId = args.find((arg) => !arg.startsWith("--"));
  const nameArg = args.find((arg) => arg.startsWith("--name="));
  const bodyFileArg = args.find((arg) => arg.startsWith("--body-file="));

  if (!threadId) {
    console.error("Error: Thread ID is required");
    console.error('Usage: node scripts/app-management/space/update-thread.mjs <threadId> [--name="New Name"] [--body-file=<htmlPath>]');
    process.exit(1);
  }

  if (!nameArg && !bodyFileArg) {
    console.error("Error: At least --name or --body-file must be specified");
    process.exit(1);
  }

  const threadData = {};
  if (nameArg) {
    threadData.name = nameArg.replace("--name=", "");
  }
  if (bodyFileArg) {
    const rootDir = getRootDir(import.meta.url);
    const htmlPath = resolve(rootDir, bodyFileArg.replace("--body-file=", ""));
    try {
      threadData.body = readFileSync(htmlPath, "utf-8");
    } catch (error) {
      console.error(`Error: Failed to read HTML file`);
      console.error(error.message);
      process.exit(1);
    }
  }

  updateThread(threadId, threadData).catch((error) => {
    console.error("\n❌ Failed to update thread");
    console.error(error.message);
    process.exit(1);
  });
}
