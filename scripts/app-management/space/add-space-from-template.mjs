#!/usr/bin/env node
/**
 * Create a kintone space from a space template
 *
 * Usage (CLI):
 *   node scripts/app-management/space/add-space-from-template.mjs <templateId> <spaceName> <membersJsonPath> [--private] [--guest] [--fixed-member]
 *
 * Usage (Programmatic):
 *   import { addSpaceFromTemplate } from "./add-space-from-template.mjs";
 *   const result = await addSpaceFromTemplate("1", "Space Name", { members: [...] });
 *
 * Members JSON file format:
 * {
 *   "members": [
 *     { "entity": { "type": "USER", "code": "user1" }, "isAdmin": true },
 *     { "entity": { "type": "GROUP", "code": "group1" }, "isAdmin": false }
 *   ]
 * }
 *
 * Note: At least one Space Administrator must be specified.
 * Space Template ID can be found at: https://{domain}.kintone.com/k/admin/system/spacetemplate/
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Create a kintone space from a space template
 * @param {string|number} templateId - The space template ID
 * @param {string} spaceName - The new space name
 * @param {Object} membersData - Members data
 * @param {Array} membersData.members - List of members
 * @param {Object} [options]
 * @param {boolean} [options.isPrivate=false] - Whether the space is private
 * @param {boolean} [options.isGuest=false] - Whether the space is a guest space
 * @param {boolean} [options.fixedMember=false] - Whether to block users from joining/leaving
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ id: string }>} Created space ID
 */
export async function addSpaceFromTemplate(templateId, spaceName, membersData, options = {}) {
  const { isPrivate = false, isGuest = false, fixedMember = false, silent = false } = options;

  if (!templateId) {
    throw new Error("Template ID is required");
  }
  if (!spaceName) {
    throw new Error("Space name is required");
  }

  const members = membersData.members || membersData;
  if (!Array.isArray(members) || members.length === 0) {
    throw new Error("Members array is required and must not be empty");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Creating space from template ${templateId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Space name: ${spaceName}`);
    console.log(`   Members: ${members.length}`);
    if (isPrivate) console.log(`   Private: true`);
    if (isGuest) console.log(`   Guest Space: true`);
    if (fixedMember) console.log(`   Fixed Member: true`);
  }

  const params = {
    id: templateId,
    name: spaceName,
    members
  };
  if (isPrivate) params.isPrivate = true;
  if (isGuest) params.isGuest = true;
  if (fixedMember) params.fixedMember = true;

  const result = await client.space.addSpaceFromTemplate(params);

  if (!silent) {
    console.log(`\n✅ Successfully created space`);
    console.log(`   Space ID: ${result.id}`);
    console.log(`   URL: https://${credentials.domain}/k/#/space/${result.id}/`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const positionalArgs = args.filter((arg) => !arg.startsWith("--"));
  const templateId = positionalArgs[0];
  const spaceName = positionalArgs[1];
  const membersJsonPath = positionalArgs[2];

  if (!templateId || !spaceName || !membersJsonPath) {
    console.error("Error: Template ID, space name, and members JSON path are required");
    console.error('Usage: node scripts/app-management/space/add-space-from-template.mjs <templateId> "Space Name" <membersJsonPath> [--private] [--guest] [--fixed-member]');
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

  const options = {
    isPrivate: args.includes("--private"),
    isGuest: args.includes("--guest"),
    fixedMember: args.includes("--fixed-member")
  };

  addSpaceFromTemplate(templateId, spaceName, membersData, options).catch((error) => {
    console.error("\n❌ Failed to create space from template");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
