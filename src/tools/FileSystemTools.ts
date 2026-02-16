import { BaseTool } from '../core/Tool.js';
import { FileSystemProvider } from '../core/FileSystemProvider.js';
import { ConfirmationHandler, FileWriteConfirmation } from '../config/ConfirmationHandler.js';
import { ToolValidation } from '../validation/ToolValidation.js';
import path from 'path';

/**
 * Tool for listing directory contents
 */
export class ListDirectoryTool extends BaseTool<{ path: string }, string> {
  readonly name = 'list__directory';
  readonly description = 'Lists all files and directories in the specified path. Use this to explore project structure.';

  constructor(private fileSystem: FileSystemProvider) {
    super();
  }

  protected getParametersSchema() {
    return {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute path to the directory to list'
        }
      },
      required: ['path']
    };
  }

  async execute(args: { path: string }): Promise<string> {
    // Validate path
    const validation = ToolValidation.validatePath(args.path);
    if (!validation.isValid) {
      return `ERROR: ${validation.errorMessage}`;
    }

    // List directory
    const result = await this.fileSystem.listDirectory(args.path);

    if (!result.success) {
      return `ERROR: Failed to list directory '${args.path}': ${result.error.message}\n\nSuggestion: Verify the path exists and you have permission to read it.`;
    }

    const entries = result.value;
    if (entries.length === 0) {
      return `Contents of '${args.path}' (0 items):\n(empty directory)`;
    }

    const formattedEntries = entries
      .map(entry => `  - ${path.basename(entry)}`)
      .join('\n');

    return `Contents of '${args.path}' (${entries.length} items):\n${formattedEntries}`;
  }
}

/**
 * Tool for reading file contents
 */
export class ReadFileTool extends BaseTool<{ path: string }, string> {
  readonly name = 'read__file';
  readonly description = 'Reads the complete content of a file. Use this to understand existing code before making changes.';

  constructor(private fileSystem: FileSystemProvider) {
    super();
  }

  protected getParametersSchema() {
    return {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute path to the file to read'
        }
      },
      required: ['path']
    };
  }

  async execute(args: { path: string }): Promise<string> {
    // Validate path
    const validation = ToolValidation.validatePath(args.path);
    if (!validation.isValid) {
      return `ERROR: ${validation.errorMessage}`;
    }

    // Read file
    const result = await this.fileSystem.readFile(args.path);

    if (!result.success) {
      return `ERROR: Failed to read file '${args.path}': ${result.error.message}\n\nSuggestion: Verify the file exists and you have permission to read it.`;
    }

    const content = result.value;
    const lineCount = content.split('\n').length;
    const charCount = content.length;

    return `File: ${args.path}\n` +
           `Lines: ${lineCount} | Characters: ${charCount}\n\n` +
           `\`\`\`\n${content}\n\`\`\``;
  }
}

/**
 * Tool for creating new files
 */
export class CreateFileTool extends BaseTool<{ path: string; content: string }, string> {
  readonly name = 'create__file';
  readonly description = 'Creates a NEW file with the specified content. ONLY use for new files. Use edit__file for existing files.';

  constructor(
    private fileSystem: FileSystemProvider,
    private confirmationHandler: ConfirmationHandler
  ) {
    super();
  }

  protected getParametersSchema() {
    return {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute path for the new file'
        },
        content: {
          type: 'string',
          description: 'Content to write to the file'
        }
      },
      required: ['path', 'content']
    };
  }

  async execute(args: { path: string; content: string }): Promise<string> {
    // Check write permission
    if (!this.fileSystem.canWrite) {
      return 'ERROR: Write operations not allowed (read-only file system)';
    }

    // Validate inputs
    const pathValidation = ToolValidation.validatePath(args.path);
    if (!pathValidation.isValid) {
      return `ERROR: ${pathValidation.errorMessage}`;
    }

    const contentValidation = ToolValidation.validateContent(args.content);
    if (!contentValidation.isValid) {
      return `ERROR: ${contentValidation.errorMessage}`;
    }

    // Check if file already exists
    const exists = await this.fileSystem.fileExists(args.path);
    const overwrite = exists;

    // Request confirmation
    const confirmation = await this.confirmationHandler.requestFileWriteConfirmation({
      path: args.path,
      overwrite,
      newContent: args.content
    });

    if (!FileWriteConfirmation.isApproved(confirmation)) {
      if (FileWriteConfirmation.isError(confirmation)) {
        return `ERROR: ${(confirmation as any).message}`;
      }
      return `REJECTED: File creation cancelled by user for '${args.path}'`;
    }

    // Write file
    const result = await this.fileSystem.writeFile(args.path, args.content);

    if (!result.success) {
      return `ERROR: Failed to create file '${args.path}': ${result.error.message}`;
    }

    const lineCount = args.content.split('\n').length;
    const charCount = args.content.length;

    return `SUCCESS: Created file '${args.path}'\n` +
           `Lines: ${lineCount} | Characters: ${charCount}`;
  }
}

/**
 * Tool for editing existing files
 */
export class EditFileTool extends BaseTool<{ path: string; content: string }, string> {
  readonly name = 'edit__file';
  readonly description = 'Edits an EXISTING file by replacing its content. ONLY use for existing files. Read the file first to understand current content.';

  constructor(
    private fileSystem: FileSystemProvider,
    private confirmationHandler: ConfirmationHandler
  ) {
    super();
  }

  protected getParametersSchema() {
    return {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute path to the existing file'
        },
        content: {
          type: 'string',
          description: 'New content to replace the existing content'
        }
      },
      required: ['path', 'content']
    };
  }

  async execute(args: { path: string; content: string }): Promise<string> {
    // Check write permission
    if (!this.fileSystem.canWrite) {
      return 'ERROR: Write operations not allowed (read-only file system)';
    }

    // Validate inputs
    const pathValidation = ToolValidation.validatePath(args.path);
    if (!pathValidation.isValid) {
      return `ERROR: ${pathValidation.errorMessage}`;
    }

    const contentValidation = ToolValidation.validateContent(args.content);
    if (!contentValidation.isValid) {
      return `ERROR: ${contentValidation.errorMessage}`;
    }

    // Read old content for diff
    const oldContentResult = await this.fileSystem.readFile(args.path);
    if (!oldContentResult.success) {
      return `ERROR: File '${args.path}' not found. Use create__file for new files.\n` +
             `Suggestion: First use read__file to verify the file exists.`;
    }

    const oldContent = oldContentResult.value;

    // Request confirmation with diff
    const confirmation = await this.confirmationHandler.requestFileWriteConfirmation({
      path: args.path,
      overwrite: true,
      oldContent,
      newContent: args.content
    });

    if (!FileWriteConfirmation.isApproved(confirmation)) {
      if (FileWriteConfirmation.isError(confirmation)) {
        return `ERROR: ${(confirmation as any).message}`;
      }
      return `REJECTED: File edit cancelled by user for '${args.path}'`;
    }

    // Write file
    const result = await this.fileSystem.writeFile(args.path, args.content);

    if (!result.success) {
      return `ERROR: Failed to edit file '${args.path}': ${result.error.message}`;
    }

    const lineCount = args.content.split('\n').length;
    const charCount = args.content.length;

    return `SUCCESS: Edited file '${args.path}'\n` +
           `Lines: ${lineCount} | Characters: ${charCount}`;
  }
}
