#!/usr/bin/env node
/**
 * Download a file from kintone
 *
 * Usage (CLI):
 *   node scripts/app-management/file/download-file.mjs <fileKey> [outputPath]
 *
 * Usage (Programmatic):
 *   import { downloadFile } from "./download-file.mjs";
 *   const data = await downloadFile("file-key-from-record");
 *   // data is ArrayBuffer
 *
 * Note: The fileKey is obtained from an attachment field in a record,
 * NOT from uploadFile. Get it via: record.AttachmentField.value[0].fileKey
 */

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createKintoneClient, getRootDir } from "../common/index.mjs";

/**
 * Download a file
 * @param {string} fileKey - The file key from record's attachment field
 * @param {Object} [options]
 * @param {string} [options.outputPath] - Path to save the file
 * @param {boolean} [options.silent=false] - Whether to suppress console output
 * @returns {Promise<ArrayBuffer>} File data as ArrayBuffer
 */
export async function downloadFile(fileKey, options = {}) {
  const { outputPath, silent = false } = options;

  if (!fileKey) {
    throw new Error("File key is required");
  }

  const { client, credentials } = await createKintoneClient(import.meta.url);

  if (!silent) {
    console.log(`\n🔄 Downloading file...`);
    console.log(`   Domain: ${credentials.domain}`);
    console.log(`   File Key: ${fileKey}`);
  }

  const data = await client.file.downloadFile({ fileKey });

  if (!silent) {
    console.log(`\n✅ Successfully downloaded file`);
    console.log(`   Size: ${data.byteLength} bytes`);
  }

  if (outputPath) {
    const rootDir = getRootDir(import.meta.url);
    const fullPath = resolve(rootDir, outputPath);
    writeFileSync(fullPath, Buffer.from(data));
    if (!silent) {
      console.log(`   Saved to: ${outputPath}`);
    }
  }

  return data;
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const fileKey = process.argv[2];
  const outputPath = process.argv[3];

  if (!fileKey) {
    console.error("Error: File key is required");
    console.error("Usage: node scripts/app-management/file/download-file.mjs <fileKey> [outputPath]");
    console.error("");
    console.error("To get fileKey, use record:get and look at the attachment field:");
    console.error("  record.AttachmentField.value[0].fileKey");
    process.exit(1);
  }

  downloadFile(fileKey, { outputPath }).catch((error) => {
    console.error("\n❌ Failed to download file");
    console.error(error.message);
    process.exit(1);
  });
}
