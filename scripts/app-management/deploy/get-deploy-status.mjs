#!/usr/bin/env node
/**
 * Get deployment status of kintone apps
 *
 * Usage (CLI):
 *   node scripts/app-management/get-deploy-status.mjs <appId> [appId2] [appId3] ...
 *   node scripts/app-management/get-deploy-status.mjs 51
 *   node scripts/app-management/get-deploy-status.mjs 51 52 53
 *
 * Usage (Programmatic):
 *   import { getDeployStatus } from "./get-deploy-status.mjs";
 *   const status = await getDeployStatus([51, 52]);
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Get deployment status of kintone apps
 * @param {Array<string|number>} appIds - Array of app IDs
 * @param {Object} options
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ apps: Array<{ app: string, status: string }> }>}
 */
export async function getDeployStatus(appIds, options = {}) {
  const { silent = false } = options;

  if (!appIds || appIds.length === 0) {
    throw new Error("At least one App ID is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Checking deploy status...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   Apps: ${appIds.join(", ")}`);
  }

  const result = await client.app.getDeployStatus({ apps: appIds });

  if (!silent) {
    console.log(`\n📊 Deploy Status:`);
    result.apps.forEach((app) => {
      const statusIcon = getStatusIcon(app.status);
      console.log(`   App ${app.app}: ${statusIcon} ${app.status}`);
    });
  }

  return result;
}

/**
 * Get status icon for display
 * @param {string} status
 * @returns {string}
 */
function getStatusIcon(status) {
  switch (status) {
    case "SUCCESS":
      return "✅";
    case "PROCESSING":
      return "⏳";
    case "FAIL":
      return "❌";
    case "CANCEL":
      return "🚫";
    default:
      return "❓";
  }
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appIds = process.argv.slice(2);

  if (appIds.length === 0) {
    console.error("Error: At least one App ID is required");
    console.error("");
    console.error("Usage: node scripts/app-management/get-deploy-status.mjs <appId> [appId2] ...");
    console.error("");
    console.error("Examples:");
    console.error("  node scripts/app-management/get-deploy-status.mjs 51");
    console.error("  node scripts/app-management/get-deploy-status.mjs 51 52 53");
    process.exit(1);
  }

  getDeployStatus(appIds).catch((error) => {
    console.error("\n❌ Failed to get deploy status");
    console.error(error.message);
    process.exit(1);
  });
}
