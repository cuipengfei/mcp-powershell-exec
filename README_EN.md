# MCP PowerShell Exec Server

English | [中文](README.md)

A PowerShell MCP server built with TypeScript and Bun, enabling AI assistants to execute PowerShell commands and get results.

## Features

- Supports Bun and Node.js runtimes
- Supports PowerShell 7 and Windows PowerShell 5.1
- Configurable timeout
- Secure non-interactive execution
- Zero-setup installation via bunx or npx

## Quick Start

```bash
# Install with bunx (recommended for Bun users)
claude mcp add powershell-integration --scope user bunx mcp-powershell-exec

# Or install with npx (for Node.js users)
claude mcp add powershell-integration --scope user npx mcp-powershell-exec
```

## Alternative Installation

### Global Installation
```bash
# Bun users
bun add -g mcp-powershell-exec
claude mcp add powershell-integration --scope user bun mcp-powershell-exec

# Node.js users
npm install -g mcp-powershell-exec
claude mcp add powershell-integration --scope user node mcp-powershell-exec
```

### Manual Installation
```bash
git clone https://github.com/cuipengfei/mcp-powershell-exec.git
cd mcp-powershell-exec
bun install
claude mcp add powershell-integration --scope user bun /path/to/mcp-powershell-exec/powershell.ts
```

### Other MCP Clients
```json
{
  "servers": {
    "powershell-integration": {
      "command": "node",
      "args": ["/path/to/global/mcp-powershell-exec"]
    }
  }
}
```

## Development

```bash
bun run dev    # Development mode
bun run build  # Build
bun run lint   # Type checking
```

## Configuration

- Default timeout: 300 seconds
- Max command length: 10,000 characters
- PowerShell priority: PowerShell 7 > Windows PowerShell 5.1

## System Requirements

- Bun 1.0+ or Node.js 18+
- PowerShell 7.x (recommended) or 5.1+

## License

MIT License