#!/usr/bin/env node
/**
 * Generate kintone field type definitions and form field JSON
 * Usage: node scripts/generate-fields.mjs [appId]
 * Example: node scripts/generate-fields.mjs 51
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// Load .env file
function loadEnv() {
  const envPath = resolve(rootDir, ".env");
  try {
    const envContent = readFileSync(envPath, "utf-8");
    const env = {};
    envContent.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join("=").trim();
      }
    });
    return env;
  } catch (error) {
    console.error("Error: .env file not found");
    console.error("Please create .env file with:");
    console.error("  KINTONE_DOMAIN=xxx.cybozu.com");
    console.error("  KINTONE_USERNAME=your_username");
    console.error("  KINTONE_PASSWORD=your_password");
    process.exit(1);
  }
}

// Get app ID from command line argument
const appId = process.argv[2];

if (!appId) {
  console.error("Error: App ID is required");
  console.error("Usage: node scripts/generate-fields.mjs <appId>");
  console.error("Example: node scripts/generate-fields.mjs 51");
  process.exit(1);
}

const env = loadEnv();
const domain = env.KINTONE_DOMAIN;
const username = env.KINTONE_USERNAME;
const password = env.KINTONE_PASSWORD;

if (!domain || !username || !password) {
  console.error("Error: Missing environment variables");
  console.error("Please ensure .env has KINTONE_DOMAIN, KINTONE_USERNAME, KINTONE_PASSWORD");
  process.exit(1);
}

const baseUrl = `https://${domain}`;
const outputPath = "./src/js/fields.d.ts";
const typeName = `App${appId}Fields`;

console.log(`\n🔄 Generating type definitions for App ${appId}...`);
console.log(`   Domain: ${domain}`);
console.log(`   Output: ${outputPath}`);
console.log(`   Type name: ${typeName}\n`);

try {
  const command = [
    "npx @kintone/dts-gen",
    `--base-url "${baseUrl}"`,
    `-u "${username}"`,
    `-p "${password}"`,
    `--app-id ${appId}`,
    `--type-name ${typeName}`,
    `-o "${outputPath}"`
  ].join(" ");

  execSync(command, {
    cwd: rootDir,
    stdio: "inherit"
  });

  console.log(`\n✅ Successfully generated ${outputPath}`);
  console.log(`   Type name: ${typeName}`);
} catch (error) {
  console.error("\n❌ Failed to generate type definitions");
  console.error(error.message);
  process.exit(1);
}

// Generate Form Field JSON
console.log(`\n🔄 Fetching form fields for App ${appId}...`);

try {
  const { KintoneRestAPIClient } = await import("@kintone/rest-api-client");
  const client = new KintoneRestAPIClient({
    baseUrl,
    auth: { username, password }
  });

  const formFields = await client.app.getFormFields({ app: appId });

  // Ensure kintone-app-structure directory exists
  const formFieldDir = resolve(rootDir, "kintone-app-structure");
  if (!existsSync(formFieldDir)) {
    mkdirSync(formFieldDir, { recursive: true });
  }

  const jsonOutputPath = resolve(formFieldDir, `app_${appId}_formField.json`);
  writeFileSync(jsonOutputPath, JSON.stringify(formFields, null, 2), "utf-8");

  console.log(`✅ Successfully generated kintone-app-structure/app_${appId}_formField.json`);
} catch (error) {
  console.error("\n❌ Failed to fetch form fields");
  console.error(error.message);
  process.exit(1);
}
