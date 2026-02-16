import { ConfirmationHandler, FileWriteConfirmation } from './ConfirmationHandler.js';
import { InteractiveMenu, Choice } from './InteractiveMenu.js';
import { IDEDiffApproval, ApprovalResult } from './IDEDiffApproval.js';
import { DiffViewer } from './DiffViewer.js';
import chalk from 'chalk';

/**
 * Interactive confirmation handler with diff preview and terminal UI
 */
export class InteractiveConfirmationHandler implements ConfirmationHandler {
  private alwaysApprove = false;
  private alwaysDeny = false;
  private consecutiveNulls = 0;
  private readonly menu = new InteractiveMenu();
  private readonly MAX_CONSECUTIVE_NULLS = 3;

  async requestFileWriteConfirmation(options: {
    path: string;
    overwrite: boolean;
    oldContent?: string;
    newContent?: string;
  }): Promise<FileWriteConfirmation> {
    // Check state
    if (this.alwaysDeny) {
      return FileWriteConfirmation.rejected();
    }

    if (this.alwaysApprove) {
      return FileWriteConfirmation.approved();
    }

    // Check stdin availability
    if (!process.stdin.isTTY) {
      console.log('[Interactive] No TTY available, auto-approving');
      return FileWriteConfirmation.approved();
    }

    // Show operation details
    this.showOperationDetails(options);

    // Show diff preview if editing
    if (options.overwrite && options.oldContent && options.newContent) {
      this.showDiffPreview(options.oldContent, options.newContent);
    }

    // Get user choice
    return this.getUserChoice(options);
  }

  async requestShellCommandConfirmation(command: string): Promise<FileWriteConfirmation> {
    // Check state
    if (this.alwaysDeny) {
      return FileWriteConfirmation.rejected();
    }

    if (this.alwaysApprove) {
      return FileWriteConfirmation.approved();
    }

    // Check stdin availability
    if (!process.stdin.isTTY) {
      console.log('[Interactive] No TTY available, auto-approving');
      return FileWriteConfirmation.approved();
    }

    // Show command details
    console.log(chalk.yellow('\n⚠️  Shell Command Execution Request:'));
    console.log(chalk.cyan(`Command: ${command}`));
    console.log('');

    // Get user choice (simpler for shell commands)
    return this.getUserChoiceForCommand(command);
  }

  private showOperationDetails(options: {
    path: string;
    overwrite: boolean;
    oldContent?: string;
    newContent?: string;
  }): void {
    console.log('');
    console.log(chalk.yellow('━'.repeat(60)));

    if (options.overwrite) {
      console.log(chalk.yellow('📝 File Edit Request'));
    } else {
      console.log(chalk.yellow('📄 File Creation Request'));
    }

    console.log(chalk.cyan(`Path: ${options.path}`));

    if (options.newContent) {
      const lines = options.newContent.split('\n').length;
      const chars = options.newContent.length;
      console.log(chalk.gray(`Size: ${lines} lines, ${chars} characters`));
    }

    console.log(chalk.yellow('━'.repeat(60)));
  }

  private showDiffPreview(oldContent: string, newContent: string): void {
    const stats = DiffViewer.computeStats(oldContent, newContent);

    console.log(chalk.cyan('\n📊 Changes:'));
    console.log(chalk.green(`  +${stats.additions} additions`));
    console.log(chalk.red(`  -${stats.deletions} deletions`));
    if (stats.modifications > 0) {
      console.log(chalk.yellow(`  ~${stats.modifications} modifications`));
    }

    // Show abbreviated diff (first 10 lines)
    const diff = DiffViewer.generateDiff(oldContent, newContent, 2);
    const diffLines = diff.split('\n').slice(0, 10);
    const abbreviated = diffLines.length < diff.split('\n').length;

    console.log(chalk.gray('\n📋 Diff Preview:'));
    console.log(DiffViewer.formatWithColors(diffLines.join('\n')));

    if (abbreviated) {
      console.log(chalk.gray('... (use "v" to view full diff)'));
    }
    console.log('');
  }

