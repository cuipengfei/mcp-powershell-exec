from mcp.server.fastmcp import FastMCP
import subprocess
import logging
import shutil

# Initialize the MCP server
mcp = FastMCP("powershell-integration")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Detect available PowerShell version
def get_powershell_executable():
    """Detect and return the best available PowerShell executable."""
    # Try PowerShell 7 first (pwsh)
    if shutil.which("pwsh"):
        logger.info("Using PowerShell 7 (pwsh)")
        return "pwsh"
    # Fall back to Windows PowerShell 5.1
    elif shutil.which("powershell"):
        logger.info("Using Windows PowerShell 5.1 (powershell)")
        return "powershell"
    else:
        logger.error("No PowerShell executable found")
        return None

# Cache the PowerShell executable
POWERSHELL_EXE = get_powershell_executable()

# Define the command to run PowerShell code
@mcp.tool()
def run_powershell(code: str, timeout: int = 300) -> str:
    """Runs PowerShell code and returns the output.

    Args:
        code: The PowerShell code to execute
        timeout: Timeout in seconds (default: 300 = 5 minutes, 0 = no timeout)
    """

    # Check if PowerShell is available
    if not POWERSHELL_EXE:
        return "Error: No PowerShell executable found on system"

    # Input validation
    if not code or not code.strip():
        return "Error: Empty command provided"

    if len(code) > 10000:  # Reasonable limit
        return "Error: Command too long (max 10000 characters)"

    logger.info(f"Executing PowerShell command (exe: {POWERSHELL_EXE}, length: {len(code)}, timeout: {timeout}s)")

    # Run the PowerShell command with additional flags to avoid hanging
    process = subprocess.Popen(
        [POWERSHELL_EXE, "-NonInteractive", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", code],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        stdin=subprocess.PIPE,
        text=True,
    )

    # Get the output and error messages with flexible timeout
    try:
        if timeout <= 0:
            # No timeout - wait indefinitely
            logger.info("Executing PowerShell command with no timeout")
            output, error = process.communicate(input="")
        else:
            logger.info(f"Executing PowerShell command with {timeout} second timeout")
            output, error = process.communicate(input="", timeout=timeout)
    except subprocess.TimeoutExpired:
        logger.warning(f"PowerShell command timed out after {timeout} seconds, terminating process")
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            logger.error("Process did not terminate gracefully, killing")
            process.kill()
            process.wait()
        return f"Error: Command timed out after {timeout} seconds"
    except Exception as e:
        logger.error(f"Unexpected error during command execution: {e}")
        return f"Error: Unexpected error occurred: {e}"

    # Handle non-zero exit codes
    if process.returncode != 0:
        error_msg = error.strip() if error else f"Command failed with exit code {process.returncode}"
        logger.warning(f"PowerShell command failed: {error_msg}")
        return f"Error: {error_msg}"

    # Return output, with stderr as warning if present
    result = output.strip() if output else ""
    if error and error.strip():
        logger.info(f"PowerShell stderr (non-fatal): {error.strip()}")
        # Include non-fatal stderr as info
        if result:
            result += f"\n[Warning: {error.strip()}]"
        else:
            result = f"[Warning: {error.strip()}]"

    return result

if __name__ == "__main__":
    # Run the MCP server
    mcp.run()
