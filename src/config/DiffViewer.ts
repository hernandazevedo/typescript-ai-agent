import chalk from 'chalk';

/**
 * Diff line types
 */
export type DiffLine =
  | { type: 'context'; content: string }
  | { type: 'added'; content: string }
  | { type: 'removed'; content: string };

/**
 * Diff statistics
 */
export interface DiffStats {
  additions: number;
  deletions: number;
  modifications: number;
}

/**
 * Generates and formats unified diffs using LCS algorithm
 */
export const DiffViewer = {
  /**
   * Generate unified diff between old and new content
   */
  generateDiff(oldContent: string | undefined, newContent: string | undefined, contextLines: number = 3): string {
    // Handle special cases
    if (!oldContent && !newContent) {
      return '(no changes)';
    }

    if (!oldContent) {
      const lines = newContent!.split('\n').length;
      return `New file\n+++ ${lines} lines`;
    }

    if (!newContent) {
      const lines = oldContent.split('\n').length;
      return `Deleted file\n--- ${lines} lines`;
    }

    // Generate diff using LCS
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const diffLines = this.computeDiff(oldLines, newLines);

    // Format as unified diff
    return this.formatUnifiedDiff(diffLines, contextLines);
  },

  /**
   * Format diff with ANSI colors
   */
  formatWithColors(diff: string, useColors: boolean = true): string {
    if (!useColors) {
      return diff;
    }

    const lines = diff.split('\n');
    return lines
      .map((line) => {
        if (line.startsWith('+')) {
          return chalk.green(line);
        } else if (line.startsWith('-')) {
          return chalk.red(line);
        } else if (line.startsWith('@@')) {
          return chalk.cyan(line);
        } else if (line.startsWith('===')) {
          return chalk.gray(line);
        }
        return line;
      })
      .join('\n');
  },

  /**
   * Compute diff statistics
   */
  computeStats(oldContent: string | undefined, newContent: string | undefined): DiffStats {
    if (!oldContent && !newContent) {
      return { additions: 0, deletions: 0, modifications: 0 };
    }

    if (!oldContent) {
      return { additions: newContent!.split('\n').length, deletions: 0, modifications: 0 };
    }

    if (!newContent) {
      return { additions: 0, deletions: oldContent.split('\n').length, modifications: 0 };
    }

    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const diffLines = this.computeDiff(oldLines, newLines);

    let additions = 0;
    let deletions = 0;

    for (const line of diffLines) {
      if (line.type === 'added') {
        additions++;
      } else if (line.type === 'removed') {
        deletions++;
      }
    }

    const modifications = Math.min(additions, deletions);
    additions -= modifications;
    deletions -= modifications;

    return { additions, deletions, modifications };
  },

  /**
   * Compute diff using Longest Common Subsequence (LCS) algorithm
   */
  computeDiff(oldLines: string[], newLines: string[]): DiffLine[] {
    const lcs = this.computeLCS(oldLines, newLines);
    const diffLines: DiffLine[] = [];

    let i = 0; // oldLines index
    let j = 0; // newLines index
    let k = 0; // lcs index

    while (i < oldLines.length || j < newLines.length) {
      if (k < lcs.length && i < oldLines.length && oldLines[i] === lcs[k]) {
        // Line is in LCS (unchanged)
        diffLines.push({ type: 'context', content: oldLines[i] });
        i++;
        j++;
        k++;
      } else if (k < lcs.length && j < newLines.length && newLines[j] === lcs[k]) {
        // Line added in new
        while (i < oldLines.length && oldLines[i] !== lcs[k]) {
          diffLines.push({ type: 'removed', content: oldLines[i] });
          i++;
        }
      } else {
        // Handle remaining removals and additions
        if (i < oldLines.length && (k >= lcs.length || oldLines[i] !== lcs[k])) {
          diffLines.push({ type: 'removed', content: oldLines[i] });
          i++;
        }
        if (j < newLines.length && (k >= lcs.length || newLines[j] !== lcs[k])) {
          diffLines.push({ type: 'added', content: newLines[j] });
          j++;
        }
      }
    }

    return diffLines;
  },

  /**
   * Compute Longest Common Subsequence using dynamic programming
   */
  computeLCS(a: string[], b: string[]): string[] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    // Build LCS length table
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Reconstruct LCS
    const lcs: string[] = [];
    let i = m;
    let j = n;

    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        lcs.unshift(a[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return lcs;
  },

  /**
   * Format diff lines as unified diff with context
   */
  formatUnifiedDiff(diffLines: DiffLine[], contextLines: number): string {
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let contextCount = 0;

    for (let i = 0; i < diffLines.length; i++) {
      const line = diffLines[i];

      if (line.type === 'context') {
        if (currentChunk.length > 0) {
          contextCount++;
          if (contextCount <= contextLines * 2) {
            currentChunk.push(` ${line.content}`);
          } else {
            // End current chunk
            if (currentChunk.length > 0) {
              chunks.push(currentChunk.join('\n'));
              currentChunk = [];
              contextCount = 0;
            }
          }
        } else {
          contextCount = 0;
        }
      } else {
        // Start new chunk if needed
        if (currentChunk.length === 0 && contextCount === 0) {
          // Add leading context
          const start = Math.max(0, i - contextLines);
          for (let j = start; j < i; j++) {
            if (diffLines[j].type === 'context') {
              currentChunk.push(` ${diffLines[j].content}`);
            }
          }
        }

        contextCount = 0;

        if (line.type === 'added') {
          currentChunk.push(`+${line.content}`);
        } else if (line.type === 'removed') {
          currentChunk.push(`-${line.content}`);
        }
      }
    }

    // Add final chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'));
    }

    if (chunks.length === 0) {
      return '(no changes)';
    }

    return chunks.join('\n\n');
  }
};
