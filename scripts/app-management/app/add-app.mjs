#!/usr/bin/env node
/**
 * Create a new kintone app (preview)
 *
 * Usage:
 *   node scripts/app-management/add-app.mjs <appName> [spaceId]
 *
 * Examples:
 *   node scripts/app-management/add-app.mjs "顧客管理"
 *   node scripts/app-management/add-app.mjs "顧客管理" 5
 *
 * Note: This creates a preview app. Use deploy-app.mjs to make it live.
 */

import { createKintoneClient } from "../common/index.mjs";

// Parse arguments
const appName = process.argv[2];
const spaceId = process.argv[3];

if (!appName) {
  console.error("Error: App name is required");
  console.error("");
  console.error("Usage: node scripts/app-management/add-app.mjs <appName> [spaceId]");
  console.error("");
  console.error("Examples:");
  console.error('  node scripts/app-management/add-app.mjs "顧客管理"');
  console.error('  node scripts/app-management/add-app.mjs "顧客管理" 5');
  process.exit(1);
}

async function main() {
  const { client, credentials } = await createKintoneClient(import.meta.url);

  console.log(`\n🔄 Creating new app: "${appName}"...`);
  console.log(`   Domain: ${credentials.domain}`);
  if (spaceId) {
    console.log(`   Space ID: ${spaceId}`);
  }

  try {
    const params = { name: appName };
    if (spaceId) {
      params.space = spaceId;
    }

    const result = await client.app.addApp(params);

    console.log(`\n✅ Successfully created preview app`);
    console.log(`   App ID: ${result.app}`);
    console.log(`   Revision: ${result.revision}`);
    console.log("");
    console.log("📝 Next steps:");
    console.log(`   1. Add fields: npm run app:add-fields ${result.app} <fieldsJsonPath>`);
    console.log(`   2. Update layout: npm run app:update-layout ${result.app} <layoutJsonPath>`);
    console.log(`   3. Deploy app: npm run app:deploy ${result.app}`);

    // Return result for programmatic use
    return result;
  } catch (error) {
    console.error("\n❌ Failed to create app");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

main();
