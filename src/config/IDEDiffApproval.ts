import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync } from 'fs';
import { platform } from 'os';

/**
 * Result of IDE approval
 */
export enum ApprovalResult {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IDE_NOT_AVAILABLE = 'IDE_NOT_AVAILABLE'
}

/**
 * IntelliJ IDEA integration for visual diff approval
 */
export const IDEDiffApproval = {
  /**
   * Show IntelliJ diff for approval
   */
  async showIntelliJDiffForApproval(
    _filePath: string,
    oldContent: string | undefined,
    newContent: string | undefined
  ): Promise<ApprovalResult> {
    const ideaPath = this.findIntelliJPath();

    if (!ideaPath) {
      return ApprovalResult.IDE_NOT_AVAILABLE;
    }

    // Create temp files
    const basePath = join(tmpdir(), `base-${Date.now()}.txt`);
    const proposedPath = join(tmpdir(), `proposed-${Date.now()}.txt`);
    const outputPath = join(tmpdir(), `output-${Date.now()}.txt`);

    try {
      await writeFile(basePath, oldContent || '', 'utf-8');
      await writeFile(proposedPath, newContent || '', 'utf-8');
      await writeFile(outputPath, oldContent || '', 'utf-8');

      console.log(`[IDE] Opening IntelliJ IDEA merge window...`);
      console.log(`[IDE] Base: ${basePath}`);
      console.log(`[IDE] Proposed: ${proposedPath}`);
      console.log(`[IDE] Output: ${outputPath}`);
      console.log(`[IDE] Click "Accept Right" or "Accept All" to approve changes`);
      console.log(`[IDE] Close the window without saving to reject`);

      // Open IntelliJ merge tool
      const proc = spawn(
        ideaPath,
        ['merge', basePath, proposedPath, outputPath],
        { stdio: 'inherit' }
      );

      // Wait for process to complete
      await new Promise<void>((resolve, reject) => {
        proc.on('exit', () => resolve());
        proc.on('error', reject);
      });

      // Check if user accepted changes by comparing output
      const outputContent = await this.readFileIfExists(outputPath);

      // Clean up temp files
      await this.cleanupTempFiles([basePath, proposedPath, outputPath]);

      // If output matches proposed content, user approved
      if (outputContent === newContent) {
        return ApprovalResult.APPROVED;
      } else {
        return ApprovalResult.REJECTED;
      }
    } catch (error) {
      console.error(`[IDE] Error: ${error}`);
      return ApprovalResult.IDE_NOT_AVAILABLE;
    }
  },

  /**
   * Find IntelliJ IDEA installation path
   */
  findIntelliJPath(): string | null {
    const os = platform();

    if (os === 'darwin') {
      // macOS paths
      const macPaths = [
        '/Applications/IntelliJ IDEA.app/Contents/MacOS/idea',
        '/Applications/IntelliJ IDEA CE.app/Contents/MacOS/idea',
        '/Applications/IntelliJ IDEA Ultimate.app/Contents/MacOS/idea',
        '/usr/local/bin/idea',
        `${process.env.HOME}/Applications/IntelliJ IDEA.app/Contents/MacOS/idea`
      ];

      for (const path of macPaths) {
        if (existsSync(path)) {
          return path;
        }
      }
    } else if (os === 'win32') {
      // Windows paths
      const winPaths = [
        'C:\\Program Files\\JetBrains\\IntelliJ IDEA\\bin\\idea64.exe',
        'C:\\Program Files (x86)\\JetBrains\\IntelliJ IDEA\\bin\\idea64.exe',
        `${process.env.LOCALAPPDATA}\\JetBrains\\Toolbox\\apps\\IDEA-U\\ch-0\\bin\\idea64.exe`
      ];

      for (const path of winPaths) {
        if (existsSync(path)) {
          return path;
        }
      }
    } else {
      // Linux paths
      const linuxPaths = [
        '/usr/bin/idea',
        '/usr/local/bin/idea',
        '/opt/idea/bin/idea.sh',
        `${process.env.HOME}/.local/share/JetBrains/Toolbox/apps/IDEA-U/ch-0/bin/idea.sh`
      ];

      for (const path of linuxPaths) {
        if (existsSync(path)) {
          return path;
        }
      }
    }

    return null;
  },

  /**
   * Check if IntelliJ IDEA is available
   */
  isIntelliJAvailable(): boolean {
    return this.findIntelliJPath() !== null;
  },

  /**
   * Read file if it exists
   */
  async readFileIfExists(path: string): Promise<string | null> {
    try {
      const fs = await import('fs/promises');
      return await fs.readFile(path, 'utf-8');
    } catch {
      return null;
    }
  },

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(paths: string[]): Promise<void> {
    for (const path of paths) {
      try {
        await unlink(path);
      } catch {
        // Ignore errors
      }
    }
  }
};