  private async getUserChoice(options: {
    path: string;
    overwrite: boolean;
    oldContent?: string;
    newContent?: string;
  }): Promise<FileWriteConfirmation> {
    while (true) {
      const choice = await this.menu.showMenu('Approve this operation?');

      if (choice === null) {
        this.consecutiveNulls++;
        if (this.consecutiveNulls >= this.MAX_CONSECUTIVE_NULLS) {
          console.log(chalk.red('\n❌ Too many invalid inputs. Rejecting operation.'));
          return FileWriteConfirmation.rejected();
        }
        console.log(chalk.red('Invalid choice. Please try again.'));
        continue;
      }

      this.consecutiveNulls = 0;

      switch (choice) {
        case Choice.YES:
          console.log(chalk.green('✅ Approved'));
          return FileWriteConfirmation.approved();

        case Choice.NO:
          console.log(chalk.red('❌ Rejected'));
          return FileWriteConfirmation.rejected();

        case Choice.ALWAYS:
          console.log(chalk.green('✅ Switching to brave mode (auto-approve all)'));
          this.alwaysApprove = true;
          return FileWriteConfirmation.approved();

        case Choice.DENY:
          console.log(chalk.red('❌ Rejecting all operations'));
          this.alwaysDeny = true;
          return FileWriteConfirmation.rejected();

        case Choice.VIEW:
          this.showFullDiff(options.oldContent, options.newContent);
          break;

        case Choice.IDE:
          const ideResult = await this.tryIDEApproval(
            options.path,
            options.oldContent,
            options.newContent
          );
          if (ideResult !== null) {
            return ideResult;
          }
          break;

        case Choice.HELP:
          this.menu.showHelp();
          break;
      }
    }
  }

  private async getUserChoiceForCommand(_command: string): Promise<FileWriteConfirmation> {
    while (true) {
      const choice = await this.menu.showTextMenu('Execute this command?');

      if (choice === null) {
        console.log(chalk.red('Invalid choice. Please try again.'));
        continue;
      }

      switch (choice) {
        case Choice.YES:
          console.log(chalk.green('✅ Approved'));
          return FileWriteConfirmation.approved();

        case Choice.NO:
          console.log(chalk.red('❌ Rejected'));
          return FileWriteConfirmation.rejected();

        case Choice.ALWAYS:
          console.log(chalk.green('✅ Switching to brave mode (auto-approve all)'));
          this.alwaysApprove = true;
          return FileWriteConfirmation.approved();

        case Choice.DENY:
          console.log(chalk.red('❌ Rejecting all operations'));
          this.alwaysDeny = true;
          return FileWriteConfirmation.rejected();

        case Choice.HELP:
          this.menu.showHelp();
          break;

        default:
          console.log(chalk.yellow('Option not available for shell commands'));
          break;
      }
    }
  }

  private showFullDiff(oldContent: string | undefined, newContent: string | undefined): void {
    console.log(chalk.cyan('\n📋 Full Diff:'));
    console.log(chalk.gray('━'.repeat(60)));

    const diff = DiffViewer.generateDiff(oldContent, newContent);
    console.log(DiffViewer.formatWithColors(diff));

    console.log(chalk.gray('━'.repeat(60)));
    console.log('');
  }

  private async tryIDEApproval(
    path: string,
    oldContent: string | undefined,
    newContent: string | undefined
  ): Promise<FileWriteConfirmation | null> {
    if (!IDEDiffApproval.isIntelliJAvailable()) {
      console.log(chalk.yellow('\n⚠️  IntelliJ IDEA not found'));
      console.log(chalk.gray('Searched standard installation paths'));
      return null;
    }

    const result = await IDEDiffApproval.showIntelliJDiffForApproval(
      path,
      oldContent,
      newContent
    );

    switch (result) {
      case ApprovalResult.APPROVED:
        console.log(chalk.green('\n✅ Approved via IntelliJ IDEA'));
        return FileWriteConfirmation.approved();

      case ApprovalResult.REJECTED:
        console.log(chalk.red('\n❌ Rejected via IntelliJ IDEA'));
        return FileWriteConfirmation.rejected();

      case ApprovalResult.IDE_NOT_AVAILABLE:
        console.log(chalk.yellow('\n⚠️  IntelliJ IDEA not available'));
        return null;
    }
  }
}
