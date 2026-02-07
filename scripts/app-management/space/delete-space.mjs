#!/usr/bin/env node
/**
 * Delete a kintone space
 *
 * Usage (CLI):
 *   node scripts/app-management/space/delete-space.mjs <spaceId> --confirm
 *
 * Usage (Programmatic):
 *   import { deleteSpace } from "./delete-space.mjs";
 *   await deleteSpace("1");
 *
 * Note: The --confirm flag is required for CLI usage to prevent accidental deletion.
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Delete a kintone space
 * @param {string|number} spaceId - The space ID
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object>}
 */
export async function deleteSpace(spaceId, options = {}) {
  const { silent = false } = options;

  if (!spaceId) {
    throw new Error("Space ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Deleting space ${spaceId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  const result = await client.space.deleteSpace({ id: spaceId });

  if (!silent) {
    console.log(`\n✅ Successfully deleted space ${spaceId}`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const spaceId = args.find((arg) => !arg.startsWith("--"));
  const confirm = args.includes("--confirm");

  if (!spaceId) {
    console.error("Error: Space ID is required");
    console.error("Usage: node scripts/app-management/space/delete-space.mjs <spaceId> --confirm");
    process.exit(1);
  }

  if (!confirm) {
    console.error("⚠️  Warning: This will permanently delete the space and all its contents.");
    console.error("   Add --confirm flag to proceed.");
    console.error(`   Example: node scripts/app-management/space/delete-space.mjs ${spaceId} --confirm`);
    process.exit(1);
  }

  deleteSpace(spaceId).catch((error) => {
    console.error("\n❌ Failed to delete space");
    console.error(error.message);
    process.exit(1);
  });
}
