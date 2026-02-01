#!/usr/bin/env node
/**
 * Update report (graph) settings of a kintone app
 *
 * Usage (CLI):
 *   node scripts/app-management/reports/update-reports.mjs <appId> <reportsJsonPath>
 *
 * Usage (Programmatic):
 *   import { updateReports } from "./update-reports.mjs";
 *   await updateReports("51", { reports: {...} });
 *
 * JSON file format:
 * {
 *   "reports": {
 *     "売上グラフ": {
 *       "chartType": "BAR",
 *       "chartMode": "NORMAL",
 *       "name": "売上グラフ",
 *       "index": "0",
 *       "groups": [
 *         { "code": "category_field" }
 *       ],
 *       "aggregations": [
 *         { "type": "SUM", "code": "amount_field" }
 *       ],
 *       "filterCond": "",
 *       "sorts": [
 *         { "by": "TOTAL", "order": "DESC" }
 *       ]
 *     }
 *   }
 * }
 *
 * chartType: BAR, COLUMN, PIE, LINE, PIVOT_TABLE, TABLE, AREA, SPLINE, SPLINE_AREA
 *
 * Note: This updates pre-live settings. Use deploy to apply changes.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Update report settings
 * @param {string|number} appId - The app ID
 * @param {Object} reportsSettings - Reports settings
 * @param {Object} reportsSettings.reports - Reports object
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ revision: string, reports: Object }>}
 */
export async function updateReports(appId, reportsSettings, options = {}) {
  const { silent = false } = options;

  if (!appId) {
    throw new Error("App ID is required");
  }

  const reports = reportsSettings.reports || reportsSettings;
  if (!reports || Object.keys(reports).length === 0) {
    throw new Error("Reports object is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  const reportCount = Object.keys(reports).length;
  if (!silent) {
    console.log(`\n🔄 Updating ${reportCount} report(s) for App ${appId}...`);
    console.log(`   Domain: ${credentials.domain}`);
  }

  const result = await client.app.updateReports({
    app: appId,
    reports
  });

  if (!silent) {
    console.log(`\n✅ Successfully updated reports for App ${appId}`);
    console.log(`   Revision: ${result.revision}`);
    console.log("");
    console.log("📝 Next step:");
    console.log(`   Deploy app: npm run app:deploy ${appId}`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appId = process.argv[2];
  const reportsJsonPath = process.argv[3];

  if (!appId || !reportsJsonPath) {
    console.error("Error: App ID and reports JSON path are required");
    console.error("Usage: node scripts/app-management/reports/update-reports.mjs <appId> <reportsJsonPath>");
    process.exit(1);
  }

  const rootDir = getRootDir(import.meta.url);
  const jsonPath = resolve(rootDir, reportsJsonPath);

  let reportsSettings;
  try {
    const jsonContent = readFileSync(jsonPath, "utf-8");
    reportsSettings = JSON.parse(jsonContent);
  } catch (error) {
    console.error(`Error: Failed to read reports JSON from ${reportsJsonPath}`);
    console.error(error.message);
    process.exit(1);
  }

  updateReports(appId, reportsSettings).catch((error) => {
    console.error("\n❌ Failed to update reports");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
