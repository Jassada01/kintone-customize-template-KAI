#!/usr/bin/env node
/**
 * Update form layout of a kintone app
 *
 * Usage:
 *   node scripts/app-management/update-form-layout.mjs <appId> <layoutJsonPath>
 *
 * Examples:
 *   node scripts/app-management/update-form-layout.mjs 123 ./layout.json
 *   node scripts/app-management/update-form-layout.mjs 123 ./kintone-app-structure/app_123_formLayout.json
 *
 * JSON file format (layout array from getFormLayout response):
 * {
 *   "layout": [
 *     {
 *       "type": "ROW",
 *       "fields": [
 *         { "type": "SINGLE_LINE_TEXT", "code": "text_field", "size": { "width": "200" } }
 *       ]
 *     },
 *     {
 *       "type": "ROW",
 *       "fields": [
 *         { "type": "NUMBER", "code": "number_field", "size": { "width": "100" } }
 *       ]
 *     }
 *   ]
 * }
 *
 * Note: This updates pre-live settings. Use deploy-app.mjs to apply changes.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

// Parse arguments
const appId = process.argv[2];
const layoutJsonPath = process.argv[3];

if (!appId || !layoutJsonPath) {
  console.error("Error: App ID and layout JSON path are required");
  console.error("");
  console.error("Usage: node scripts/app-management/update-form-layout.mjs <appId> <layoutJsonPath>");
  console.error("");
  console.error("Examples:");
  console.error("  node scripts/app-management/update-form-layout.mjs 123 ./layout.json");
  console.error("");
  console.error("JSON file format:");
  console.error(`{
  "layout": [
    {
      "type": "ROW",
      "fields": [
        { "type": "SINGLE_LINE_TEXT", "code": "text_field", "size": { "width": "200" } }
      ]
    }
  ]
}`);
  process.exit(1);
}

async function main() {
  const { client, credentials } = await createKintoneClient(import.meta.url);
  const rootDir = getRootDir(import.meta.url);

  // Load layout JSON
  const jsonPath = resolve(rootDir, layoutJsonPath);
  let layout;

  try {
    const jsonContent = readFileSync(jsonPath, "utf-8");
    const parsed = JSON.parse(jsonContent);
    // Support both { layout: [...] } and direct layout array
    layout = parsed.layout || parsed;

    if (!Array.isArray(layout)) {
      throw new Error("Layout must be an array");
    }
  } catch (error) {
    console.error(`Error: Failed to read layout JSON from ${layoutJsonPath}`);
    console.error(error.message);
    process.exit(1);
  }

  console.log(`\n🔄 Updating form layout for App ${appId}...`);
  console.log(`   Domain: ${credentials.domain}`);
  console.log(`   Source: ${layoutJsonPath}`);
  console.log(`   Rows: ${layout.length}`);

  try {
    const result = await client.app.updateFormLayout({
      app: appId,
      layout
    });

    console.log(`\n✅ Successfully updated form layout for App ${appId}`);
    console.log(`   Revision: ${result.revision}`);
    console.log("");
    console.log("📝 Next step:");
    console.log(`   Deploy app: npm run app:deploy ${appId}`);

    return result;
  } catch (error) {
    console.error("\n❌ Failed to update form layout");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

main();
