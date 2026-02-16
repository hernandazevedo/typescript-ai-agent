import OpenAI from 'openai';
import { Tool } from '../core/Tool.js';

/**
 * Message in the conversation
 */
export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
  tool_call_id?: string;
}

/**
 * AI Agent configuration
 */
export interface AIAgentConfig {
  apiKey: string;
  model?: string;
  systemPrompt: string;
  tools: Tool[];
  maxIterations?: number;
  verbose?: boolean;
}

/**
 * Main AI Agent orchestrator
 * Manages conversation, tool execution, and OpenAI integration
 */
export class AIAgent {
  private openai: OpenAI;
  private config: Required<AIAgentConfig>;
  private messages: Message[] = [];
  private toolMap: Map<string, Tool>;

  constructor(config: AIAgentConfig) {
    this.config = {
      ...config,
      model: config.model || 'gpt-4o',
      maxIterations: config.maxIterations || 20,
      verbose: config.verbose || false
    };

    this.openai = new OpenAI({
      apiKey: this.config.apiKey
    });

    // Build tool map
    this.toolMap = new Map();
    for (const tool of this.config.tools) {
      this.toolMap.set(tool.name, tool);
    }

    // Initialize with system prompt
    this.messages.push({
      role: 'system',
      content: this.config.systemPrompt
    });
  }

  /**
   * Run the agent with a user task
   */
  async run(userInput: string): Promise<string> {
    // Add user message
    this.messages.push({
      role: 'user',
      content: userInput
    });

    let iterations = 0;

    while (iterations < this.config.maxIterations) {
      iterations++;

      if (this.config.verbose) {
        console.log(`\n[Agent] Iteration ${iterations}/${this.config.maxIterations}`);
      }

      // Get completion from OpenAI
      const completion = await this.getCompletion();

      const message = completion.choices[0]?.message;
      if (!message) {
        throw new Error('No message in completion');
      }

      // Add assistant message
      this.messages.push({
        role: 'assistant',
        content: message.content || '',
        tool_calls: message.tool_calls
      });

      // Check if agent wants to use tools
      if (message.tool_calls && message.tool_calls.length > 0) {
        await this.executeToolCalls(message.tool_calls);
        continue;
      }

      // No tool calls - agent is done
      if (this.config.verbose) {
        console.log('[Agent] Task completed');
      }

      return message.content || '';
    }

    throw new Error(`Max iterations (${this.config.maxIterations}) reached`);
  }

  /**
   * Get completion from OpenAI
   */
  private async getCompletion(): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const tools = Array.from(this.toolMap.values()).map((tool) =>
      this.toolToOpenAIFunction(tool)
    );

    if (this.config.verbose) {
      console.log('[Agent] Calling OpenAI with', tools.length, 'tools');
    }

    const completion = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: this.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: 'auto'
    });

    if (this.config.verbose) {
      const usage = completion.usage;
      console.log(`[Agent] Tokens: ${usage?.prompt_tokens} prompt, ${usage?.completion_tokens} completion, ${usage?.total_tokens} total`);
    }

    return completion;
  }

  /**
   * Execute tool calls
   */
  private async executeToolCalls(
    toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[]
  ): Promise<void> {
    for (const toolCall of toolCalls) {
      const tool = this.toolMap.get(toolCall.function.name);

      if (!tool) {
        this.messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: `ERROR: Tool '${toolCall.function.name}' not found`
        });
        continue;
      }

      if (this.config.verbose) {
        console.log(`[Agent] Executing tool: ${toolCall.function.name}`);
        console.log(`[Agent] Arguments:`, toolCall.function.arguments);
      }

      try {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await tool.execute(args);

        if (this.config.verbose) {
          const preview = result.length > 200 ? result.substring(0, 200) + '...' : result;
          console.log(`[Agent] Result:`, preview);
        }

        this.messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result
        });
      } catch (error) {
        const errorMessage = `ERROR: ${error instanceof Error ? error.message : String(error)}`;

        if (this.config.verbose) {
          console.error(`[Agent] Error:`, errorMessage);
        }

        this.messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: errorMessage
        });
      }
    }
  }

  /**
   * Convert Tool to OpenAI function format
   */
  private toolToOpenAIFunction(tool: Tool): OpenAI.Chat.Completions.ChatCompletionTool {
    return {
      type: 'function',
      function: tool.toOpenAIFunction()
    };
  }

  /**
   * Get conversation history
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Close agent and clean up resources
   */
  async close(): Promise<void> {
    // Placeholder for cleanup (e.g., flush telemetry)
    if (this.config.verbose) {
      console.log('[Agent] Closing agent');
    }
  }
}
