# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `bun run dev` - Start development server with watch mode for hot reloading
- `bun run start` - Run the PowerShell MCP server directly
- `bun run build` - Build the project for distribution
- `bun run lint` - Run TypeScript type checking (no actual linting, just tsc --noEmit)

### Quality Assurance
- TypeScript type checking is the primary quality gate - ensure all code passes `bun run lint`
- No test framework is currently configured (tests show "No tests yet")
- Pre-publish checks run automatically via `prepublishOnly` script

### Publishing and Version Management
- `npm version patch` - Bump patch version
- `bun run build` - Build before publishing (always run lint first)
- `npm publish --access public` - Publish to npm registry
- After publishing, update MCP configuration to use new version
- Always test the published version, not local source

### MCP Testing Workflow
When testing MCP tool functionality, follow this workflow:
1. `claude mcp remove powershell-integration` - Remove existing MCP configuration
2. `claude mcp add powershell-integration --scope user bunx mcp-powershell-exec@latest` - Add updated package
3. `claude mcp list` - Verify configuration is correct
4. Test functionality using the mcp__powershell-integration__run_powershell tool
5. For version-specific testing: `bunx mcp-powershell-exec@1.0.4 --help` to verify exact version
6. Clear Bun cache if needed: `bun pm cache rm` to force fresh package download

## Important Development Notes

### Quality Standards
- **Never skip lint or tsc** - Always ensure TypeScript compilation passes before committing
- Use `console.info()` for informational messages, not `console.error()`
- Interactive commands (like `npm login`) will cause MCP tool timeouts - use non-interactive alternatives

### Dual Runtime Support
- Supports both Bun (primary development) and Node.js (user compatibility)
- Binary entry point detects runtime: `typeof Bun !== 'undefined' ? 'Bun' : 'Node.js'`
- Uses `pathToFileURL()` for cross-platform ESM module loading on Windows

## Architecture Overview

This is a Model Context Protocol (MCP) server that provides PowerShell execution capabilities to AI assistants. The codebase follows SOLID principles with clear separation of concerns:

### Core Components

1. **PowerShellExecutableDetector** (`powershell.ts:31-54`)
   - Detects available PowerShell versions (PowerShell 7 vs Windows PowerShell 5.1)
   - Prioritizes PowerShell 7 (pwsh) over Windows PowerShell 5.1 (powershell)

2. **CommandValidator** (`powershell.ts:57-69`)
   - Validates PowerShell commands before execution
   - Enforces length limits (10,000 characters max) and empty command checks

3. **ProcessManager** (`powershell.ts:72-125`)
   - Handles PowerShell process spawning and lifecycle management
   - Implements timeout handling and graceful process termination
   - Manages stdout/stderr capture

4. **ResultFormatter** (`powershell.ts:128-145`)
   - Formats execution results with proper error handling
   - Combines stdout/stderr output with appropriate error messages

5. **PowerShellExecutor** (`powershell.ts:148-189`)
   - Main orchestrator that coordinates all other components
   - Provides the primary `execute()` interface for PowerShell command execution

### Entry Points

- **Main Server**: `powershell.ts` - Primary MCP server implementation
- **Binary Entry**: `bin/mcp-powershell-exec.ts` - Executable wrapper for bunx compatibility

### MCP Integration

The server exposes one tool:
- `run_powershell` - Executes PowerShell code with configurable timeout
- Default timeout: 300 seconds (5 minutes)
- Input validation and error handling built-in

## Configuration

### Execution Limits
- Maximum command length: 10,000 characters
- Default timeout: 300 seconds
- Graceful termination timeout: 5 seconds
- PowerShell flags: `-NonInteractive -NoProfile -ExecutionPolicy Bypass`

### Runtime Requirements
- **Bun**: 1.0+ (primary runtime)
- **PowerShell**: 7.x preferred, 5.1+ supported
- **TypeScript**: 5.x for development

## Code Conventions

- TypeScript with strict mode enabled
- ES2022 target with ESNext modules
- Bun-specific module resolution
- Class-based architecture with static configuration constants
- Comprehensive error handling with predefined error message templates
- Console logging for debugging and monitoring