#!/usr/bin/env node
/**
 * Universal executable entry point for mcp-powershell-exec
 * Works with both Node.js and Bun runtimes
 * Usage: npx mcp-powershell-exec or bunx mcp-powershell-exec
 */

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = resolve(__dirname, "..", "powershell.js");

// Detect runtime
const runtime = typeof Bun !== 'undefined' ? 'Bun' : 'Node.js';

// Import and run the PowerShell MCP server
async function main() {
  try {
    console.info(`Starting PowerShell MCP server (${runtime})...`);
    await import(serverPath);
  } catch (error) {
    console.error("Failed to start PowerShell MCP server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});