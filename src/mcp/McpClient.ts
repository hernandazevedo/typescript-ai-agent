import axios, { AxiosInstance } from 'axios';
import {
  JsonRpcRequest,
  JsonRpcResponse,
  InitializeResult,
  McpTool,
  ToolCallResult,
  McpException,
  ToolsListResponse
} from './McpProtocol.js';

/**
 * HTTP-based JSON-RPC client for MCP servers
 */
export class McpClient {
  private axios: AxiosInstance;
  private requestId = 0;

  constructor(
    private serverUrl: string,
    private verbose: boolean = false
  ) {
    this.axios = axios.create({
      baseURL: serverUrl,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Initialize connection with MCP server
   */
  async initialize(): Promise<InitializeResult> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: this.nextId(),
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'typescript-ai-agent',
          version: '1.0.0'
        }
      }
    };

    const response = await this.sendRequest<InitializeResult>(request);
    return response;
  }

  /**
   * List all available tools from the server
   */
  async listTools(): Promise<McpTool[]> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: this.nextId(),
      method: 'tools/list',
      params: {}
    };

    const response = await this.sendRequest<ToolsListResponse>(request);
    return response.tools;
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(name: string, args: Record<string, any>): Promise<ToolCallResult> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: this.nextId(),
      method: 'tools/call',
      params: {
        name,
        arguments: args
      }
    };

    const response = await this.sendRequest<ToolCallResult>(request);
    return response;
  }

  /**
   * Check if server is available
   */
  async isServerAvailable(): Promise<boolean> {
    try {
      const healthUrl = this.serverUrl.replace('/mcp', '/health');
      const response = await axios.get(healthUrl, { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Send JSON-RPC request to server
   */
  private async sendRequest<T>(request: JsonRpcRequest): Promise<T> {
    try {
      if (this.verbose) {
        console.log('[MCP] Request:', JSON.stringify(request, null, 2));
      }

      const response = await this.axios.post<JsonRpcResponse<T>>('', request);

      if (this.verbose) {
        console.log('[MCP] Response:', JSON.stringify(response.data, null, 2));
      }

      if (response.data.error) {
        throw new McpException(
          response.data.error.message,
          response.data.error.code,
          response.data.error.data
        );
      }

      if (response.data.result === undefined) {
        throw new McpException('No result in response');
      }

      return response.data.result;
    } catch (error) {
      if (error instanceof McpException) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new McpException(
          `HTTP error: ${error.message}`,
          error.response?.status,
          error.response?.data
        );
      }

      throw new McpException(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Generate next request ID
   */
  private nextId(): number {
    return ++this.requestId;
  }
}
