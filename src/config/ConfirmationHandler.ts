/**
 * Result of file write confirmation
 */
export type FileWriteConfirmation =
  | { type: 'approved' }
  | { type: 'rejected' }
  | { type: 'error'; message: string };

export const FileWriteConfirmation = {
  approved(): FileWriteConfirmation {
    return { type: 'approved' };
  },

  rejected(): FileWriteConfirmation {
    return { type: 'rejected' };
  },

  error(message: string): FileWriteConfirmation {
    return { type: 'error', message };
  },

  isApproved(confirmation: FileWriteConfirmation): boolean {
    return confirmation.type === 'approved';
  },

  isRejected(confirmation: FileWriteConfirmation): boolean {
    return confirmation.type === 'rejected';
  },

  isError(confirmation: FileWriteConfirmation): boolean {
    return confirmation.type === 'error';
  }
};

/**
 * Interface for confirming potentially dangerous operations
 */
export interface ConfirmationHandler {
  requestFileWriteConfirmation(options: {
    path: string;
    overwrite: boolean;
    oldContent?: string;
    newContent?: string;
  }): Promise<FileWriteConfirmation>;

  requestShellCommandConfirmation(command: string): Promise<FileWriteConfirmation>;
}

/**
 * Brave mode - auto-approves all operations
 */
export class BraveConfirmationHandler implements ConfirmationHandler {
  async requestFileWriteConfirmation(): Promise<FileWriteConfirmation> {
    return FileWriteConfirmation.approved();
  }

  async requestShellCommandConfirmation(): Promise<FileWriteConfirmation> {
    return FileWriteConfirmation.approved();
  }
}

/**
 * Safe mode - currently auto-approves but designed for rules-based approval
 */
export class SafeConfirmationHandler implements ConfirmationHandler {
  async requestFileWriteConfirmation(): Promise<FileWriteConfirmation> {
    // TODO: Add rules-based approval logic
    return FileWriteConfirmation.approved();
  }

  async requestShellCommandConfirmation(): Promise<FileWriteConfirmation> {
    // TODO: Add rules-based approval logic
    return FileWriteConfirmation.approved();
  }
}
