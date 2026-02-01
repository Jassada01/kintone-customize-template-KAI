/**
 * Environment variable loader for kintone scripts
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

/**
 * Get root directory of the project
 * @param {string} importMetaUrl - import.meta.url from the calling script
 * @returns {string} Root directory path
 */
export function getRootDir(importMetaUrl) {
  const callerDir = dirname(fileURLToPath(importMetaUrl));
  // Find root by looking for package.json
  let currentDir = callerDir;

  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(currentDir, "package.json"))) {
      return currentDir;
    }
    currentDir = resolve(currentDir, "..");
  }

  // Fallback: assume scripts/app-management/<subfolder> -> root (4 levels up)
  return resolve(callerDir, "../../../..");
}

/**
 * Load environment variables from .env file
 * @param {string} rootDir - Root directory path
 * @returns {Object} Environment variables object
 */
export function loadEnv(rootDir) {
  const envPath = resolve(rootDir, ".env");
  try {
    const envContent = readFileSync(envPath, "utf-8");
    const env = {};
    envContent.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) return;
      const [key, ...valueParts] = trimmedLine.split("=");
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

/**
 * Get kintone credentials from environment
 * @param {Object} env - Environment variables object
 * @returns {{ domain: string, username: string, password: string, baseUrl: string }}
 */
export function getKintoneCredentials(env) {
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

  return {
    domain,
    username,
    password,
    baseUrl: `https://${domain}`
  };
}
