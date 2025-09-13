# MCP PowerShell Exec Server (TypeScript/Bun)

## Overview
A modern PowerShell MCP server built with TypeScript and Bun runtime. This server accepts PowerShell scripts as strings, executes them securely, and returns the output, enabling AI assistants to understand and work with PowerShell effectively.

## Features
- **TypeScript**: Full type safety and modern JavaScript features
- **Bun Runtime**: Fast execution with native performance
- **SOLID Architecture**: Clean, maintainable, and extensible codebase
- **PowerShell Integration**: Supports both PowerShell 7 and Windows PowerShell 5.1
- **Flexible Timeout**: Configurable command execution timeouts
- **Comprehensive Error Handling**: Graceful process management and error reporting
- **Security**: Non-interactive execution with controlled environment

## Installation

### Prerequisites
- **Bun**: Version 1.0 or higher ([Install Bun](https://bun.sh/))
- **PowerShell**: Version 7.x (preferred) or Windows PowerShell 5.1

### Setup
```bash
# Clone the repository
git clone https://github.com/cuipengfei/mcp-powershell-exec.git
cd mcp-powershell-exec

# Install dependencies
bun install

# Start the server
bun run start
```

## Usage

### Integration with Claude Code

To use this MCP server with Claude Code:

1. **Install the server globally**:
   ```bash
   claude mcp add powershell-integration --scope user bun /path/to/mcp-powershell-exec/powershell.ts
   ```

2. **Verify connection**:
   ```bash
   claude mcp list
   ```

### Alternative Integration (VSCode/Other MCP Clients)

Configure your MCP client with:
```json
{
  "servers": {
    "powershell-integration": {
      "command": "bun",
      "args": ["run", "/path/to/mcp-powershell-exec/powershell.ts"],
      "env": {}
    }
  }
}
```

## Development

### Scripts
```bash
# Start development server with watch mode
bun run dev

# Build the project
bun run build

# Type checking
bun run lint
```

### Architecture

The server follows SOLID principles with clear separation of concerns:

- **PowerShellExecutableDetector**: Detects and selects best PowerShell version
- **CommandValidator**: Validates input commands for security and constraints
- **ProcessManager**: Handles PowerShell process execution and lifecycle
- **ResultFormatter**: Formats execution results and error messages
- **PowerShellExecutor**: Main coordinator orchestrating all components

## Configuration

### Default Settings
- **Timeout**: 300 seconds (5 minutes)
- **Max Command Length**: 10,000 characters
- **PowerShell Priority**: PowerShell 7 (pwsh) > Windows PowerShell 5.1 (powershell)

### Customization
Modify `ExecutionConfig` class in `powershell.ts` to adjust settings:
```typescript
class ExecutionConfig {
  static readonly DEFAULT_TIMEOUT = 300;
  static readonly MAX_COMMAND_LENGTH = 10000;
  // ... other settings
}
```

## System Requirements

- **Bun**: 1.0+ (primary runtime)
- **PowerShell**: 7.x recommended, 5.1+ supported
- **TypeScript**: 5.x (for development)
- **Node.js**: Not required (Bun replaces Node.js)

## Migration from Python

This server was migrated from Python to TypeScript/Bun for:
- **Better Performance**: Faster startup and execution times
- **Type Safety**: Compile-time error detection
- **Modern Tooling**: Native TypeScript support
- **Simplified Dependencies**: Single runtime (Bun) vs Python + pip

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Create an issue in this GitHub repository
- Check existing issues for common problems
- Provide PowerShell version and error details when reporting bugs