/**
 * Model Context Protocol (MCP) 2024-11-05 specification
 * JSON-RPC 2.0 protocol data structures
 */

/**
 * JSON-RPC 2.0 Request
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, any>;
}

/**
 * JSON-RPC 2.0 Response
 */
export interface JsonRpcResponse<T = any> {
  jsonrpc: '2.0';
  id?: string | number | null;
  result?: T;
  error?: JsonRpcError;
}

/**
 * JSON-RPC 2.0 Error
 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

/**
 * MCP Tool definition
 */
export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * MCP Initialize result
 */
export interface InitializeResult {
  protocolVersion: string;
  capabilities: Capabilities;
  serverInfo: ServerInfo;
}

/**
 * Server capabilities
 */
export interface Capabilities {
  tools?: {
    supported?: boolean;
  };
  resources?: {
    supported?: boolean;
  };
  prompts?: {
    supported?: boolean;
  };
}

/**
 * Server info
 */
export interface ServerInfo {
  name: string;
  version: string;
}

/**
 * Tool call result
 */
export interface ToolCallResult {
  content: TextContent[];
  isError?: boolean;
}

/**
 * Text content
 */
export interface TextContent {
  type: 'text';
  text: string;
}

/**
 * Tools list response
 */
export interface ToolsListResponse {
  tools: McpTool[];
}

/**
 * MCP Exception
 */
export class McpException extends Error {
  constructor(
    message: string,
    public code?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'McpException';
  }
}
