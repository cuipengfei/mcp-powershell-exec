from mcp.server.fastmcp import FastMCP
import subprocess
import logging
import shutil
from dataclasses import dataclass
from enum import Enum
from typing import Optional, Tuple


class PowerShellVersion(Enum):
    """PowerShell version enumeration."""
    V7 = "pwsh"
    V5 = "powershell"


@dataclass(frozen=True)
class ExecutionConfig:
    """Configuration constants for PowerShell execution."""
    DEFAULT_TIMEOUT: int = 300
    MAX_COMMAND_LENGTH: int = 10000
    GRACEFUL_TERMINATION_TIMEOUT: int = 5
    POWERSHELL_FLAGS = ["-NonInteractive", "-NoProfile", "-ExecutionPolicy", "Bypass"]


class PowerShellExecutableDetector:
    """Responsible for detecting available PowerShell executables."""

    def __init__(self, logger: logging.Logger):
        self._logger = logger

    def detect_best_executable(self) -> Optional[str]:
        """Detect and return the best available PowerShell executable."""
        for version in PowerShellVersion:
            if shutil.which(version.value):
                version_name = "PowerShell 7" if version == PowerShellVersion.V7 else "Windows PowerShell 5.1"
                self._logger.info(f"Using {version_name} ({version.value})")
                return version.value

        self._logger.error("No PowerShell executable found")
        return None


class CommandValidator:
    """Responsible for validating PowerShell commands."""

    @staticmethod
    def validate(code: str) -> Optional[str]:
        """Validate command input. Returns error message if invalid, None if valid."""
        if not code or not code.strip():
            return "Empty command provided"

        if len(code) > ExecutionConfig.MAX_COMMAND_LENGTH:
            return f"Command too long (max {ExecutionConfig.MAX_COMMAND_LENGTH} characters)"

        return None


class ProcessManager:
    """Responsible for managing PowerShell process execution."""

    def __init__(self, logger: logging.Logger):
        self._logger = logger

    def execute_command(self, executable: str, code: str, timeout: int) -> Tuple[str, str, int]:
        """Execute PowerShell command and return (stdout, stderr, returncode)."""
        cmd = [executable] + ExecutionConfig.POWERSHELL_FLAGS + ["-Command", code]

        self._logger.info(f"Executing PowerShell command (exe: {executable}, length: {len(code)}, timeout: {timeout}s)")

        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            stdin=subprocess.PIPE,
            text=True,
        )

        try:
            if timeout <= 0:
                self._logger.info("Executing PowerShell command with no timeout")
                output, error = process.communicate(input="")
            else:
                self._logger.info(f"Executing PowerShell command with {timeout} second timeout")
                output, error = process.communicate(input="", timeout=timeout)
        except subprocess.TimeoutExpired:
            self._logger.warning(f"PowerShell command timed out after {timeout} seconds, terminating process")
            self._terminate_process_gracefully(process, timeout)
            raise
        except Exception as e:
            self._logger.error(f"Unexpected error during command execution: {e}")
            raise

        return output, error, process.returncode

    def _terminate_process_gracefully(self, process: subprocess.Popen, timeout: int) -> None:
        """Gracefully terminate a process."""
        process.terminate()
        try:
            process.wait(timeout=ExecutionConfig.GRACEFUL_TERMINATION_TIMEOUT)
        except subprocess.TimeoutExpired:
            self._logger.error("Process did not terminate gracefully, killing")
            process.kill()
            process.wait()


class ResultFormatter:
    """Responsible for formatting execution results."""

    def __init__(self, logger: logging.Logger):
        self._logger = logger

    def format_result(self, output: str, error: str, returncode: int) -> str:
        """Format execution result into final output string."""
        if returncode != 0:
            error_msg = error.strip() if error else f"Command failed with exit code {returncode}"
            self._logger.warning(f"PowerShell command failed: {error_msg}")
            return f"Error: {error_msg}"

        result = output.strip() if output else ""

        if error and error.strip():
            self._logger.info(f"PowerShell stderr (non-fatal): {error.strip()}")
            if result:
                result += f"\n[Warning: {error.strip()}]"
            else:
                result = f"[Warning: {error.strip()}]"

        return result


class PowerShellExecutor:
    """Main PowerShell execution coordinator."""

    def __init__(self):
        self._logger = self._setup_logger()
        self._detector = PowerShellExecutableDetector(self._logger)
        self._validator = CommandValidator()
        self._process_manager = ProcessManager(self._logger)
        self._formatter = ResultFormatter(self._logger)
        self._executable = self._detector.detect_best_executable()

    @staticmethod
    def _setup_logger() -> logging.Logger:
        """Setup and return logger instance."""
        logging.basicConfig(level=logging.INFO)
        return logging.getLogger(__name__)

    def execute(self, code: str, timeout: int = ExecutionConfig.DEFAULT_TIMEOUT) -> str:
        """Execute PowerShell command and return formatted result."""
        if not self._executable:
            return "Error: No PowerShell executable found on system"

        validation_error = self._validator.validate(code)
        if validation_error:
            return f"Error: {validation_error}"

        try:
            output, error, returncode = self._process_manager.execute_command(
                self._executable, code, timeout
            )
            return self._formatter.format_result(output, error, returncode)
        except subprocess.TimeoutExpired:
            return f"Error: Command timed out after {timeout} seconds"
        except Exception as e:
            return f"Error: Unexpected error occurred: {e}"


# Initialize components
mcp = FastMCP("powershell-integration")
executor = PowerShellExecutor()

# Define the MCP tool interface
@mcp.tool()
def run_powershell(code: str, timeout: int = ExecutionConfig.DEFAULT_TIMEOUT) -> str:
    """Runs PowerShell code and returns the output.

    Args:
        code: The PowerShell code to execute
        timeout: Timeout in seconds (default: 300 = 5 minutes, 0 = no timeout)
    """
    return executor.execute(code, timeout)


if __name__ == "__main__":
    mcp.run()
