export const BACKUP_MIME_TYPE = 'application/json' as const;
export const BACKUP_FILE_EXTENSION = '.json' as const;

export interface BackupExportOptions {
  encrypted?: boolean;
}

/**
 * Keep the on-disk name free of account/profile data. The timestamp is UTC so
 * a file exported on Web and iPhone follows the same predictable contract.
 */
export function backupFilename(options: BackupExportOptions = {}, now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return `guanxiang-${options.encrypted ? 'encrypted-' : ''}backup-${stamp}${BACKUP_FILE_EXTENSION}`;
}
