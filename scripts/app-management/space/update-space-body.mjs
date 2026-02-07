#!/usr/bin/env node
/**
 * Update the body of a kintone space
 *
 * Usage (CLI):
 *   node scripts/app-management/space/update-space-body.mjs <spaceId> <bodyHtmlPath>
 *   node scripts/app-management/space/update-space-body.mjs <spaceId> --inline="<h1>Hello</h1>"
 *
 * Usage (Programmatic):
 *   import { updateSpaceBody } from "./update-space-body.mjs";
 *   await updateSpaceBody("1", "<h1>Space Body</h1>");
 *
 * Note: The body is an HTML string.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update the body of a kintone space
 * @param {string|number} spaceId - The space ID
 * @param {string} body - HTML string for the space body
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object>}
 */
export async function updateSpaceBody(spaceId, body, options = {}) {
  const { silent = false } = options;

  if (!spaceId) {
    throw new Error("Space ID is required");
  }
  if (!body) {
    throw new Error("Body HTML is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Updating body for space ${spaceId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Body length: ${body.length} characters`);
  }

  const result = await client.space.updateSpaceBody({ id: spaceId, body });

  if (!silent) {
    console.log(`\n✅ Successfully updated body for space ${spaceId}`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const spaceId = args.find((arg) => !arg.startsWith("--"));
  const inlineArg = args.find((arg) => arg.startsWith("--inline="));

  if (!spaceId) {
    console.error("Error: Space ID is required");
    console.error("Usage: node scripts/app-management/space/update-space-body.mjs <spaceId> <bodyHtmlPath>");
    console.error('       node scripts/app-management/space/update-space-body.mjs <spaceId> --inline="<h1>Hello</h1>"');
    process.exit(1);
  }

  let body;
  if (inlineArg) {
    body = inlineArg.replace("--inline=", "");
  } else {
    const bodyHtmlPath = args.find((arg) => arg !== spaceId && !arg.startsWith("--"));
    if (!bodyHtmlPath) {
      console.error("Error: Body HTML path or --inline argument is required");
      process.exit(1);
    }
    const rootDir = getRootDir(import.meta.url);
    const htmlPath = resolve(rootDir, bodyHtmlPath);
    try {
      body = readFileSync(htmlPath, "utf-8");
    } catch (error) {
      console.error(`Error: Failed to read HTML file from ${bodyHtmlPath}`);
      console.error(error.message);
      process.exit(1);
    }
  }

  updateSpaceBody(spaceId, body).catch((error) => {
    console.error("\n❌ Failed to update space body");
    console.error(error.message);
    process.exit(1);
  });
}
