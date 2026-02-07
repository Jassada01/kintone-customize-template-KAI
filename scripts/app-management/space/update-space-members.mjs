#!/usr/bin/env node
/**
 * Update the members of a kintone space
 *
 * Usage (CLI):
 *   node scripts/app-management/space/update-space-members.mjs <spaceId> <membersJsonPath>
 *
 * Usage (Programmatic):
 *   import { updateSpaceMembers } from "./update-space-members.mjs";
 *   await updateSpaceMembers("1", { members: [...] });
 *
 * JSON file format:
 * {
 *   "members": [
 *     { "entity": { "type": "USER", "code": "user1" }, "isAdmin": true },
 *     { "entity": { "type": "GROUP", "code": "group1" }, "isAdmin": false },
 *     { "entity": { "type": "ORGANIZATION", "code": "org1" }, "isAdmin": false, "includeSubs": true }
 *   ]
 * }
 *
 * Note: At least one Space Administrator must be specified.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update the members of a kintone space
 * @param {string|number} spaceId - The space ID
 * @param {Object} membersData - Members data
 * @param {Array} membersData.members - List of members
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object>}
 */
export async function updateSpaceMembers(spaceId, membersData, options = {}) {
  const { silent = false } = options;

  if (!spaceId) {
    throw new Error("Space ID is required");
  }

  const members = membersData.members || membersData;
  if (!Array.isArray(members) || members.length === 0) {
    throw new Error("Members array is required and must not be empty");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Updating members for space ${spaceId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Members to set: ${members.length}`);
  }

  const result = await client.space.updateSpaceMembers({
    id: spaceId,
    members
  });

  if (!silent) {
    console.log(`\n✅ Successfully updated members for space ${spaceId}`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const spaceId = process.argv[2];
  const membersJsonPath = process.argv[3];

  if (!spaceId || !membersJsonPath) {
    console.error("Error: Space ID and members JSON path are required");
    console.error("Usage: node scripts/app-management/space/update-space-members.mjs <spaceId> <membersJsonPath>");
    process.exit(1);
  }

  const rootDir = getRootDir(import.meta.url);
  const jsonPath = resolve(rootDir, membersJsonPath);

  let membersData;
  try {
    const jsonContent = readFileSync(jsonPath, "utf-8");
    membersData = JSON.parse(jsonContent);
  } catch (error) {
    console.error(`Error: Failed to read members JSON from ${membersJsonPath}`);
    console.error(error.message);
    process.exit(1);
  }

  updateSpaceMembers(spaceId, membersData).catch((error) => {
    console.error("\n❌ Failed to update space members");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
