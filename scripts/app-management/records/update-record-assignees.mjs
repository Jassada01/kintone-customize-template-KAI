#!/usr/bin/env node
/**
 * Update assignees of a record (Process Management)
 *
 * Usage (CLI):
 *   node scripts/app-management/records/update-record-assignees.mjs <appId> <recordId> <assignee1> [assignee2...]
 *   node scripts/app-management/records/update-record-assignees.mjs <appId> <recordId> --clear
 *
 * Usage (Programmatic):
 *   import { updateRecordAssignees } from "./update-record-assignees.mjs";
 *   await updateRecordAssignees("51", "1", { assignees: ["user1", "user2"] });
 *
 * Note: This requires Process Management to be enabled on the app.
 * Assignees are login names (user codes).
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Update record assignees
 * @param {string|number} appId - The app ID
 * @param {string|number} recordId - The record ID
 * @param {Object} params - Update parameters
 * @param {string[]} params.assignees - Array of user codes (login names)
 * @param {string|number} [params.revision] - Expected revision number
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ revision: string }>}
 */
export async function updateRecordAssignees(appId, recordId, params, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }
  if (!recordId) {
    throw new Error("Record ID is required");
  }
  if (!params.assignees || !Array.isArray(params.assignees)) {
    throw new Error("Assignees array is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Updating assignees for record ${recordId} in App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Assignees: ${params.assignees.length === 0 ? "(none)" : params.assignees.join(", ")}`);
  }

  const requestParams = {
    app: appId,
    id: recordId,
    assignees: params.assignees
  };
  if (params.revision) requestParams.revision = params.revision;

  const result = await client.record.updateRecordAssignees(requestParams);

  if (!silent) {
    console.log(`\n✅ Successfully updated assignees`);
    console.log(`   Revision: ${result.revision}`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const appId = args[0];
  const recordId = args[1];
  const clear = args.includes("--clear");

  let assignees;
  if (clear) {
    assignees = [];
  } else {
    assignees = args.slice(2).filter(arg => !arg.startsWith("--"));
  }

  if (!appId || !recordId) {
    console.error("Error: App ID and Record ID are required");
    console.error("Usage: node scripts/app-management/records/update-record-assignees.mjs <appId> <recordId> <assignee1> [assignee2...]");
    console.error("       node scripts/app-management/records/update-record-assignees.mjs <appId> <recordId> --clear");
    process.exit(1);
  }

  updateRecordAssignees(appId, recordId, { assignees }).catch((error) => {
    console.error("\n❌ Failed to update assignees");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
