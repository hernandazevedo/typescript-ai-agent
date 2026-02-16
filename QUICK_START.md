# Quick Start Guide

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment:**
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-...
```

3. **Build (optional for production):**
```bash
npm run build
```

## Running the Agent

### Development Mode (Recommended)

No build needed, runs directly with tsx:

```bash
npm run dev <project-path> "<task>"
```

### Examples

**Basic usage:**
```bash
npm run dev ~/my-project "Add a function to calculate factorial"
```

**Interactive mode (with diff preview):**
```bash
npm run dev ~/my-project "Refactor the User class" -- --interactive
```

**Brave mode (auto-approve all):**
```bash
npm run dev ~/my-project "Fix linting errors" -- --brave
```

**Complex task:**
```bash
npm run dev ~/my-project "Add unit tests for the Calculator class and fix any issues" -- --interactive
```

## Modes Explained

### 1. Safe Mode (Default)
- Currently auto-approves operations
- Designed for future rules-based approval
```bash
npm run dev <path> "<task>"
```

### 2. Interactive Mode (Recommended)
- Shows diff preview for all changes
- Prompts for approval/rejection
- Options: yes, no, always, deny, view full diff, open in IDE
```bash
npm run dev <path> "<task>" -- --interactive
```

### 3. Brave Mode (Automation)
- Auto-approves all operations
- Use for trusted/automated scenarios
```bash
npm run dev <path> "<task>" -- --brave
```

## Features in Action

### File Operations

The agent can:
- ✅ List directory contents
- ✅ Read files
- ✅ Create new files
- ✅ Edit existing files
- ✅ Run shell commands
- ✅ Search for code using sub-agent
- ✅ Integrate with Git via MCP (when server running)

### Interactive Diff Preview

When running in interactive mode:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 File Edit Request
Path: /Users/you/project/src/calculator.ts
Size: 45 lines, 892 characters
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Changes:
  +5 additions
  -2 deletions
  ~1 modifications

📋 Diff Preview:
-  function add(a, b) {
+  function add(a: number, b: number): number {
     return a + b;
   }

? Approve this operation? (Use arrow keys)
❯ Yes - Approve this operation
  No - Reject this operation
  Always - Switch to brave mode (approve all)
  Deny - Reject all operations
  View - Show full diff
  IDE - Open in IntelliJ (if available)
  Help - Show help
```

### Sub-Agent Code Search

The agent automatically delegates search tasks:

```bash
npm run dev ~/project "Find where the database connection is established"
```

The agent will:
1. Use `__find_in_codebase_agent__` tool
2. Sub-agent searches strategically
3. Returns focused results with file locations
4. Main agent uses results to complete task

## MCP Integration (Optional)

For Git operations, start the MCP server:

```bash
# In a separate terminal
git clone https://github.com/hernandazevedo/mcp-git-server.git
cd mcp-git-server
./gradlew run
```

Then the agent can use Git tools:
```bash
npm run dev ~/project "Fix the bug and commit the changes with a descriptive message"
```

## Troubleshooting

### "OPENAI_API_KEY not set"
Create a `.env` file with your API key:
```bash
echo "OPENAI_API_KEY=sk-..." > .env
```

### "Module not found"
Install dependencies:
```bash
npm install
```

### "Interactive mode not working"
Ensure you're running in a terminal (TTY). Try brave mode instead:
```bash
npm run dev ~/project "task" -- --brave
```

### Agent runs out of iterations
Increase max iterations or break task into smaller steps:
```bash
# Break into smaller tasks
npm run dev ~/project "Add error handling to Calculator" -- --interactive
npm run dev ~/project "Add tests for Calculator" -- --interactive
```

## Tips for Best Results

### 1. Be Specific
❌ Bad: "Fix the code"
✅ Good: "Add null checks to the getUserById function in UserService.ts"

### 2. Break Down Complex Tasks
❌ Bad: "Rewrite the entire application"
✅ Good: "Refactor the UserService to use dependency injection"

### 3. Use Interactive Mode for Important Changes
```bash
npm run dev ~/project "Update authentication logic" -- --interactive
```

### 4. Use Brave Mode for Safe Operations
```bash
npm run dev ~/project "Run npm install and fix any dependency issues" -- --brave
```

### 5. Let the Agent Search
The agent has a specialized sub-agent for code search:
```bash
npm run dev ~/project "Find the authentication middleware and add rate limiting"
```

## Common Tasks

### Add a Feature
```bash
npm run dev ~/my-app "Add a new endpoint POST /api/users that validates input and saves to database"
```

### Fix Bugs
```bash
npm run dev ~/my-app "Fix the null pointer exception in UserController.ts line 45" -- --interactive
```

### Refactor Code
```bash
npm run dev ~/my-app "Refactor the UserService to use async/await instead of callbacks"
```

### Add Tests
```bash
npm run dev ~/my-app "Add unit tests for the Calculator class with Jest"
```

### Run Tests and Fix
```bash
npm run dev ~/my-app "Run the test suite and fix any failing tests" -- --brave
```

### Documentation
```bash
npm run dev ~/my-app "Add JSDoc comments to all exported functions in utils.ts"
```

## Next Steps

1. Try the examples above
2. Read the full [README.md](README.md)
3. Check [CONVERSION_NOTES.md](CONVERSION_NOTES.md) for implementation details
4. Explore the source code in `src/`

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review [CONVERSION_NOTES.md](CONVERSION_NOTES.md) for architecture details
- Examine the original [Kotlin implementation](https://github.com/hernandazevedo/kotlin-ai-agent-koog)
