#!/usr/bin/env node
/**
 * Update settings of a kintone space
 *
 * Usage (CLI):
 *   node scripts/app-management/space/update-space.mjs <spaceId> <settingsJsonPath>
 *
 * Usage (Programmatic):
 *   import { updateSpace } from "./update-space.mjs";
 *   await updateSpace("1", { name: "New Name", isPrivate: true });
 *
 * JSON file format:
 * {
 *   "name": "New Space Name",
 *   "isPrivate": true,
 *   "fixedMember": false,
 *   "useMultiThread": true,
 *   "showAnnouncement": true,
 *   "showThreadList": true,
 *   "showAppList": true,
 *   "showMemberList": true,
 *   "showRelatedLinkList": true,
 *   "permissions": { "createApp": "EVERYONE" }
 * }
 *
 * Note: All fields except spaceId are optional.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update settings of a kintone space
 * @param {string|number} spaceId - The space ID
 * @param {Object} settings - Space settings to update
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object>}
 */
export async function updateSpace(spaceId, settings, options = {}) {
  const { silent = false } = options;

  if (!spaceId) {
    throw new Error("Space ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Updating space ${spaceId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  const params = { id: spaceId, ...settings };
  const result = await client.space.updateSpace(params);

  if (!silent) {
    console.log(`\n✅ Successfully updated space ${spaceId}`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const spaceId = process.argv[2];
  const settingsJsonPath = process.argv[3];

  if (!spaceId || !settingsJsonPath) {
    console.error("Error: Space ID and settings JSON path are required");
    console.error("Usage: node scripts/app-management/space/update-space.mjs <spaceId> <settingsJsonPath>");
    process.exit(1);
  }

  const rootDir = getRootDir(import.meta.url);
  const jsonPath = resolve(rootDir, settingsJsonPath);

  let settings;
  try {
    const jsonContent = readFileSync(jsonPath, "utf-8");
    settings = JSON.parse(jsonContent);
  } catch (error) {
    console.error(`Error: Failed to read settings JSON from ${settingsJsonPath}`);
    console.error(error.message);
    process.exit(1);
  }

  updateSpace(spaceId, settings).catch((error) => {
    console.error("\n❌ Failed to update space");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
