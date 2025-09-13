# MCP PowerShell 执行服务器

[English](README_EN.md) | 中文

使用 TypeScript 和 Bun 构建的 PowerShell MCP 服务器，让 AI 助手能够执行 PowerShell 命令并获取结果。

## 特性

- 支持 Bun 和 Node.js 运行时
- 支持 PowerShell 7 和 Windows PowerShell 5.1
- 可配置超时时间
- 安全的非交互式执行
- 通过 bunx 或 npx 零配置安装

## 快速开始

```bash
# 使用 bunx（推荐，Bun 用户）
claude mcp add powershell-integration --scope user bunx mcp-powershell-exec

# 或使用 npx（Node.js 用户）
claude mcp add powershell-integration --scope user npx mcp-powershell-exec
```

## 其他安装方式

### 全局安装
```bash
# Bun 用户
bun add -g mcp-powershell-exec
claude mcp add powershell-integration --scope user bun mcp-powershell-exec

# Node.js 用户
npm install -g mcp-powershell-exec
claude mcp add powershell-integration --scope user node mcp-powershell-exec
```

### 手动安装
```bash
git clone https://github.com/cuipengfei/mcp-powershell-exec.git
cd mcp-powershell-exec
bun install
claude mcp add powershell-integration --scope user bun /path/to/mcp-powershell-exec/powershell.ts
```

### 其他 MCP 客户端配置
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

## 开发

```bash
bun run dev    # 开发模式
bun run build  # 构建
bun run lint   # 类型检查
```

## 配置

- 默认超时：300 秒
- 最大命令长度：10,000 字符
- PowerShell 优先级：PowerShell 7 > Windows PowerShell 5.1

## 系统要求

- Bun 1.0+ 或 Node.js 18+
- PowerShell 7.x（推荐）或 5.1+

## 许可证

MIT License