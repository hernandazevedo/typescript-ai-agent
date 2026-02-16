/**
 * Base interface for AI agent tools
 * Inspired by JetBrains Koog SimpleTool
 */
export interface Tool<TArgs = any, TResult = string> {
  readonly name: string;
  readonly description: string;
  execute(args: TArgs): Promise<TResult>;
  toOpenAIFunction(): {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

/**
 * Abstract base class for implementing tools
 */
export abstract class BaseTool<TArgs = any, TResult = string> implements Tool<TArgs, TResult> {
  abstract readonly name: string;
  abstract readonly description: string;

  abstract execute(args: TArgs): Promise<TResult>;

  /**
   * Converts this tool to OpenAI function calling format
   */
  toOpenAIFunction(): {
    name: string;
    description: string;
    parameters: Record<string, any>;
  } {
    return {
      name: this.name,
      description: this.description,
      parameters: this.getParametersSchema()
    };
  }

  /**
   * Override this to provide JSON schema for parameters
   */
  protected getParametersSchema(): Record<string, any> {
    return {
      type: 'object',
      properties: {},
      required: []
    };
  }
}
