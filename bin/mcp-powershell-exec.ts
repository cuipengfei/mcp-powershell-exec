#!/usr/bin/env bun
/**
 * Executable entry point for mcp-powershell-exec
 * Allows users to run: bunx mcp-powershell-exec
 */

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = resolve(__dirname, "..", "powershell.ts");

// Import and run the PowerShell MCP server
async function main() {
  try {
    console.error("Starting PowerShell MCP server...");
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