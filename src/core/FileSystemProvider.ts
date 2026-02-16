import { Result } from '../types/Result.js';

/**
 * Platform-agnostic file system interface
 * Allows for different implementations (read-only, read-write, mock, etc.)
 */
export interface FileSystemProvider {
  readonly canWrite: boolean;

  listDirectory(path: string): Promise<Result<string[], Error>>;
  readFile(path: string): Promise<Result<string, Error>>;
  writeFile(path: string, content: string): Promise<Result<void, Error>>;
  fileExists(path: string): Promise<boolean>;
  directoryExists(path: string): Promise<boolean>;
}

/**
 * Node.js file system implementation
 */
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export class NodeFileSystemProvider implements FileSystemProvider {
  constructor(public readonly canWrite: boolean) {}

  async listDirectory(dirPath: string): Promise<Result<string[], Error>> {
    try {
      if (!existsSync(dirPath)) {
        return Result.err(new Error(`Directory not found: ${dirPath}`));
      }

      const entries = await fs.readdir(dirPath);
      const fullPaths = entries.map(entry => path.join(dirPath, entry));
      return Result.ok(fullPaths);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async readFile(filePath: string): Promise<Result<string, Error>> {
    try {
      if (!existsSync(filePath)) {
        return Result.err(new Error(`File not found: ${filePath}`));
      }

      const content = await fs.readFile(filePath, 'utf-8');
      return Result.ok(content);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async writeFile(filePath: string, content: string): Promise<Result<void, Error>> {
    if (!this.canWrite) {
      return Result.err(new Error('Write operations not allowed (read-only file system)'));
    }

    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(filePath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}

/**
 * Factory for creating file system providers
 */
export const FileSystem = {
  readOnly: new NodeFileSystemProvider(false),
  readWrite: new NodeFileSystemProvider(true)
};
