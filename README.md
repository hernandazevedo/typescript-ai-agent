# TypeScript AI Agent

A production-ready AI agent built with TypeScript, converted from the [Kotlin AI Agent with Koog framework](https://github.com/hernandazevedo/kotlin-ai-agent-koog). Features include file system operations, shell command execution, interactive confirmation with diff preview, MCP integration for Git operations, and specialized sub-agents.

## Features

- **TypeScript/Node.js**: Built with modern TypeScript and ES modules
- **File System Tools**: List, read, create, and edit files with validation
- **Shell Command Execution**: Run builds, tests, and scripts with timeout support
- **Interactive Mode**: Review changes with colored diff preview before approval
- **IntelliJ IDEA Integration**: Visual diff/merge approval with IDE integration
- **MCP Integration**: Extensible tool system using Model Context Protocol for Git operations
- **Sub-Agent System**: Specialized code search agent for focused tasks
- **OpenAI Integration**: Uses GPT-4o for intelligent decision-making
- **Configurable Safety**: Brave mode for automation, interactive mode for user review
- **LCS Diff Algorithm**: Professional diff generation with line-by-line comparison

## Architecture

### Core Components

- **AIAgent**: Main orchestrator managing conversation and tool execution
- **Tool System**: Extensible tool interface with OpenAI function calling support
- **FileSystemProvider**: Platform-agnostic file system abstraction
- **ConfirmationHandler**: Safety system for approving dangerous operations
- **DiffViewer**: LCS-based diff generation with ANSI colors
- **MCP Client**: JSON-RPC client for Model Context Protocol servers
- **Sub-Agents**: Specialized agents for focused tasks (code search)

### Available Tools

**File System Tools:**
- `list__directory`: Lists files and directories with validation
- `read__file`: Reads file contents with metadata
- `create__file`: Creates new files (with confirmation)
- `edit__file`: Edits existing files (with confirmation and diff preview)
- `execute__shell_command`: Executes shell commands with timeout support

**MCP Tools (when server available):**
- `git_status`: Show working tree status
- `git_diff`: Show changes between commits
- `git_commit`: Record changes to repository
- `git_log`: Show commit logs
- `git_branch`: Manage branches
- And more...

**Sub-Agent Tools:**
- `__find_in_codebase_agent__`: Delegates search tasks to specialized code search agent

## Prerequisites

- Node.js 18 or higher
- OpenAI API Key
- (Optional) [MCP Git Server](https://github.com/hernandazevedo/mcp-git-server) for Git operations

## Installation

1. Clone or copy this project

2. Install dependencies:
```bash
npm install
```

3. Configure your OpenAI API key:
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

4. Build the project:
```bash
npm run build
```

## Usage

### Quick Start

```bash
# Development mode (no build needed)
npm run dev /path/to/project "Your task here"

# Production mode
npm run build
npm start /path/to/project "Your task here"
```

### Execution Modes

#### Interactive Mode (Recommended)

Review and approve changes with diff preview:

```bash
npm run dev /path/to/project "Add error handling to Calculator" -- --interactive
```

**Features:**
- Colored diff preview before each operation
- Arrow-key navigation for approval (via inquirer)
- Options: approve, reject, always approve, deny all, view full diff, open in IDE
- IntelliJ IDEA integration for visual diff (if installed)

#### Brave Mode

Auto-approve all operations (useful for automation):

```bash
npm run dev /path/to/project "Your task" -- --brave
```

#### Safe Mode (Default)

Currently auto-approves but designed for rules-based approval:

```bash
npm run dev /path/to/project "Your task"
```

### Examples

```bash
# Add a new function
npm run dev ~/my-project "Add a function to calculate Fibonacci numbers"

# Refactor code
npm run dev ~/my-project "Refactor the UserService class to use dependency injection"

# Fix bugs with brave mode
npm run dev ~/my-project "Fix the authentication bug" -- --brave

# With interactive confirmation
npm run dev ~/my-project "Update the API to support pagination" -- --interactive

# Run tests and fix errors
npm run dev ~/my-project "Run the tests and fix any failures" -- --brave
```

## Configuration

### Environment Variables

Create a `.env` file:

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional - MCP Server
MCP_SERVER_URL=http://localhost:8080/mcp

# Optional - Langfuse Observability (not yet implemented)
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://us.cloud.langfuse.com
```

### MCP Server Setup (Optional)

For Git operations, you can run the [MCP Git Server](https://github.com/hernandazevedo/mcp-git-server):

```bash
# In a separate terminal
git clone https://github.com/hernandazevedo/mcp-git-server.git
cd mcp-git-server
./gradlew run
```

The agent will automatically discover and use Git tools when the MCP server is available.

## Project Structure

```
src/
├── agent/
│   └── AIAgent.ts              # Main agent orchestrator
├── config/
│   ├── ConfirmationHandler.ts  # Safety confirmation system
│   ├── DiffViewer.ts           # LCS diff generation
│   ├── IDEDiffApproval.ts      # IntelliJ IDEA integration
│   ├── InteractiveConfirmationHandler.ts
│   └── InteractiveMenu.ts      # Terminal UI
├── core/
│   ├── FileSystemProvider.ts   # File system abstraction
│   └── Tool.ts                 # Tool interface
├── mcp/
│   ├── McpClient.ts            # JSON-RPC client
│   ├── McpProtocol.ts          # MCP data structures
│   ├── McpToolAdapter.ts       # MCP to Tool adapter
│   └── McpToolDiscovery.ts     # Auto-discovery
├── subagents/
│   ├── CodeSearchAgent.ts      # Specialized search agent
│   └── CodeSearchAgentTool.ts  # Search tool wrapper
├── tools/
│   ├── FileSystemTools.ts      # File operations
│   └── ShellCommandTool.ts     # Shell execution
├── types/
│   └── Result.ts               # Result type for errors
├── validation/
│   └── ToolValidation.ts       # Input validation
└── index.ts                     # Entry point
```

## Key Design Patterns

### Result Type

Type-safe error handling without exceptions:

```typescript
const result = await fileSystem.readFile(path);
if (result.success) {
  console.log(result.value);
} else {
  console.error(result.error);
}
```

### Tool Interface

Extensible tool system compatible with OpenAI function calling:

```typescript
export interface Tool<TArgs = any, TResult = string> {
  readonly name: string;
  readonly description: string;
  execute(args: TArgs): Promise<TResult>;
  toOpenAIFunction(): OpenAI.Chat.Completions.ChatCompletionTool;
}
```

### Confirmation Handler

Pluggable safety system:

```typescript
const confirmation = await handler.requestFileWriteConfirmation({
  path,
  overwrite: true,
  oldContent,
  newContent
});

if (FileWriteConfirmation.isApproved(confirmation)) {
  // Proceed with write
}
```

### Sub-Agent Delegation

Specialized agents for focused tasks:

```typescript
const codeSearchTool = createCodeSearchAgentTool(apiKey, fileSystem, projectPath);
// Main agent can now delegate search tasks to the sub-agent
```

## Differences from Kotlin Version

### What's Converted

✅ Core abstractions (Tool, FileSystemProvider, ConfirmationHandler)
✅ File system tools (list, read, create, edit)
✅ Shell command tool with timeout
✅ LCS diff algorithm
✅ Interactive confirmation with colored diff
✅ IntelliJ IDEA integration
✅ Interactive menu with arrow key navigation (using inquirer)
✅ MCP protocol and client
✅ MCP tool discovery and adaptation
✅ OpenAI integration with GPT-4o
✅ Sub-agent system (CodeSearchAgent)
✅ Input validation
✅ Result-based error handling

### Not Yet Implemented

⏳ OpenTelemetry/Langfuse observability
⏳ Comprehensive test suite
⏳ Additional sub-agents

### TypeScript Adaptations

- **Kotlin's `sealed class`** → TypeScript discriminated unions
- **Kotlin's `object`** → Const objects or classes with private constructors
- **Kotlin's `Result<T>`** → Custom `Result<T, E>` type
- **Kotlin's coroutines** → Native async/await
- **OkHttp** → Axios for HTTP
- **JLine3** → Inquirer for terminal UI
- **kotlinx.serialization** → Native JSON with type checking

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev /path/to/project "Task"

# Build
npm run build

# Run tests (when implemented)
npm test

# Lint
npm run lint

# Format
npm run format
```

## Best Practices Implemented

From the original Kotlin/Koog implementation:

- **Double underscore naming**: Tools follow `tool__name` convention
- **Input validation**: Path and content validation before operations
- **Security checks**: Path traversal prevention, size limits
- **Confirmation system**: Configurable approval for dangerous operations
- **Structured results**: Clear output with metadata (line counts, file sizes, exit codes)
- **Error recovery**: Meaningful error messages with actionable suggestions
- **Timeout handling**: Commands respect timeout with partial output preservation
- **Platform-agnostic**: Cross-platform file system and shell abstractions

## System Prompts

The agent uses carefully crafted system prompts to guide behavior:

### Main Agent Prompt

- Clear guidelines for tool usage
- Step-by-step approach (search, explore, understand, plan, implement, test, verify, report)
- Tool selection rules (create vs edit, when to use sub-agents)
- Definition of done criteria

### Code Search Agent Prompt

- Focused search specialist role
- Efficient navigation strategy
- Structured output format (FOUND/NOT FOUND)
- Context-aware results

## Contributing

This is a conversion of the Kotlin AI Agent. To contribute:

1. Maintain compatibility with the original feature set
2. Follow TypeScript best practices
3. Keep the tool-based architecture
4. Preserve safety features (confirmation, validation)
5. Add tests for new features

## License

Apache 2.0 (following the original Kotlin project)

## Credits

Converted from [Kotlin AI Agent with Koog Framework](https://github.com/hernandazevedo/kotlin-ai-agent-koog) by Hernand Azevedo.

Original implementation follows best practices from:
- [JetBrains Koog Framework](https://github.com/JetBrains/koog)
- [Building AI Agents in Kotlin Blog Series](https://blog.jetbrains.com/ai/)

## References

- [OpenAI API](https://platform.openai.com/docs)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Node.js Documentation](https://nodejs.org/)
