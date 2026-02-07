#!/usr/bin/env node
/**
 * Get the list of space members of a kintone space
 *
 * Usage (CLI):
 *   node scripts/app-management/space/get-space-members.mjs <spaceId>
 *
 * Usage (Programmatic):
 *   import { getSpaceMembers } from "./get-space-members.mjs";
 *   const members = await getSpaceMembers("1");
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Get the list of space members of a kintone space
 * @param {string|number} spaceId - The space ID
 * @param {Object} [options]
 * @param {boolean} [options.saveToFile=true] - Whether to save result to JSON file
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ members: Array }>}
 */
export async function getSpaceMembers(spaceId, options = {}) {
  const { saveToFile = true, silent = false } = options;

  if (!spaceId) {
    throw new Error("Space ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);
  const rootDir = getRootDir(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching members for space ${spaceId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  const result = await client.space.getSpaceMembers({ id: spaceId });

  if (!silent) {
    const members = result.members || [];
    console.log(`   Total members: ${members.length}`);

    const admins = members.filter((m) => m.isAdmin);
    if (admins.length > 0) {
      console.log(`   Admins: ${admins.map((m) => m.entity.code).join(", ")}`);
    }

    const byType = {};
    members.forEach((m) => {
      const type = m.entity.type;
      byType[type] = (byType[type] || 0) + 1;
    });
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
  }

  if (saveToFile) {
    const outputDir = resolve(rootDir, "kintone-app-structure");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const jsonOutputPath = resolve(outputDir, `space_${spaceId}_members.json`);
    writeFileSync(jsonOutputPath, JSON.stringify(result, null, 2), "utf-8");

    if (!silent) {
      console.log(`\n✅ Successfully generated kintone-app-structure/space_${spaceId}_members.json`);
    }
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const spaceId = process.argv[2];

  if (!spaceId) {
    console.error("Error: Space ID is required");
    console.error("Usage: node scripts/app-management/space/get-space-members.mjs <spaceId>");
    process.exit(1);
  }

  getSpaceMembers(spaceId).catch((error) => {
    console.error("\n❌ Failed to get space members");
    console.error(error.message);
    process.exit(1);
  });
}
