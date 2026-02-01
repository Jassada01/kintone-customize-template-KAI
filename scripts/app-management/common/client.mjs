/**
 * Kintone REST API Client factory
 */

import { getRootDir, loadEnv, getKintoneCredentials } from "./env.mjs";

/**
 * Create a kintone REST API client
 * @param {string} importMetaUrl - import.meta.url from the calling script
 * @returns {Promise<{ client: import("@kintone/rest-api-client").KintoneRestAPIClient, credentials: { domain: string, username: string, password: string, baseUrl: string } }>}
 */
export async function createKintoneClient(importMetaUrl) {
  const rootDir = getRootDir(importMetaUrl);
  const env = loadEnv(rootDir);
  const credentials = getKintoneCredentials(env);

  const { KintoneRestAPIClient } = await import("@kintone/rest-api-client");

  const client = new KintoneRestAPIClient({
    baseUrl: credentials.baseUrl,
    auth: {
      username: credentials.username,
      password: credentials.password
    }
  });

  return { client, credentials };
}

/**
 * Wait for deploy to complete
 * @param {import("@kintone/rest-api-client").KintoneRestAPIClient} client
 * @param {string|number} appId
 * @param {number} maxAttempts - Maximum number of polling attempts (default: 30)
 * @param {number} intervalMs - Polling interval in milliseconds (default: 1000)
 * @returns {Promise<{ success: boolean, status: string }>}
 */
export async function waitForDeploy(
  client,
  appId,
  maxAttempts = 30,
  intervalMs = 1000
) {
  for (let i = 0; i < maxAttempts; i++) {
    const { apps } = await client.app.getDeployStatus({ apps: [appId] });
    const status = apps[0]?.status;

    if (status === "SUCCESS") {
      return { success: true, status };
    }

    if (status === "FAIL" || status === "CANCEL") {
      return { success: false, status };
    }

    // status === "PROCESSING" - continue polling
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return { success: false, status: "TIMEOUT" };
}
