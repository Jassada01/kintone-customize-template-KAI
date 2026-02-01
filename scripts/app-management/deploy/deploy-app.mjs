#!/usr/bin/env node
/**
 * Deploy kintone app settings (pre-live to live)
 *
 * Usage:
 *   node scripts/app-management/deploy-app.mjs <appId> [--revert] [--no-wait]
 *
 * Examples:
 *   node scripts/app-management/deploy-app.mjs 123
 *   node scripts/app-management/deploy-app.mjs 123 --revert
 *   node scripts/app-management/deploy-app.mjs 123 --no-wait
 *
 * Options:
 *   --revert   Revert pre-live settings to current live settings
 *   --no-wait  Don't wait for deployment to complete
 */

import { createKintoneClient, waitForDeploy } from "../common/index.mjs";

// Parse arguments
const args = process.argv.slice(2);
const appId = args.find((arg) => !arg.startsWith("--"));
const revert = args.includes("--revert");
const noWait = args.includes("--no-wait");

if (!appId) {
  console.error("Error: App ID is required");
  console.error("");
  console.error("Usage: node scripts/app-management/deploy-app.mjs <appId> [--revert] [--no-wait]");
  console.error("");
  console.error("Examples:");
  console.error("  node scripts/app-management/deploy-app.mjs 123");
  console.error("  node scripts/app-management/deploy-app.mjs 123 --revert");
  console.error("  node scripts/app-management/deploy-app.mjs 123 --no-wait");
  console.error("");
  console.error("Options:");
  console.error("  --revert   Revert pre-live settings to current live settings");
  console.error("  --no-wait  Don't wait for deployment to complete");
  process.exit(1);
}

async function main() {
  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (revert) {
    console.log(`\n🔄 Reverting pre-live settings for App ${appId}...`);
  } else {
    console.log(`\n🔄 Deploying App ${appId}...`);
  }
  console.log(`   Domain: ${credentials.domain}`);

  try {
    await client.app.deployApp({
      apps: [{ app: appId }],
      revert
    });

    if (revert) {
      console.log(`\n✅ Successfully reverted pre-live settings for App ${appId}`);
      return { success: true, status: "REVERTED" };
    }

    if (noWait) {
      console.log(`\n✅ Deployment started for App ${appId}`);
      console.log("   Use --no-wait flag removed to wait for completion");
      return { success: true, status: "PROCESSING" };
    }

    // Wait for deployment to complete
    console.log("   Waiting for deployment to complete...");
    const result = await waitForDeploy(client, appId);

    if (result.success) {
      console.log(`\n✅ Successfully deployed App ${appId}`);
      console.log(`   Status: ${result.status}`);
    } else {
      console.error(`\n❌ Deployment failed for App ${appId}`);
      console.error(`   Status: ${result.status}`);
      process.exit(1);
    }

    return result;
  } catch (error) {
    console.error("\n❌ Failed to deploy app");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

main();
