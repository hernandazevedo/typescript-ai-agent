# Conversion Notes: Kotlin to TypeScript

## Overview

This project is a complete TypeScript conversion of the [Kotlin AI Agent with Koog Framework](https://github.com/hernandazevedo/kotlin-ai-agent-koog). All major features have been successfully converted while maintaining the original architecture and best practices.

## Conversion Summary

### ✅ Fully Converted Features

#### Core Architecture
- **Tool System**: Abstract base class with OpenAI function calling integration
- **FileSystemProvider**: Platform-agnostic abstraction with Node.js implementation
- **ConfirmationHandler**: Brave, Safe, and Interactive modes
- **Result Type**: Type-safe error handling without exceptions
- **Validation**: Path and content validation with security checks

#### Tools
- **File System Tools**: list__directory, read__file, create__file, edit__file
- **Shell Command Tool**: execute__shell_command with timeout and partial output preservation
- **MCP Integration**: Full JSON-RPC client with tool discovery and adaptation
- **Sub-Agent Tool**: Code search agent for focused search tasks

#### Interactive Features
- **Diff Viewer**: LCS algorithm with colored output
- **Interactive Menu**: Arrow-key navigation using inquirer
- **IDE Integration**: IntelliJ IDEA merge tool support
- **Confirmation Flow**: Diff preview with approve/reject/always/deny/view/IDE options

#### Agent System
- **AIAgent**: Main orchestrator with conversation management
- **OpenAI Integration**: GPT-4o with function calling
- **Sub-Agents**: CodeSearchAgent using GPT-4o-mini for efficiency
- **System Prompts**: Comprehensive prompts for main and sub-agents

## Key TypeScript Adaptations

### Language Features

| Kotlin Concept | TypeScript Equivalent | Implementation |
|---------------|----------------------|----------------|
| `sealed class` | Discriminated unions | Type unions with `type` field |
| `data class` | Interface/type | Readonly interfaces |
| `object` (singleton) | Const object | `export const Object = { ... }` |
| `Result<T>` | `Result<T, E>` | Custom type with success/error variants |
| `suspend fun` | `async function` | Native async/await |
| `expect/actual` | Abstract class | Platform-specific implementations |

### Library Replacements

| Kotlin Library | TypeScript Library | Purpose |
|---------------|-------------------|---------|
| Koog Framework | Custom implementation | Agent orchestration |
| kotlinx.coroutines | Native async/await | Asynchronous operations |
| kotlinx.serialization | Native JSON | Serialization |
| OkHttp | Axios | HTTP client |
| JLine3 | Inquirer | Terminal UI |

### Pattern Conversions

#### 1. Sealed Classes → Discriminated Unions

**Kotlin:**
```kotlin
sealed class FileWriteConfirmation {
    data object Approved : FileWriteConfirmation()
    data object Rejected : FileWriteConfirmation()
    data class Error(val message: String) : FileWriteConfirmation()
}
```

**TypeScript:**
```typescript
export type FileWriteConfirmation =
  | { type: 'approved' }
  | { type: 'rejected' }
  | { type: 'error'; message: string };
```

#### 2. Object Singletons → Const Objects

**Kotlin:**
```kotlin
object DiffViewer {
    fun generateDiff(oldContent: String?, newContent: String?): String {
        // ...
    }
}
```

**TypeScript:**
```typescript
export const DiffViewer = {
  generateDiff(oldContent: string | undefined, newContent: string | undefined): string {
    // ...
  }
};
```

#### 3. Result Type

**Kotlin:**
```kotlin
fun readFile(path: String): Result<String>
```

**TypeScript:**
```typescript
async readFile(path: string): Promise<Result<string, Error>>
```

#### 4. Tool Interface

**Kotlin (Koog SimpleTool):**
```kotlin
abstract class SimpleTool<Args : Any> : Tool {
    abstract val name: String
    abstract val description: String
    abstract suspend fun execute(args: Args): String
}
```

**TypeScript:**
```typescript
export abstract class BaseTool<TArgs = any, TResult = string> implements Tool<TArgs, TResult> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract execute(args: TArgs): Promise<TResult>;
}
```

## File Structure Mapping

### Kotlin → TypeScript

```
kotlin-ai-agent-koog/src/          →  typescript-ai-agent/src/
├── commonMain/kotlin/com/agents/  →  (merged into src/)
│   ├── FileSystemProvider.kt      →  core/FileSystemProvider.ts
│   ├── config/
│   │   ├── ConfirmationHandler.kt →  config/ConfirmationHandler.ts
│   │   └── DiffViewer.kt          →  config/DiffViewer.ts
│   ├── tools/
│   │   └── FileSystemTools.kt     →  tools/FileSystemTools.ts
│   └── validation/
│       └── ToolValidation.kt      →  validation/ToolValidation.ts
└── jvmMain/kotlin/com/agents/     →  (merged into src/)
    ├── Main.kt                    →  index.ts
    ├── config/
    │   ├── InteractiveConfirmationHandler.jvm.kt → config/InteractiveConfirmationHandler.ts
    │   ├── InteractiveMenu.kt     →  config/InteractiveMenu.ts
    │   └── IDEDiffApproval.kt     →  config/IDEDiffApproval.ts
    ├── tools/
    │   └── ShellCommandTool.jvm.kt → tools/ShellCommandTool.ts
    ├── mcp/
    │   ├── McpClient.kt           →  mcp/McpClient.ts
    │   ├── McpProtocol.kt         →  mcp/McpProtocol.ts
    │   ├── McpToolAdapter.kt      →  mcp/McpToolAdapter.ts
    │   └── McpToolDiscovery.kt    →  mcp/McpToolDiscovery.ts
    └── subagents/
        ├── CodeSearchAgent.kt     →  subagents/CodeSearchAgent.ts
        └── CodeSearchAgentTool.kt →  subagents/CodeSearchAgentTool.ts
```

## Not Yet Implemented

### Observability (Planned)
- OpenTelemetry integration
- Langfuse exporter
- Event-based logging
- Session tracking

The infrastructure is in place (environment variables, configuration), but the actual implementation is pending.

### Testing
- Unit tests for validation
- Integration tests for file operations
- Mock MCP server for testing
- End-to-end agent tests

Test files can follow the same structure as Kotlin:
```
src/
├── __tests__/
│   ├── validation/ToolValidation.test.ts
│   ├── tools/FileSystemTools.test.ts
│   ├── tools/ShellCommandTool.test.ts
│   └── mcp/McpProtocol.test.ts
```

## Dependencies Comparison

### Kotlin Dependencies
```kotlin
// Koog Framework
implementation("ai.koog:koog-agents:0.6.1")
implementation("ai.koog:agents-features-opentelemetry:0.6.1")
implementation("ai.koog:agents-features-trace:0.6.1")

// HTTP & Terminal
implementation("com.squareup.okhttp3:okhttp:4.12.0")
implementation("org.jline:jline:3.27.1")
```

### TypeScript Dependencies
```json
{
  "dependencies": {
    "openai": "^4.77.3",
    "axios": "^1.7.9",
    "inquirer": "^12.3.0",
    "chalk": "^5.4.1",
    "dotenv": "^16.4.7",
    "diff": "^7.0.0"
  }
}
```

## Best Practices Preserved

✅ **Double underscore naming**: All tools follow `tool__name` convention
✅ **Input validation**: Path traversal prevention, size limits
✅ **Confirmation system**: Pluggable handlers for different modes
✅ **Structured results**: Metadata in outputs (line counts, exit codes)
✅ **Error handling**: Result-based, no uncaught exceptions
✅ **Timeout support**: Commands respect timeouts with partial output
✅ **Platform-agnostic**: Cross-platform file and shell abstractions
✅ **Sub-agent delegation**: Specialized agents for focused tasks
✅ **Tool discovery**: Dynamic MCP tool registration

## Usage Comparison

### Kotlin
```bash
./gradlew jvmRun --args="/path/to/project 'Your task' --brave"
```

### TypeScript
```bash
npm run dev /path/to/project "Your task" -- --brave
```

## Performance Considerations

### Strengths
- Native async/await (similar performance to Kotlin coroutines)
- Efficient JSON parsing
- Fast startup time with Node.js

### Differences from Kotlin
- No JVM warm-up time (faster cold starts)
- Single-threaded event loop (different from JVM threads)
- V8 JIT compilation (comparable to JVM JIT)

## Future Enhancements

### High Priority
1. Implement OpenTelemetry/Langfuse observability
2. Add comprehensive test suite (vitest)
3. Create example projects/demos
4. Add more sub-agents (refactoring, testing, documentation)

### Medium Priority
1. Support for more LLMs (Claude, Gemini)
2. Web UI for interactive control
3. File diff support for safer editing
4. Retry logic with exponential backoff

### Low Priority
1. Plugin system for custom tools
2. Configuration file support
3. Multiple project support
4. Tool usage analytics

## Troubleshooting

### Common Issues

**Issue**: `OPENAI_API_KEY not set`
**Solution**: Create `.env` file with your API key

**Issue**: MCP tools not found
**Solution**: Start MCP server first or run without MCP tools

**Issue**: Interactive mode not working
**Solution**: Ensure running in a TTY environment

**Issue**: TypeScript errors
**Solution**: Run `npm install` and `npm run build`

## Contributing

When adding new features:

1. **Maintain architecture**: Keep tool-based design
2. **Follow patterns**: Use Result type, validation, confirmation
3. **TypeScript best practices**: Strict types, interfaces over classes when possible
4. **Test coverage**: Add tests for new features
5. **Documentation**: Update README and this file

## Credits

Original Kotlin implementation: [kotlin-ai-agent-koog](https://github.com/hernandazevedo/kotlin-ai-agent-koog)

TypeScript conversion maintains the spirit and architecture of the original while adapting to TypeScript/Node.js idioms.
