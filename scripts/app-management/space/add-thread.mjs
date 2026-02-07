#!/usr/bin/env node
/**
 * Add a thread to a kintone space
 *
 * Usage (CLI):
 *   node scripts/app-management/space/add-thread.mjs <spaceId> <threadName>
 *
 * Usage (Programmatic):
 *   import { addThread } from "./add-thread.mjs";
 *   const result = await addThread("1", "Thread Name");
 *
 * Note: The "Enable multiple threads" option must be enabled in the space settings.
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Add a thread to a kintone space
 * @param {string|number} spaceId - The space ID
 * @param {string} threadName - The thread name (1-128 characters)
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ id: string }>} Created thread ID
 */
export async function addThread(spaceId, threadName, options = {}) {
  const { silent = false } = options;

  if (!spaceId) {
    throw new Error("Space ID is required");
  }
  if (!threadName) {
    throw new Error("Thread name is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Adding thread to space ${spaceId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Thread name: ${threadName}`);
  }

  const result = await client.space.addThread({
    space: spaceId,
    name: threadName
  });

  if (!silent) {
    console.log(`\n✅ Successfully created thread`);
    console.log(`   Thread ID: ${result.id}`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const spaceId = process.argv[2];
  const threadName = process.argv[3];

  if (!spaceId || !threadName) {
    console.error("Error: Space ID and thread name are required");
    console.error('Usage: node scripts/app-management/space/add-thread.mjs <spaceId> "Thread Name"');
    process.exit(1);
  }

  addThread(spaceId, threadName).catch((error) => {
    console.error("\n❌ Failed to add thread");
    console.error(error.message);
    process.exit(1);
  });
}
