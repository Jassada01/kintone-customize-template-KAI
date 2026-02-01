#!/usr/bin/env node
/**
 * Upload a file to kintone
 *
 * Usage (CLI):
 *   node scripts/app-management/file/upload-file.mjs <filePath>
 *
 * Usage (Programmatic):
 *   import { uploadFile } from "./upload-file.mjs";
 *   // From file path
 *   const { fileKey } = await uploadFile({ path: "/path/to/file.pdf" });
 *   // From data
 *   const { fileKey } = await uploadFile({ name: "hello.txt", data: "Hello World!" });
 *
 * Note: The returned fileKey can be used to attach the file to a record's attachment field.
 */

import { createKintoneClient } from "../common/index.mjs";

/**
 * Upload a file
 * @param {Object} file - File object
 * @param {string} [file.path] - Path to file (Node.js only)
 * @param {string} [file.name] - File name (required if not using path)
 * @param {string|Buffer} [file.data] - File data (required if not using path)
 * @param {Object} [options]
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<{ fileKey: string }>}
 */
export async function uploadFile(file, options = {}) {
  const { silent = false } = options;

  if (!file) {
    throw new Error("File object is required");
  }
  if (!file.path && (!file.name || file.data === undefined)) {
    throw new Error("Either file.path or file.name+file.data is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  const fileName = file.name || file.path.split("/").pop();
  if (!silent) {
    console.log(`\n🔄 Uploading file...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   File: ${fileName}`);
  }

  const result = await client.file.uploadFile({ file });

  if (!silent) {
    console.log(`\n✅ Successfully uploaded file`);
    console.log(`   File Key: ${result.fileKey}`);
    console.log(`\n📝 Use this fileKey to attach the file to a record's attachment field:`);
    console.log(`   { "Attachment": { "value": [{ "fileKey": "${result.fileKey}" }] } }`);
  }

  return result;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("Error: File path is required");
    console.error("Usage: node scripts/app-management/file/upload-file.mjs <filePath>");
    process.exit(1);
  }

  uploadFile({ path: filePath }).catch((error) => {
    console.error("\n❌ Failed to upload file");
    console.error(error.message);
    process.exit(1);
  });
}
