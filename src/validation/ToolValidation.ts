/**
 * Validation result type
 */
export type ValidationResult =
  | { isValid: true; errorMessage: null }
  | { isValid: false; errorMessage: string };

export const ValidationResult = {
  valid(): ValidationResult {
    return { isValid: true, errorMessage: null };
  },

  invalid(message: string): ValidationResult {
    return { isValid: false, errorMessage: message };
  }
};

/**
 * Input validation utilities for tool parameters
 */
export const ToolValidation = {
  /**
   * Validates file paths for security
   * - Prevents path traversal attacks (..)
   * - Ensures path is not blank
   */
  validatePath(path: string): ValidationResult {
    if (!path || path.trim().length === 0) {
      return ValidationResult.invalid('Path cannot be empty or blank');
    }

    if (path.includes('..')) {
      return ValidationResult.invalid(
        'Path traversal not allowed (path contains "..")'
      );
    }

    return ValidationResult.valid();
  },

  /**
   * Validates file content
   * - Ensures content is not empty
   * - Enforces maximum size limit (1MB)
   */
  validateContent(content: string): ValidationResult {
    if (content.length === 0) {
      return ValidationResult.invalid('Content cannot be empty');
    }

    const MAX_SIZE = 1_000_000; // 1MB
    if (content.length > MAX_SIZE) {
      return ValidationResult.invalid(
        `Content exceeds maximum size of ${MAX_SIZE} characters (got ${content.length})`
      );
    }

    return ValidationResult.valid();
  },

  /**
   * Validates shell command
   */
  validateCommand(command: string): ValidationResult {
    if (!command || command.trim().length === 0) {
      return ValidationResult.invalid('Command cannot be empty or blank');
    }

    return ValidationResult.valid();
  },

  /**
   * Validates timeout value
   */
  validateTimeout(timeoutSeconds: number): ValidationResult {
    if (timeoutSeconds <= 0) {
      return ValidationResult.invalid('Timeout must be greater than 0');
    }

    if (timeoutSeconds > 600) {
      return ValidationResult.invalid('Timeout cannot exceed 600 seconds (10 minutes)');
    }

    return ValidationResult.valid();
  }
};
