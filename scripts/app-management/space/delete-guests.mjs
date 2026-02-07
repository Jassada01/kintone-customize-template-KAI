#!/usr/bin/env node
/**
 * Delete guest users from kintone
 *
 * Usage (CLI):
 *   node scripts/app-management/space/delete-guests.mjs <email1> [email2] ... --confirm
 *
 * Usage (Programmatic):
 *   import { deleteGuests } from "./delete-guests.mjs";
 *   await deleteGuests(["guest1@example.com", "guest2@example.com"]);
 *
 * Note: The --confirm flag is required for CLI usage.
 * Up to 100 guests can be deleted at once.
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Delete guest users from kintone
 * @param {Array<string>} guestEmails - List of guest email addresses
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<Object>}
 */
export async function deleteGuests(guestEmails, options = {}) {
  const { silent = false } = options;

  if (!Array.isArray(guestEmails) || guestEmails.length === 0) {
    throw new Error("At least one guest email is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Deleting ${guestEmails.length} guest user(s)...`);
    console.log(`   Domain: ${credentials.domain}`);
    guestEmails.forEach((email) => {
      console.log(`     - ${email}`);
    });
  }

  const result = await client.space.deleteGuests({ guests: guestEmails });

  if (!silent) {
    console.log(`\n✅ Successfully deleted ${guestEmails.length} guest user(s)`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const emails = args.filter((arg) => !arg.startsWith("--"));
  const confirm = args.includes("--confirm");

  if (emails.length === 0) {
    console.error("Error: At least one guest email is required");
    console.error("Usage: node scripts/app-management/space/delete-guests.mjs <email1> [email2] ... --confirm");
    process.exit(1);
  }

  if (!confirm) {
    console.error("⚠️  Warning: This will permanently delete the following guest user(s):");
    emails.forEach((email) => {
      console.error(`     - ${email}`);
    });
    console.error("   Add --confirm flag to proceed.");
    process.exit(1);
  }

  deleteGuests(emails).catch((error) => {
    console.error("\n❌ Failed to delete guests");
    console.error(error.message);
    process.exit(1);
  });
}
