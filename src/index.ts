#!/usr/bin/env node

import dotenv from 'dotenv';
import { AIAgent } from './agent/AIAgent.js';
import { Tool } from './core/Tool.js';
import { FileSystem } from './core/FileSystemProvider.js';
import {
  BraveConfirmationHandler,
  SafeConfirmationHandler
} from './config/ConfirmationHandler.js';
import { InteractiveConfirmationHandler } from './config/InteractiveConfirmationHandler.js';
import {
  ListDirectoryTool,
  ReadFileTool,
  CreateFileTool,
  EditFileTool
} from './tools/FileSystemTools.js';
import { ExecuteShellCommandTool } from './tools/ShellCommandTool.js';
import { McpToolDiscovery } from './mcp/McpToolDiscovery.js';
import { createCodeSearchAgentTool } from './subagents/CodeSearchAgentTool.js';
import chalk from 'chalk';

/**
 * Parse command line arguments
 */
function parseArgs(): {
  projectPath: string;
  task: string;
  brave: boolean;
  interactive: boolean;
  userId?: string;
} {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: typescript-ai-agent <project-path> <task> [--brave] [--interactive] [--user <userId>]');
    process.exit(1);
  }

  const projectPath = args[0];
  const task = args[1];
  const brave = args.includes('--brave');
  const interactive = args.includes('--interactive');

  const userIndex = args.indexOf('--user');
  const userId = userIndex !== -1 && args[userIndex + 1] ? args[userIndex + 1] : undefined;

  return { projectPath, task, brave, interactive, userId };
}

/**
 * Main system prompt for the agent
 */
function getSystemPrompt(projectPath: string): string {
  return `You are a highly skilled programmer helping to update codebases. You have access to powerful tools for file operations, shell commands, and code search.

**Current Project:** ${projectPath}

**Available Tools:**

File System Tools:
- list__directory: List files and directories to explore project structure
- read__file: Read file contents to understand existing code
- create__file: Create NEW files only (use edit__file for existing files)
- edit__file: Edit EXISTING files only (always read the file first)
- execute__shell_command: Run builds, tests, and other commands (with timeout support)

Code Search:
- __find_in_codebase_agent__: Delegate search tasks to a specialized sub-agent for finding code, functions, classes, or patterns

**Your Approach:**

1. SEARCH: If you need to find specific code/implementations, use the __find_in_codebase_agent__ tool
2. EXPLORE: Use list__directory when you know what you're looking for
3. UNDERSTAND: Read relevant files to understand the current state
4. PLAN: Think through the changes needed
5. IMPLEMENT: Use create__file for new files, edit__file for existing files
6. BUILD/TEST: Use execute__shell_command to run builds and tests
7. VERIFY: Read files after changes to confirm success
8. REPORT: Provide a clear summary of what was done

**Important Guidelines:**

- Be strategic about file reads - only read what you need
- ALWAYS read a file before editing it to understand current content
- Use appropriate tools: create__file for NEW files, edit__file for EXISTING files
- Validate paths before operations
- Set appropriate timeouts for commands (default: 30s, max: 600s)
- Provide helpful, actionable error messages
- If something fails, adjust your approach based on the error
- Use the sub-agent for finding code - it's faster and more focused

**Definition of Done:**

- All required code changes are implemented
- Files are created or modified as needed
- Changes align with the requirements
- Changes have been verified
- A clear summary has been provided

Let's work together to accomplish the task efficiently and correctly!`;
}

/**
 * Main entry point
 */
async function main() {
  // Load environment variables
  dotenv.config();

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.error(chalk.red('ERROR: OPENAI_API_KEY environment variable not set'));
    console.error('Please set it in your .env file or environment');
    process.exit(1);
  }

  // Parse arguments
  const { projectPath, task, brave, interactive, userId } = parseArgs();

  console.log(chalk.cyan('═'.repeat(60)));
  console.log(chalk.cyan('TypeScript AI Agent'));
  console.log(chalk.cyan('═'.repeat(60)));
  console.log(chalk.gray(`Project: ${projectPath}`));
  console.log(chalk.gray(`Task: ${task}`));
  console.log(chalk.gray(`Mode: ${brave ? 'Brave' : interactive ? 'Interactive' : 'Safe'}`));
  if (userId) {
    console.log(chalk.gray(`User: ${userId}`));
  }
  console.log(chalk.cyan('═'.repeat(60)));
  console.log('');

  // Determine confirmation mode
  const confirmationHandler = brave
    ? new BraveConfirmationHandler()
    : interactive
    ? new InteractiveConfirmationHandler()
    : new SafeConfirmationHandler();

  if (brave) {
    console.log(chalk.yellow('⚠️  Brave mode enabled - all operations will be auto-approved'));
  } else if (interactive) {
    console.log(chalk.cyan('🎯 Interactive mode enabled - you will review changes before approval'));
  }

  // Initialize file system tools
  const fileSystem = FileSystem.readWrite;

  const tools: Tool[] = [
    new ListDirectoryTool(fileSystem),
    new ReadFileTool(fileSystem),
    new CreateFileTool(fileSystem, confirmationHandler),
    new EditFileTool(fileSystem, confirmationHandler),
    new ExecuteShellCommandTool(confirmationHandler)
  ];

  // Discover MCP tools
  const mcpBaseUrl = process.env.MCP_SERVER_URL || 'http://localhost:8080';
  const mcpServerUrl = mcpBaseUrl.endsWith('/mcp') ? mcpBaseUrl : `${mcpBaseUrl}/mcp`;
  console.log(chalk.gray(`[MCP] Checking server at ${mcpServerUrl}...`));

  const mcpTools = await McpToolDiscovery.discoverTools(mcpServerUrl, false);

  if (mcpTools.length > 0) {
    console.log(chalk.green(`[MCP] Discovered ${mcpTools.length} tools: ${mcpTools.map(t => t.name).join(', ')}`));
    tools.push(...mcpTools);
  } else {
    console.log(chalk.yellow('[MCP] No MCP server available - using file system tools only'));
  }

  // Add code search sub-agent
  const codeSearchTool = createCodeSearchAgentTool(openaiApiKey, fileSystem, projectPath, false);
  tools.push(codeSearchTool);

  console.log(chalk.gray(`\n[Agent] Total tools available: ${tools.length}`));
  console.log('');

  // Create agent
  const agent = new AIAgent({
    apiKey: openaiApiKey,
    model: 'gpt-4o',
    systemPrompt: getSystemPrompt(projectPath),
    tools,
    maxIterations: 20,
    verbose: true
  });

  try {
    // Run agent
    const input = `Project path: ${projectPath}\n\nTask: ${task}`;
    console.log(chalk.cyan('[Agent] Starting task execution...\n'));

    const result = await agent.run(input);

    console.log('');
    console.log(chalk.cyan('═'.repeat(60)));
    console.log(chalk.green('✅ Task Completed'));
    console.log(chalk.cyan('═'.repeat(60)));
    console.log('');
    console.log(result);
    console.log('');
  } catch (error) {
    console.error('');
    console.error(chalk.red('═'.repeat(60)));
    console.error(chalk.red('❌ Error'));
    console.error(chalk.red('═'.repeat(60)));
    console.error('');
    console.error(error);
    console.error('');
    process.exit(1);
  } finally {
    await agent.close();
  }
}

// Run main
main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
