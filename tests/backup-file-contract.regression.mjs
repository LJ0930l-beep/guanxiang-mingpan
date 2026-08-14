import assert from 'node:assert/strict';
import test from 'node:test';

import { BACKUP_FILE_EXTENSION, BACKUP_MIME_TYPE, backupFilename } from '../src/storage/backup-file-contract.ts';

test('P3-F 备份文件名不暴露命主资料，并在 Web/iPhone 之间保持稳定格式', () => {
  const now = new Date('2026-08-15T12:34:56.789Z');
  assert.equal(BACKUP_MIME_TYPE, 'application/json');
  assert.equal(BACKUP_FILE_EXTENSION, '.json');
  assert.equal(backupFilename({}, now), 'guanxiang-backup-20260815T123456Z.json');
  assert.equal(backupFilename({ encrypted: true }, now), 'guanxiang-encrypted-backup-20260815T123456Z.json');
  assert.doesNotMatch(backupFilename({}, now), /profile|命主|user/i);
});
