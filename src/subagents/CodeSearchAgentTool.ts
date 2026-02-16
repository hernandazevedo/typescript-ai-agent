import { BaseTool } from '../core/Tool.js';
import { AIAgent } from '../agent/AIAgent.js';
import { createCodeSearchAgent } from './CodeSearchAgent.js';
import { FileSystemProvider } from '../core/FileSystemProvider.js';

/**
 * Tool that wraps the code search sub-agent
 * Allows the main agent to delegate search tasks to a specialized agent
 */
export class CodeSearchAgentTool extends BaseTool<{ query: string }, string> {
  readonly name = '__find_in_codebase_agent__';
  readonly description = `Delegates to a specialized code search agent to find code, functions, classes, or patterns in the codebase. Use this when you need to:
- Find a specific function or class implementation
- Search for patterns or keywords across files
- Understand where certain functionality is implemented
- Locate API usage examples
- Find related code across multiple files

The sub-agent will search strategically and return focused results with file locations and code snippets.`;

  private agent: AIAgent;

  constructor(
    apiKey: string,
    fileSystem: FileSystemProvider,
    _projectPath: string,
    verbose: boolean = false
  ) {
    super();
    this.agent = createCodeSearchAgent(apiKey, fileSystem, verbose);
  }

  protected getParametersSchema() {
    return {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'What to search for (e.g., "find the authentication function", "locate the User class", "find where database connections are established")'
        }
      },
      required: ['query']
    };
  }

  async execute(args: { query: string }): Promise<string> {
    console.log(`[Sub-Agent] Code Search invoked: "${args.query}"`);

    try {
      const result = await this.agent.run(args.query);
      console.log(`[Sub-Agent] Code Search completed`);
      return result;
    } catch (error) {
      return `ERROR: Code search failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}

/**
 * Factory function to create code search agent tool
 */
export function createCodeSearchAgentTool(
  apiKey: string,
  fileSystem: FileSystemProvider,
  projectPath: string,
  verbose: boolean = false
): CodeSearchAgentTool {
  return new CodeSearchAgentTool(apiKey, fileSystem, projectPath, verbose);
}
