import { BaseTool } from '../core/Tool.js';
import { McpClient } from './McpClient.js';
import { McpTool, ToolCallResult } from './McpProtocol.js';

/**
 * Adapter that bridges MCP tools to our Tool interface
 * Allows MCP tools to be used alongside native tools
 */
export class McpToolAdapter extends BaseTool<Record<string, any>, string> {
  readonly name: string;
  readonly description: string;
  private schema: Record<string, any>;

  constructor(
    mcpTool: McpTool,
    private mcpClient: McpClient
  ) {
    super();
    this.name = mcpTool.name;
    this.description = mcpTool.description;
    this.schema = mcpTool.inputSchema;
  }

  protected getParametersSchema(): Record<string, any> {
    return this.schema;
  }

  async execute(args: Record<string, any>): Promise<string> {
    try {
      const result: ToolCallResult = await this.mcpClient.callTool(this.name, args);

      if (result.isError) {
        return `ERROR: ${this.formatResult(result)}`;
      }

      return this.formatResult(result);
    } catch (error) {
      return `ERROR: Failed to call MCP tool '${this.name}': ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Format MCP result as string
   */
  private formatResult(result: ToolCallResult): string {
    if (!result.content || result.content.length === 0) {
      return '(no output)';
    }

    return result.content
      .map((content) => content.text)
      .join('\n\n');
  }
}
