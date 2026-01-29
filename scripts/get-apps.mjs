#!/usr/bin/env node
/**
 * Get all kintone apps and save to JSON
 * Usage: node scripts/get-apps.mjs
 */

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

const env = loadEnv();
const domain = env.KINTONE_DOMAIN;
const username = env.KINTONE_USERNAME;
const password = env.KINTONE_PASSWORD;

if (!domain || !username || !password) {
  console.error("Error: Missing environment variables");
  console.error(
    "Please ensure .env has KINTONE_DOMAIN, KINTONE_USERNAME, KINTONE_PASSWORD"
  );
  process.exit(1);
}

const baseUrl = `https://${domain}`;

console.log(`\n🔄 Fetching all apps from ${domain}...`);

try {
  const { KintoneRestAPIClient } = await import("@kintone/rest-api-client");
  const client = new KintoneRestAPIClient({
    baseUrl,
    auth: { username, password }
  });

  const apps = await client.app.getApps({});

  // Ensure kintone-app-structure directory exists
  const outputDir = resolve(rootDir, "kintone-app-structure");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const jsonOutputPath = resolve(outputDir, "apps.json");
  writeFileSync(jsonOutputPath, JSON.stringify(apps, null, 2), "utf-8");

  console.log(`✅ Successfully generated kintone-app-structure/apps.json`);
  console.log(`   Total apps: ${apps.apps.length}`);
} catch (error) {
  console.error("\n❌ Failed to fetch apps");
  console.error(error.message);
  process.exit(1);
}
