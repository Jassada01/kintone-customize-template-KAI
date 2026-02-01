#!/usr/bin/env node
/**
 * Update status of a single record (Process Management)
 *
 * Usage (CLI):
 *   node scripts/app-management/records/update-record-status.mjs <appId> <recordId> "<action>" [--assignee=<user>]
 *
 * Usage (Programmatic):
 *   import { updateRecordStatus } from "./update-record-status.mjs";
 *   await updateRecordStatus("51", "1", {
 *     action: "Approve",
 *     assignee: "next_user"
 *   });
 *
 * Note: This requires Process Management to be enabled on the app.
 * The action name must match exactly (including localization).
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Update record status
 * @param {string|number} appId - The app ID
 * @param {string|number} recordId - The record ID
 * @param {Object} params - Update parameters
 * @param {string} params.action - Action name to execute
 * @param {string} [params.assignee] - Next assignee (user code)
 * @param {string|number} [params.revision] - Expected revision number
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ revision: string }>}
 */
export async function updateRecordStatus(appId, recordId, params, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }
  if (!recordId) {
    throw new Error("Record ID is required");
  }
  if (!params.action) {
    throw new Error("Action name is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Updating status for record ${recordId} in App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Action: ${params.action}`);
    if (params.assignee) console.log(`   Next assignee: ${params.assignee}`);
  }

  const requestParams = {
    app: appId,
    id: recordId,
    action: params.action
  };
  if (params.assignee) requestParams.assignee = params.assignee;
  if (params.revision) requestParams.revision = params.revision;

  const result = await client.record.updateRecordStatus(requestParams);

  if (!silent) {
    console.log(`\n✅ Successfully updated status`);
    console.log(`   Revision: ${result.revision}`);
    console.log(`   (Revision increases by 2: action + status update)`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const appId = args[0];
  const recordId = args[1];
  const action = args[2];
  const assigneeArg = args.find(arg => arg.startsWith("--assignee="));

  if (!appId || !recordId || !action) {
    console.error("Error: App ID, Record ID, and action are required");
    console.error("Usage: node scripts/app-management/records/update-record-status.mjs <appId> <recordId> \"<action>\" [--assignee=<user>]");
    process.exit(1);
  }

  const params = { action };
  if (assigneeArg) params.assignee = assigneeArg.replace("--assignee=", "");

  updateRecordStatus(appId, recordId, params).catch((error) => {
    console.error("\n❌ Failed to update status");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
