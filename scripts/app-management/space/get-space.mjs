#!/usr/bin/env node
/**
 * Get general information of a kintone space
 *
 * Usage (CLI):
 *   node scripts/app-management/space/get-space.mjs <spaceId>
 *
 * Usage (Programmatic):
 *   import { getSpace } from "./get-space.mjs";
 *   const space = await getSpace("1");
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Get general information of a kintone space
 * @param {string|number} spaceId - The space ID
 * @param {Object} [options]
 * @param {boolean} [options.saveToFile=true] - Whether to save result to JSON file
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object>} Space information
 */
export async function getSpace(spaceId, options = {}) {
  const { saveToFile = true, silent = false } = options;

  if (!spaceId) {
    throw new Error("Space ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);
  const rootDir = getRootDir(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Fetching space ${spaceId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  const result = await client.space.getSpace({ id: spaceId });

  if (!silent) {
    console.log(`   Name: ${result.name}`);
    console.log(`   Members: ${result.memberCount}`);
    console.log(`   Private: ${result.isPrivate}`);
    console.log(`   Multi-thread: ${result.useMultiThread}`);
    console.log(`   Guest Space: ${result.isGuest}`);
    if (result.attachedApps && result.attachedApps.length > 0) {
      console.log(`   Attached Apps: ${result.attachedApps.length}`);
      result.attachedApps.forEach((app) => {
        console.log(`     - [${app.appId}] ${app.name}`);
      });
    }
  }

  if (saveToFile) {
    const outputDir = resolve(rootDir, "kintone-app-structure");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const jsonOutputPath = resolve(outputDir, `space_${spaceId}_info.json`);
    writeFileSync(jsonOutputPath, JSON.stringify(result, null, 2), "utf-8");

    if (!silent) {
      console.log(`\n✅ Successfully generated kintone-app-structure/space_${spaceId}_info.json`);
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
    console.error("Usage: node scripts/app-management/space/get-space.mjs <spaceId>");
    process.exit(1);
  }

  getSpace(spaceId).catch((error) => {
    console.error("\n❌ Failed to get space");
    console.error(error.message);
    process.exit(1);
  });
}
