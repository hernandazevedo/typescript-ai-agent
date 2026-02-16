import inquirer from 'inquirer';
import * as readline from 'readline';

/**
 * User choice options
 */
export enum Choice {
  YES = 'YES',
  NO = 'NO',
  ALWAYS = 'ALWAYS',
  DENY = 'DENY',
  VIEW = 'VIEW',
  IDE = 'IDE',
  HELP = 'HELP'
}

/**
 * Interactive menu for terminal UI
 */
export class InteractiveMenu {
  /**
   * Show interactive menu with arrow key navigation using inquirer
   */
  async showMenu(message: string = 'Choose an option:'): Promise<Choice | null> {
    try {
      // Check if stdin is available
      if (!process.stdin.isTTY) {
        console.log('[Interactive] No TTY available, using text menu');
        return this.showTextMenu(message);
      }

      const answer = await inquirer.prompt<{ choice: string }>([
        {
          type: 'list',
          name: 'choice',
          message,
          choices: [
            { name: 'Yes - Approve this operation', value: 'y' },
            { name: 'No - Reject this operation', value: 'n' },
            { name: 'Always - Switch to brave mode (approve all)', value: 'a' },
            { name: 'Deny - Reject all operations', value: 'd' },
            { name: 'View - Show full diff', value: 'v' },
            { name: 'IDE - Open in IntelliJ (if available)', value: 'i' },
            { name: 'Help - Show help', value: '?' }
          ]
        }
      ]);

      return this.parseChoice(answer.choice);
    } catch (error) {
      console.log('[Interactive] Inquirer failed, falling back to text menu');
      return this.showTextMenu(message);
    }
  }

  /**
   * Fallback text-based menu without arrow keys
   */
  async showTextMenu(message: string = 'Choose an option:'): Promise<Choice | null> {
    console.log('\n' + message);
    console.log('  (y)es    - Approve this operation');
    console.log('  (n)o     - Reject this operation');
    console.log('  (a)lways - Switch to brave mode (approve all)');
    console.log('  (d)eny   - Reject all operations');
    console.log('  (v)iew   - Show full diff');
    console.log('  (i)de    - Open in IntelliJ (if available)');
    console.log('  (?)      - Show help');
    console.log('');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Your choice: ', (answer) => {
        rl.close();
        const choice = this.parseChoice(answer.trim().toLowerCase());
        resolve(choice);
      });
    });
  }

  /**
   * Parse user input to Choice enum
   */
  private parseChoice(input: string): Choice | null {
    switch (input.toLowerCase()) {
      case 'y':
      case 'yes':
        return Choice.YES;
      case 'n':
      case 'no':
        return Choice.NO;
      case 'a':
      case 'always':
        return Choice.ALWAYS;
      case 'd':
      case 'deny':
        return Choice.DENY;
      case 'v':
      case 'view':
        return Choice.VIEW;
      case 'i':
      case 'ide':
        return Choice.IDE;
      case '?':
      case 'help':
        return Choice.HELP;
      default:
        return null;
    }
  }

  /**
   * Show help message
   */
  showHelp(): void {
    console.log('\n=== Interactive Mode Help ===');
    console.log('');
    console.log('Options:');
    console.log('  y/yes    - Approve the current file operation');
    console.log('  n/no     - Reject the current file operation');
    console.log('  a/always - Switch to brave mode (auto-approve all remaining operations)');
    console.log('  d/deny   - Reject all remaining operations and exit');
    console.log('  v/view   - View the full diff of the proposed changes');
    console.log('  i/ide    - Open the diff in IntelliJ IDEA (if installed)');
    console.log('  ?/help   - Show this help message');
    console.log('');
    console.log('Tip: Review diffs carefully before approving changes!');
    console.log('');
  }
}
