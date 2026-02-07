#!/usr/bin/env node
/**
 * Add guest users to kintone
 *
 * Usage (CLI):
 *   node scripts/app-management/space/add-guests.mjs <guestsJsonPath>
 *
 * Usage (Programmatic):
 *   import { addGuests } from "./add-guests.mjs";
 *   await addGuests({ guests: [...] });
 *
 * JSON file format:
 * {
 *   "guests": [
 *     {
 *       "name": "Guest User",
 *       "code": "guest@example.com",
 *       "password": "tempPassword123",
 *       "timezone": "Asia/Tokyo",
 *       "locale": "ja",
 *       "company": "Company Name",
 *       "division": "Department",
 *       "phone": "03-1234-5678"
 *     }
 *   ]
 * }
 *
 * Note: This does not affiliate guests with any Guest Space.
 * Use update-space-guests.mjs to add guests to a space.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Add guest users to kintone
 * @param {Object} guestsData - Guests data
 * @param {Array} guestsData.guests - List of guest users
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object>}
 */
export async function addGuests(guestsData, options = {}) {
  const { silent = false } = options;

  const guests = guestsData.guests || guestsData;
  if (!Array.isArray(guests) || guests.length === 0) {
    throw new Error("Guests array is required and must not be empty");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Adding ${guests.length} guest user(s)...`);
    console.log(`   Domain: ${credentials.domain}`);
    guests.forEach((guest) => {
      console.log(`     - ${guest.name} (${guest.code})`);
    });
    console.log("");
    console.log("⚠️  Note: Guest passwords are included in the JSON file. Handle with care.");
  }

  const result = await client.space.addGuests({ guests });

  if (!silent) {
    console.log(`\n✅ Successfully added ${guests.length} guest user(s)`);
    console.log("");
    console.log("📝 Next step:");
    console.log("   Affiliate guests with a Guest Space: npm run guest:update-space <spaceId> <email1> [email2]");
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const guestsJsonPath = process.argv[2];

  if (!guestsJsonPath) {
    console.error("Error: Guests JSON path is required");
    console.error("Usage: node scripts/app-management/space/add-guests.mjs <guestsJsonPath>");
    process.exit(1);
  }

  const rootDir = getRootDir(import.meta.url);
  const jsonPath = resolve(rootDir, guestsJsonPath);

  let guestsData;
  try {
    const jsonContent = readFileSync(jsonPath, "utf-8");
    guestsData = JSON.parse(jsonContent);
  } catch (error) {
    console.error(`Error: Failed to read guests JSON from ${guestsJsonPath}`);
    console.error(error.message);
    process.exit(1);
  }

  addGuests(guestsData).catch((error) => {
    console.error("\n❌ Failed to add guests");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
