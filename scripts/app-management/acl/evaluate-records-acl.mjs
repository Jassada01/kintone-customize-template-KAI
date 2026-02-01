#!/usr/bin/env node
/**
 * Evaluate record permissions for specific records
 *
 * Usage (CLI):
 *   node scripts/app-management/acl/evaluate-records-acl.mjs <appId> <recordId1> [recordId2] ...
 *
 * Usage (Programmatic):
 *   import { evaluateRecordsAcl } from "./evaluate-records-acl.mjs";
 *   const result = await evaluateRecordsAcl("51", [1, 2, 3]);
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Evaluate record permissions
 * @param {string|number} appId - The app ID
 * @param {Array<string|number>} ids - Array of record IDs
 * @param {Object} options
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ rights: Array }>}
 */
export async function evaluateRecordsAcl(appId, ids, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  if (!ids || ids.length === 0) {
    throw new Error("At least one record ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Evaluating record permissions for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Records: ${ids.join(", ")}`);
  }

  const result = await client.app.evaluateRecordsAcl({
    app: appId,
    ids: ids.map((id) => ({ id: String(id) }))
  });

  if (!silent) {
    console.log(`\n📊 Record Permissions:`);
    result.rights.forEach((right) => {
      console.log(`   Record ${right.id}:`);
      console.log(`     viewable: ${right.record.viewable}`);
      console.log(`     editable: ${right.record.editable}`);
      console.log(`     deletable: ${right.record.deletable}`);
    });
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const appId = args[0];
  const recordIds = args.slice(1);

  if (!appId || recordIds.length === 0) {
    console.error("Error: App ID and at least one record ID are required");
    console.error("Usage: node scripts/app-management/acl/evaluate-records-acl.mjs <appId> <recordId1> [recordId2] ...");
    console.error("Example: node scripts/app-management/acl/evaluate-records-acl.mjs 51 1 2 3");
    process.exit(1);
  }

  evaluateRecordsAcl(appId, recordIds).catch((error) => {
    console.error("\n❌ Failed to evaluate record permissions");
    console.error(error.message);
    process.exit(1);
  });
}
