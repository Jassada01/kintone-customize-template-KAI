#!/usr/bin/env node
/**
 * Update guest members of a kintone guest space
 *
 * Usage (CLI):
 *   node scripts/app-management/space/update-space-guests.mjs <spaceId> <email1> [email2] ...
 *   node scripts/app-management/space/update-space-guests.mjs <spaceId> --json=<guestsJsonPath>
 *
 * Usage (Programmatic):
 *   import { updateSpaceGuests } from "./update-space-guests.mjs";
 *   await updateSpaceGuests("1", ["guest1@example.com", "guest2@example.com"]);
 *
 * JSON file format:
 * {
 *   "guests": ["guest1@example.com", "guest2@example.com"]
 * }
 *
 * Note: Guests must first be added using add-guests.mjs before affiliating with a space.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update guest members of a kintone guest space
 * @param {string|number} spaceId - The guest space ID
 * @param {Array<string>} guestEmails - List of guest email addresses
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object>}
 */
export async function updateSpaceGuests(spaceId, guestEmails, options = {}) {
  const { silent = false } = options;

  if (!spaceId) {
    throw new Error("Space ID is required");
  }
  if (!Array.isArray(guestEmails) || guestEmails.length === 0) {
    throw new Error("At least one guest email is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Updating guest members for space ${spaceId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Guests: ${guestEmails.length}`);
    guestEmails.forEach((email) => {
      console.log(`     - ${email}`);
    });
  }

  const result = await client.space.updateSpaceGuests({
    id: spaceId,
    guests: guestEmails
  });

  if (!silent) {
    console.log(`\n✅ Successfully updated guest members for space ${spaceId}`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const jsonArg = args.find((arg) => arg.startsWith("--json="));
  const positionalArgs = args.filter((arg) => !arg.startsWith("--"));
  const spaceId = positionalArgs[0];

  if (!spaceId) {
    console.error("Error: Space ID is required");
    console.error("Usage: node scripts/app-management/space/update-space-guests.mjs <spaceId> <email1> [email2] ...");
    console.error("       node scripts/app-management/space/update-space-guests.mjs <spaceId> --json=<guestsJsonPath>");
    process.exit(1);
  }

  let guestEmails;
  if (jsonArg) {
    const rootDir = getRootDir(import.meta.url);
    const jsonPath = resolve(rootDir, jsonArg.replace("--json=", ""));
    try {
      const jsonContent = readFileSync(jsonPath, "utf-8");
      const data = JSON.parse(jsonContent);
      guestEmails = data.guests || data;
    } catch (error) {
      console.error(`Error: Failed to read guests JSON`);
      console.error(error.message);
      process.exit(1);
    }
  } else {
    guestEmails = positionalArgs.slice(1);
  }

  if (!guestEmails || guestEmails.length === 0) {
    console.error("Error: At least one guest email is required");
    process.exit(1);
  }

  updateSpaceGuests(spaceId, guestEmails).catch((error) => {
    console.error("\n❌ Failed to update space guests");
    console.error(error.message);
    process.exit(1);
  });
}
