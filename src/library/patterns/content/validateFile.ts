import { extensionOf } from './fileKind';
import { formatBytes } from './formatBytes';

/** What an upload target accepts. */
export type FileRule = {
  /** Allowed extensions, lower case, without the dot. Leave out to allow every type. */
  extensions?: readonly string[];
  /** Largest allowed size in bytes. */
  maxBytes?: number;
};

export type FileProblem = { reason: 'type' | 'size' | 'empty'; message: string };

function listExtensions(extensions: readonly string[]): string {
  const upper = extensions.map((extension) => extension.toUpperCase());
  if (upper.length <= 1) return upper.join('');
  return `${upper.slice(0, -1).join(', ')} or ${upper[upper.length - 1]}`;
}

/**
 * Checks one file against an upload rule before anything is sent. Returns what is wrong and how
 * to fix it in words that can be shown as they are, or `null` when the file is fine. Type is
 * checked before size, so a file never gets two messages.
 */
export function validateFile(file: { name: string; size: number }, rule: FileRule): FileProblem | null {
  const { extensions, maxBytes } = rule;
  if (extensions !== undefined && !extensions.includes(extensionOf(file.name))) {
    return { reason: 'type', message: `This file type is not supported. Use ${listExtensions(extensions)}.` };
  }
  if (file.size === 0) {
    return { reason: 'empty', message: 'This file is empty. Export it again and retry.' };
  }
  if (maxBytes !== undefined && file.size > maxBytes) {
    return {
      reason: 'size',
      message: `This file is ${formatBytes(file.size)}. The limit is ${formatBytes(maxBytes)}.`,
    };
  }
  return null;
}
