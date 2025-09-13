# MCP PowerShell Exec Server

English | [中文](README.md)

A PowerShell MCP server built with TypeScript and Bun, enabling AI assistants to execute PowerShell commands and get results.

## Features

- TypeScript + Bun runtime
- Supports PowerShell 7 and Windows PowerShell 5.1
- Configurable timeout
- Secure non-interactive execution
- Zero-setup installation via bunx

## Quick Start

```bash
# Install with bunx (recommended)
claude mcp add powershell-integration --scope user bunx mcp-powershell-exec
```

## Alternative Installation

### Global Installation
```bash
bun add -g mcp-powershell-exec
claude mcp add powershell-integration --scope user bun mcp-powershell-exec
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
      "command": "bun",
      "args": ["run", "/path/to/mcp-powershell-exec/powershell.ts"]
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

- Bun 1.0+
- PowerShell 7.x (recommended) or 5.1+

## License

MIT License