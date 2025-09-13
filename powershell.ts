import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn, ChildProcess } from "child_process";

// PowerShell version enumeration
enum PowerShellVersion {
  V7 = "pwsh",
  V5 = "powershell"
}

// Configuration constants
class ExecutionConfig {
  static readonly DEFAULT_TIMEOUT = 300; // 5 minutes
  static readonly MAX_COMMAND_LENGTH = 10000;
  static readonly GRACEFUL_TERMINATION_TIMEOUT = 5;
  static readonly POWERSHELL_FLAGS = ["-NonInteractive", "-NoProfile", "-ExecutionPolicy", "Bypass"];

  // Error message templates
  static readonly ERROR_EMPTY_COMMAND = "Empty command provided";
  static readonly ERROR_COMMAND_TOO_LONG = `Command too long (max ${ExecutionConfig.MAX_COMMAND_LENGTH} characters)`;
  static readonly ERROR_NO_EXECUTABLE = "No PowerShell executable found on system";
  static readonly ERROR_TIMEOUT = (timeout: number) => `Command timed out after ${timeout} seconds`;
  static readonly ERROR_UNEXPECTED = (error: unknown) => `Unexpected error occurred: ${error}`;
}

// PowerShell executable detector
class PowerShellExecutableDetector {
  constructor(private logger: typeof console) {}

  async detectBestExecutable(): Promise<string | null> {
    for (const version of Object.values(PowerShellVersion)) {
      if (await this.isExecutableAvailable(version)) {
        const versionName = version === PowerShellVersion.V7 ? "PowerShell 7" : "Windows PowerShell 5.1";
        this.logger.info(`Using ${versionName} (${version})`);
        return version;
      }
    }

    this.logger.error("No PowerShell executable found");
    return null;
  }

  private async isExecutableAvailable(executable: string): Promise<boolean> {
    return new Promise((resolve) => {
      const process = spawn(executable, ["--version"], { stdio: "pipe" });
      process.on("error", () => resolve(false));
      process.on("close", (code) => resolve(code === 0));
    });
  }
}

// Command validator
class CommandValidator {
  static validate(code: string): string | null {
    if (!code || !code.trim()) {
      return ExecutionConfig.ERROR_EMPTY_COMMAND;
    }

    if (code.length > ExecutionConfig.MAX_COMMAND_LENGTH) {
      return ExecutionConfig.ERROR_COMMAND_TOO_LONG;
    }

    return null;
  }
}

// Process manager
class ProcessManager {
  constructor(private logger: typeof console) {}

  async executeCommand(executable: string, code: string, timeout: number): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    const cmd = [executable, ...ExecutionConfig.POWERSHELL_FLAGS, "-Command", code];

    this.logger.info(`Executing PowerShell: ${executable}, length: ${code.length}, timeout: ${timeout || 'none'}s`);

    return new Promise((resolve, reject) => {
      const process = spawn(cmd[0], cmd.slice(1), { stdio: "pipe" });
      let stdout = "";
      let stderr = "";
      let timeoutId: NodeJS.Timeout | null = null;

      // Setup data handlers
      process.stdout?.on("data", (data) => stdout += data.toString());
      process.stderr?.on("data", (data) => stderr += data.toString());

      // Setup completion handlers
      process.on("close", (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: code || 0 });
      });

      process.on("error", (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(error);
      });

      // Setup timeout if specified
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          this.logger.warn(`Command timed out after ${timeout}s, terminating`);
          this.terminateProcessGracefully(process);
          reject(new Error(ExecutionConfig.ERROR_TIMEOUT(timeout)));
        }, timeout * 1000);
      }
    });
  }

  private terminateProcessGracefully(process: ChildProcess): void {
    process.kill("SIGTERM");
    setTimeout(() => {
      if (!process.killed) {
        this.logger.error("Process did not terminate gracefully, killing");
        process.kill("SIGKILL");
      }
    }, ExecutionConfig.GRACEFUL_TERMINATION_TIMEOUT * 1000);
  }
}

// Result formatter
class ResultFormatter {
  constructor(private logger: typeof console) {}

  formatResult(stdout: string, stderr: string, exitCode: number): string {
    if (exitCode !== 0) {
      const errorMsg = stderr || `Command failed with exit code ${exitCode}`;
      this.logger.warn(`PowerShell failed: ${errorMsg}`);
      return `Error: ${errorMsg}`;
    }

    if (stderr) {
      this.logger.info(`PowerShell warning: ${stderr}`);
      return stdout ? `${stdout}\n[Warning: ${stderr}]` : `[Warning: ${stderr}]`;
    }

    return stdout;
  }
}

// Main PowerShell executor
class PowerShellExecutor {
  private logger = console;
  private detector: PowerShellExecutableDetector;
  private validator = CommandValidator;
  private processManager: ProcessManager;
  private formatter: ResultFormatter;
  private executable: string | null = null;

  constructor() {
    this.detector = new PowerShellExecutableDetector(this.logger);
    this.processManager = new ProcessManager(this.logger);
    this.formatter = new ResultFormatter(this.logger);
  }

  async initialize(): Promise<void> {
    this.executable = await this.detector.detectBestExecutable();
  }

  async execute(code: string, timeout: number = ExecutionConfig.DEFAULT_TIMEOUT): Promise<string> {
    if (!this.executable) {
      return `Error: ${ExecutionConfig.ERROR_NO_EXECUTABLE}`;
    }

    const validationError = this.validator.validate(code);
    if (validationError) {
      return `Error: ${validationError}`;
    }

    try {
      const { stdout, stderr, exitCode } = await this.processManager.executeCommand(
        this.executable,
        code,
        timeout
      );
      return this.formatter.formatResult(stdout, stderr, exitCode);
    } catch (error) {
      return error instanceof Error && error.message.includes("timed out")
        ? `Error: ${error.message}`
        : `Error: ${ExecutionConfig.ERROR_UNEXPECTED(error)}`;
    }
  }
}

// MCP Server setup
async function main() {
  const server = new Server(
    {
      name: "powershell-integration",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const executor = new PowerShellExecutor();
  await executor.initialize();

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "run_powershell",
          description: "Runs PowerShell code and returns the output",
          inputSchema: {
            type: "object",
            properties: {
              code: {
                type: "string",
                description: "The PowerShell code to execute",
              },
              timeout: {
                type: "number",
                description: "Timeout in seconds (default: 300 = 5 minutes, 0 = no timeout)",
                default: ExecutionConfig.DEFAULT_TIMEOUT,
              },
            },
            required: ["code"],
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "run_powershell") {
      const { code, timeout = ExecutionConfig.DEFAULT_TIMEOUT } = args as {
        code: string;
        timeout?: number;
      };

      try {
        const result = await executor.execute(code, timeout);
        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error}`,
            },
          ],
        };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PowerShell MCP server running...");
}

main().catch(console.error);