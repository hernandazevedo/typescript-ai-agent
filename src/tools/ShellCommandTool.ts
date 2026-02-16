import { BaseTool } from '../core/Tool.js';
import { ConfirmationHandler, FileWriteConfirmation } from '../config/ConfirmationHandler.js';
import { ToolValidation } from '../validation/ToolValidation.js';
import { spawn } from 'child_process';
import { platform } from 'os';

/**
 * Result of shell command execution
 */
export interface ShellCommandResult {
  command: string;
  exitCode: number | null;
  output: string;
  timedOut: boolean;
}

/**
 * Tool for executing shell commands with timeout support
 */
export class ExecuteShellCommandTool extends BaseTool<
  { command: string; timeoutSeconds?: number; workingDirectory?: string },
  string
> {
  readonly name = 'execute__shell_command';
  readonly description =
    'Executes a shell command with timeout support. Use for running builds, tests, and other command-line operations. Default timeout: 30 seconds.';

  constructor(private confirmationHandler: ConfirmationHandler) {
    super();
  }

  protected getParametersSchema() {
    return {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute'
        },
        timeoutSeconds: {
          type: 'number',
          description: 'Timeout in seconds (default: 30, max: 600)',
          default: 30
        },
        workingDirectory: {
          type: 'string',
          description: 'Working directory for the command (optional)'
        }
      },
      required: ['command']
    };
  }

  async execute(args: {
    command: string;
    timeoutSeconds?: number;
    workingDirectory?: string;
  }): Promise<string> {
    const timeout = args.timeoutSeconds ?? 30;

    // Validate inputs
    const commandValidation = ToolValidation.validateCommand(args.command);
    if (!commandValidation.isValid) {
      return `ERROR: ${commandValidation.errorMessage}`;
    }

    const timeoutValidation = ToolValidation.validateTimeout(timeout);
    if (!timeoutValidation.isValid) {
      return `ERROR: ${timeoutValidation.errorMessage}`;
    }

    // Request confirmation
    const confirmation = await this.confirmationHandler.requestShellCommandConfirmation(
      args.command
    );

    if (!FileWriteConfirmation.isApproved(confirmation)) {
      if (FileWriteConfirmation.isError(confirmation)) {
        return `ERROR: ${(confirmation as any).message}`;
      }
      return `REJECTED: Shell command execution cancelled by user: ${args.command}`;
    }

    // Execute command
    const result = await this.executeCommand(args.command, timeout, args.workingDirectory);

    // Format result
    return this.formatResult(result);
  }

  private async executeCommand(
    command: string,
    timeoutSeconds: number,
    workingDirectory?: string
  ): Promise<ShellCommandResult> {
    return new Promise((resolve) => {
      const isWindows = platform() === 'win32';
      const shell = isWindows ? 'cmd.exe' : '/bin/sh';
      const shellArgs = isWindows ? ['/c', command] : ['-c', command];

      let output = '';
      let timedOut = false;
      let exitCode: number | null = null;

      const proc = spawn(shell, shellArgs, {
        cwd: workingDirectory,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Collect stdout and stderr
      proc.stdout?.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        output += data.toString();
      });

      // Set timeout
      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        proc.kill('SIGTERM');

        // Force kill after 2 seconds if still running
        setTimeout(() => {
          if (!proc.killed) {
            proc.kill('SIGKILL');
          }
        }, 2000);
      }, timeoutSeconds * 1000);

      // Handle process exit
      proc.on('exit', (code) => {
        clearTimeout(timeoutHandle);
        exitCode = code;

        resolve({
          command,
          exitCode,
          output: output.trim(),
          timedOut
        });
      });

      // Handle process error
      proc.on('error', (error) => {
        clearTimeout(timeoutHandle);
        resolve({
          command,
          exitCode: null,
          output: `ERROR: ${error.message}`,
          timedOut
        });
      });
    });
  }

  private formatResult(result: ShellCommandResult): string {
    let formatted = `Command: ${result.command}\n`;

    if (result.timedOut) {
      formatted += `Status: TIMED OUT\n`;
      formatted += `\nPartial output:\n${result.output}\n`;
      formatted += `\nSuggestion: The command exceeded the timeout. Consider increasing timeoutSeconds or optimizing the operation.`;
    } else if (result.exitCode === 0) {
      formatted += `Status: SUCCESS (exit code: 0)\n`;
      if (result.output) {
        formatted += `\nOutput:\n${result.output}`;
      }
    } else {
      formatted += `Status: FAILED (exit code: ${result.exitCode})\n`;
      formatted += `\nOutput:\n${result.output}\n`;
      formatted += `\nSuggestion: The command failed. Review the output above for error details and adjust your approach.`;
    }

    return formatted;
  }
}
