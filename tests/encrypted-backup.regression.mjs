import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EncryptedBackupFormatError,
  createEncryptedLocalBackupText,
  parseEncryptedLocalBackupText,
} from '../src/storage/encrypted-backup.ts';

const data = {
  user: { id: 'phone_13800000000', displayName: '138****0000', provider: 'phone' },
  profiles: [{
    id: 'profile-1',
    name: '测试命主',
    relationship: '本人',
    birthDate: '1995-05-20',
    birthTime: '08:30',
    birthCity: '北京',
    timeKnown: true,
    calendar: 'solar',
    gender: 'female',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }],
  selectedProfileId: 'profile-1',
  readings: [],
};

test('加密备份使用随机盐和 nonce，能无损恢复且不暴露明文', async () => {
  const raw = await createEncryptedLocalBackupText(data, '观象安全密码2026', '2026-01-03T00:00:00.000Z');
  assert.match(raw, /guanxiang-local-backup-encrypted/);
  assert.match(raw, /AES-256-GCM/);
  assert.match(raw, /scrypt/);
  assert.equal(raw.includes('测试命主'), false);

  const parsed = await parseEncryptedLocalBackupText(raw, '观象安全密码2026');
  assert.deepEqual(parsed.data, data);
  assert.equal(parsed.exportedAt, '2026-01-03T00:00:00.000Z');
});

test('加密备份拒绝短密码、错误密码和篡改内容', async () => {
  await assert.rejects(() => createEncryptedLocalBackupText(data, 'short'), EncryptedBackupFormatError);
  const raw = await createEncryptedLocalBackupText(data, '观象安全密码2026');
  await assert.rejects(() => parseEncryptedLocalBackupText(raw, '另一个不同安全密码'), /密码错误或加密备份已损坏/);

  const parsed = JSON.parse(raw);
  const last = parsed.ciphertext.length - 5;
  parsed.ciphertext = `${parsed.ciphertext.slice(0, last)}${parsed.ciphertext[last] === 'A' ? 'B' : 'A'}${parsed.ciphertext.slice(last + 1)}`;
  await assert.rejects(() => parseEncryptedLocalBackupText(JSON.stringify(parsed), '观象安全密码2026'), /密码错误或加密备份已损坏/);
});
