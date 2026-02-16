import { Tool } from '../core/Tool.js';
import { McpClient } from './McpClient.js';
import { McpToolAdapter } from './McpToolAdapter.js';
import { McpException } from './McpProtocol.js';

/**
 * Auto-discovers and registers MCP tools
 */
export const McpToolDiscovery = {
  /**
   * Discover all tools from MCP server
   * Returns empty array on failure (graceful degradation)
   */
  async discoverTools(
    serverUrl: string,
    verbose: boolean = false
  ): Promise<Tool[]> {
    try {
      const client = new McpClient(serverUrl, verbose);

      // Test connection
      if (verbose) {
        console.log('[MCP] Testing connection to:', serverUrl);
      }

      const available = await client.isServerAvailable();
      if (!available) {
        if (verbose) {
          console.log('[MCP] Server not available');
        }
        return [];
      }

      if (verbose) {
        console.log('[MCP] Server available, initializing...');
      }

      // Initialize connection
      const initResult = await client.initialize();

      if (verbose) {
        console.log('[MCP] Initialized:', initResult.serverInfo.name, initResult.serverInfo.version);
      }

      // List tools
      const mcpTools = await client.listTools();

      if (verbose) {
        console.log(`[MCP] Discovered ${mcpTools.length} tools:`, mcpTools.map(t => t.name));
      }

      // Create adapters for each tool
      const tools: Tool[] = mcpTools.map(
        (mcpTool) => new McpToolAdapter(mcpTool, client)
      );

      return tools;
    } catch (error) {
      if (verbose) {
        if (error instanceof McpException) {
          console.error('[MCP] Error:', error.message, error.code, error.data);
        } else {
          console.error('[MCP] Error:', error);
        }
      }
      return [];
    }
  },

  /**
   * Test MCP server connection
   */
  async testConnection(serverUrl: string): Promise<boolean> {
    try {
      const client = new McpClient(serverUrl, false);
      return await client.isServerAvailable();
    } catch {
      return false;
    }
  }
};
