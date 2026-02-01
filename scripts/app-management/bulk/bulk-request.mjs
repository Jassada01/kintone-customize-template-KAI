#!/usr/bin/env node
/**
 * Execute multiple API requests in a single call
 *
 * Usage (CLI):
 *   node scripts/app-management/bulk/bulk-request.mjs <requestsJsonPath>
 *
 * Usage (Programmatic):
 *   import { bulkRequest } from "./bulk-request.mjs";
 *   const results = await bulkRequest([
 *     { method: "POST", api: "/k/v1/record.json", payload: { app: "1", record: {...} } },
 *     { method: "PUT", api: "/k/v1/record.json", payload: { app: "1", id: "10", record: {...} } }
 *   ]);
 *
 * JSON file format:
 * [
 *   {
 *     "method": "POST",
 *     "api": "/k/v1/record.json",
 *     "payload": { "app": "1", "record": { "field": { "value": "test" } } }
 *   },
 *   {
 *     "method": "PUT",
 *     "api": "/k/v1/record.json",
 *     "payload": { "app": "1", "id": "10", "record": { "field": { "value": "updated" } } }
 *   },
 *   {
 *     "method": "DELETE",
 *     "api": "/k/v1/records.json",
 *     "payload": { "app": "1", "ids": ["1", "2"] }
 *   }
 * ]
 *
 * Supported APIs:
 *   - Record: addRecord, updateRecord, deleteRecords, updateRecordStatus, updateRecordAssignees
 *   - Records: addRecords, updateRecords
 *
 * Note: Maximum 20 requests per bulkRequest call.
 * All requests are executed in a single transaction.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Execute bulk request
 * @param {Object[]} requests - Array of request objects
 * @param {string} requests[].method - HTTP method: GET, POST, PUT, DELETE
 * @param {string} requests[].api - API endpoint (e.g., "/k/v1/record.json")
 * @param {Object} requests[].payload - Request payload
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ results: Object[] }>}
 */
export async function bulkRequest(requests, options = {}) {
  const { silent = false } = options;

  if (!requests || !Array.isArray(requests) || requests.length === 0) {
    throw new Error("Requests array is required");
  }
  if (requests.length > 20) {
    throw new Error("Maximum 20 requests allowed per bulkRequest");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Executing ${requests.length} request(s)...`);
    console.log(`   Domain: ${credentials.domain}`);
    requests.forEach((req, i) => {
      console.log(`   ${i + 1}. ${req.method} ${req.api}`);
    });
  }

  const result = await client.bulkRequest({ requests });

  if (!silent) {
    console.log(`\n✅ Successfully executed ${result.results.length} request(s)`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const requestsJsonPath = process.argv[2];

  if (!requestsJsonPath) {
    console.error("Error: Requests JSON path is required");
    console.error("Usage: node scripts/app-management/bulk/bulk-request.mjs <requestsJsonPath>");
    console.error("");
    console.error("JSON format:");
    console.error('[{ "method": "POST", "api": "/k/v1/record.json", "payload": {...} }, ...]');
    console.error("");
    console.error("Supported APIs:");
    console.error("  - /k/v1/record.json (POST: add, PUT: update)");
    console.error("  - /k/v1/records.json (POST: add, PUT: update, DELETE: delete)");
    console.error("  - /k/v1/record/status.json (PUT: updateStatus)");
    console.error("  - /k/v1/record/assignees.json (PUT: updateAssignees)");
    process.exit(1);
  }

  let requests;
  try {
    const rootDir = getRootDir(import.meta.url);
    const jsonPath = resolve(rootDir, requestsJsonPath);
    const jsonContent = readFileSync(jsonPath, "utf-8");
    requests = JSON.parse(jsonContent);
  } catch (error) {
    console.error(`Error: Failed to read requests JSON from ${requestsJsonPath}`);
    console.error(error.message);
    process.exit(1);
  }

  bulkRequest(requests).catch((error) => {
    console.error("\n❌ Failed to execute bulk request");
    console.error(error.message);
    if (error.errors) {
      console.error("Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
}
