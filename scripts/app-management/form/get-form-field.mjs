#!/usr/bin/env node
/**
 * Generate kintone field type definitions and form field JSON
 *
 * Usage (CLI):
 *   node scripts/app-management/get-form-field.mjs <appId>
 *   node scripts/app-management/get-form-field.mjs 51
 *
 * Usage (Programmatic):
 *   import { getFormFields } from "./get-form-field.mjs";
 *   const fields = await getFormFields("51");
 */

import { execSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir, getKintoneCredentials, loadEnv } from "../common/index.mjs";

/**
 * Get form fields and generate TypeScript definitions
 * @param {string|number} appId - The app ID
 * @param {Object} options
 * @param {boolean} [options.generateTypes=true] - Whether to generate TypeScript definitions
 * @param {boolean} [options.saveToFile=true] - Whether to save result to JSON file
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ properties: Object, revision: string }>}
 */
export async function getFormFields(appId, options = {}) {
  const { generateTypes = true, saveToFile = true, silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const rootDir = getRootDir(import.meta.url);
  const env = loadEnv(rootDir);
  const credentials = getKintoneCredentials(env);

  // Generate TypeScript definitions
  if (generateTypes) {
    const outputPath = "./src/js/fields.d.ts";
    const typeName = `App${appId}Fields`;

    if (!silent) {
      console.log(`\n🔄 Generating type definitions for App ${appId}...`);
      console.log(`   Domain: ${credentials.domain}`);
      console.log(`   Output: ${outputPath}`);
      console.log(`   Type name: ${typeName}\n`);
    }

    const command = [
      "npx @kintone/dts-gen",
      `--base-url "${credentials.baseUrl}"`,
      `-u "${credentials.username}"`,
      `-p "${credentials.password}"`,
      `--app-id ${appId}`,
      `--type-name ${typeName}`,
      `-o "${outputPath}"`
    ].join(" ");

    execSync(command, {
      cwd: rootDir,
      stdio: silent ? "ignore" : "inherit"
    });

    if (!silent) {
      console.log(`\n✅ Successfully generated ${outputPath}`);
      console.log(`   Type name: ${typeName}`);
    }
  }

  // Fetch form fields
  if (!silent) {
    console.log(`\n🔄 Fetching form fields for App ${appId}...`);
  }

  const { client } = await createKintoneClient(import.meta.url);
  const formFields = await client.app.getFormFields({ app: appId });

  if (saveToFile) {
    const formFieldDir = resolve(rootDir, "kintone-app-structure");
    if (!existsSync(formFieldDir)) {
      mkdirSync(formFieldDir, { recursive: true });
    }

    const jsonOutputPath = resolve(formFieldDir, `app_${appId}_formField.json`);
    writeFileSync(jsonOutputPath, JSON.stringify(formFields, null, 2), "utf-8");

    if (!silent) {
      console.log(`✅ Successfully generated kintone-app-structure/app_${appId}_formField.json`);
    }
  }

  return formFields;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appId = process.argv[2];

  if (!appId) {
    console.error("Error: App ID is required");
    console.error("Usage: node scripts/app-management/get-form-field.mjs <appId>");
    console.error("Example: node scripts/app-management/get-form-field.mjs 51");
    process.exit(1);
  }

  getFormFields(appId).catch((error) => {
    console.error("\n❌ Failed to get form fields");
    console.error(error.message);
    process.exit(1);
  });
}
