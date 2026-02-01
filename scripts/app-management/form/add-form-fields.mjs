#!/usr/bin/env node
/**
 * Add fields to a kintone app form
 *
 * Usage:
 *   node scripts/app-management/add-form-fields.mjs <appId> <fieldsJsonPath>
 *
 * Examples:
 *   node scripts/app-management/add-form-fields.mjs 123 ./fields.json
 *   node scripts/app-management/add-form-fields.mjs 123 ./kintone-app-structure/fields-config.json
 *
 * JSON file format (properties object from getFormFields response):
 * {
 *   "text_field": {
 *     "type": "SINGLE_LINE_TEXT",
 *     "code": "text_field",
 *     "label": "テキスト"
 *   },
 *   "number_field": {
 *     "type": "NUMBER",
 *     "code": "number_field",
 *     "label": "数値"
 *   }
 * }
 *
 * Note: This updates pre-live settings. Use deploy-app.mjs to apply changes.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

// Parse arguments
const appId = process.argv[2];
const fieldsJsonPath = process.argv[3];

if (!appId || !fieldsJsonPath) {
  console.error("Error: App ID and fields JSON path are required");
  console.error("");
  console.error("Usage: node scripts/app-management/add-form-fields.mjs <appId> <fieldsJsonPath>");
  console.error("");
  console.error("Examples:");
  console.error("  node scripts/app-management/add-form-fields.mjs 123 ./fields.json");
  console.error("");
  console.error("JSON file format:");
  console.error(`{
  "text_field": {
    "type": "SINGLE_LINE_TEXT",
    "code": "text_field",
    "label": "テキスト"
  }
}`);
  process.exit(1);
}

async function main() {
  const { client, credentials } = await createKintoneClient(import.meta.url);
  const rootDir = getRootDir(import.meta.url);

  // Load fields JSON
  const jsonPath = resolve(rootDir, fieldsJsonPath);
  let properties;

  try {
    const jsonContent = readFileSync(jsonPath, "utf-8");
    const parsed = JSON.parse(jsonContent);
    // Support both { properties: {...} } and direct properties object
    properties = parsed.properties || parsed;
  } catch (error) {
    console.error(`Error: Failed to read fields JSON from ${fieldsJsonPath}`);
    console.error(error.message);
    process.exit(1);
  }

  const fieldCount = Object.keys(properties).length;
  console.log(`\n🔄 Adding ${fieldCount} field(s) to App ${appId}...`);
  console.log(`   Domain: ${credentials.domain}`);
  console.log(`   Source: ${fieldsJsonPath}`);

  try {
    const result = await client.app.addFormFields({
      app: appId,
      properties
    });

    console.log(`\n✅ Successfully added fields to App ${appId}`);
    console.log(`   Revision: ${result.revision}`);
    console.log("");
    console.log("📝 Next steps:");
    console.log(`   1. Update layout (optional): npm run app:update-layout ${appId} <layoutJsonPath>`);
    console.log(`   2. Deploy app: npm run app:deploy ${appId}`);

    return result;
  } catch (error) {
    console.error("\n❌ Failed to add form fields");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

main();
