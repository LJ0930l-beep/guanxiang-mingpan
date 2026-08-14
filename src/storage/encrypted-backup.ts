import { gcm } from '@noble/ciphers/aes.js';
import { bytesToUtf8, utf8ToBytes } from '@noble/ciphers/utils.js';
import { scryptAsync } from '@noble/hashes/scrypt.js';

import { createLocalBackupText, parseLocalBackupText } from '@/storage/backup';
import type { LocalBackupData, LocalBackupDocument } from '@/storage/backup';

export const ENCRYPTED_BACKUP_FORMAT = 'guanxiang-local-backup-encrypted' as const;
export const ENCRYPTED_BACKUP_VERSION = 1 as const;
export const ENCRYPTED_BACKUP_ALGORITHM = 'AES-256-GCM' as const;
export const ENCRYPTED_BACKUP_KDF = 'scrypt' as const;

const SALT_BYTES = 16;
const NONCE_BYTES = 12;
const KEY_BYTES = 32;
const AUTH_TAG_BYTES = 16;
const MAX_ENCRYPTED_BACKUP_LENGTH = 15_000_000;
const AAD = utf8ToBytes('guanxiang-local-backup-encrypted-v1');
const SCRYPT_OPTIONS = {
  N: 32_768,
  r: 8,
  p: 1,
  dkLen: KEY_BYTES,
  asyncTick: 10,
  maxmem: 128 * 1024 * 1024,
} as const;

export interface EncryptedBackupDocument {
  format: typeof ENCRYPTED_BACKUP_FORMAT;
  backupVersion: typeof ENCRYPTED_BACKUP_VERSION;
  algorithm: typeof ENCRYPTED_BACKUP_ALGORITHM;
  kdf: typeof ENCRYPTED_BACKUP_KDF;
  kdfParams: {
    N: typeof SCRYPT_OPTIONS.N;
    r: typeof SCRYPT_OPTIONS.r;
    p: typeof SCRYPT_OPTIONS.p;
    dkLen: typeof SCRYPT_OPTIONS.dkLen;
  };
  salt: string;
  ciphertext: string;
}

export class EncryptedBackupFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EncryptedBackupFormatError';
  }
}

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requirePassword(password: string) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new EncryptedBackupFormatError('备份密码至少需要 8 个字符。');
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    output += alphabet[first >> 2];
    output += alphabet[((first & 0x03) << 4) | ((second ?? 0) >> 4)];
    output += second === undefined ? '=' : alphabet[((second & 0x0f) << 2) | ((third ?? 0) >> 6)];
    output += third === undefined ? '=' : alphabet[third & 0x3f];
  }
  return output;
}

function base64Value(char: string): number {
  const value = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.indexOf(char);
  if (value < 0) throw new EncryptedBackupFormatError('加密备份包含无效的 Base64 数据。');
  return value;
}

function base64ToBytes(value: unknown, label: string): Uint8Array {
  if (typeof value !== 'string' || value.length === 0 || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new EncryptedBackupFormatError(`加密备份中的${label}无效。`);
  }
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  const output = new Uint8Array((value.length / 4) * 3 - padding);
  let outputIndex = 0;
  for (let index = 0; index < value.length; index += 4) {
    const first = base64Value(value[index]);
    const second = base64Value(value[index + 1]);
    const third = value[index + 2] === '=' ? 0 : base64Value(value[index + 2]);
    const fourth = value[index + 3] === '=' ? 0 : base64Value(value[index + 3]);
    const combined = (first << 18) | (second << 12) | (third << 6) | fourth;
    if (outputIndex < output.length) output[outputIndex++] = (combined >> 16) & 0xff;
    if (outputIndex < output.length) output[outputIndex++] = (combined >> 8) & 0xff;
    if (outputIndex < output.length) output[outputIndex++] = combined & 0xff;
  }
  return output;
}

async function secureRandomBytes(length: number): Promise<Uint8Array> {
  const cryptoLike = (globalThis as { crypto?: { getRandomValues?: (array: Uint8Array) => Uint8Array } }).crypto;
  if (typeof cryptoLike?.getRandomValues === 'function') return cryptoLike.getRandomValues(new Uint8Array(length));

  try {
    const expoCrypto = await import('expo-crypto');
    return expoCrypto.getRandomBytes(length);
  } catch {
    throw new EncryptedBackupFormatError('当前设备不支持安全随机数，暂时无法创建加密备份。');
  }
}

async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  return scryptAsync(password, salt, SCRYPT_OPTIONS);
}

function validateEncryptedDocument(value: unknown): EncryptedBackupDocument {
  if (!isRecord(value)
    || value.format !== ENCRYPTED_BACKUP_FORMAT
    || value.backupVersion !== ENCRYPTED_BACKUP_VERSION
    || value.algorithm !== ENCRYPTED_BACKUP_ALGORITHM
    || value.kdf !== ENCRYPTED_BACKUP_KDF
    || !isRecord(value.kdfParams)
    || value.kdfParams.N !== SCRYPT_OPTIONS.N
    || value.kdfParams.r !== SCRYPT_OPTIONS.r
    || value.kdfParams.p !== SCRYPT_OPTIONS.p
    || value.kdfParams.dkLen !== SCRYPT_OPTIONS.dkLen
    || typeof value.salt !== 'string'
    || typeof value.ciphertext !== 'string') {
    throw new EncryptedBackupFormatError('加密备份版本或算法不兼容。');
  }

  const salt = base64ToBytes(value.salt, '盐值');
  const ciphertext = base64ToBytes(value.ciphertext, '密文');
  if (salt.length !== SALT_BYTES || ciphertext.length < AUTH_TAG_BYTES) {
    throw new EncryptedBackupFormatError('加密备份内容不完整。');
  }
  return {
    format: ENCRYPTED_BACKUP_FORMAT,
    backupVersion: ENCRYPTED_BACKUP_VERSION,
    algorithm: ENCRYPTED_BACKUP_ALGORITHM,
    kdf: ENCRYPTED_BACKUP_KDF,
    kdfParams: {
      N: SCRYPT_OPTIONS.N,
      r: SCRYPT_OPTIONS.r,
      p: SCRYPT_OPTIONS.p,
      dkLen: SCRYPT_OPTIONS.dkLen,
    },
    salt: value.salt,
    ciphertext: value.ciphertext,
  };
}

export async function createEncryptedLocalBackupText(data: LocalBackupData, password: string, exportedAt?: string): Promise<string> {
  requirePassword(password);
  const salt = await secureRandomBytes(SALT_BYTES);
  const nonce = await secureRandomBytes(NONCE_BYTES);
  const key = await deriveKey(password, salt);
  const plaintext = utf8ToBytes(createLocalBackupText(data, exportedAt));
  const encrypted = gcm(key, nonce, AAD).encrypt(plaintext);
  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce, 0);
  combined.set(encrypted, nonce.length);
  const document: EncryptedBackupDocument = {
    format: ENCRYPTED_BACKUP_FORMAT,
    backupVersion: ENCRYPTED_BACKUP_VERSION,
    algorithm: ENCRYPTED_BACKUP_ALGORITHM,
    kdf: ENCRYPTED_BACKUP_KDF,
    kdfParams: {
      N: SCRYPT_OPTIONS.N,
      r: SCRYPT_OPTIONS.r,
      p: SCRYPT_OPTIONS.p,
      dkLen: SCRYPT_OPTIONS.dkLen,
    },
    salt: bytesToBase64(salt),
    ciphertext: bytesToBase64(combined),
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}

export async function parseEncryptedLocalBackupText(raw: string, password: string): Promise<LocalBackupDocument> {
  requirePassword(password);
  if (raw.length > MAX_ENCRYPTED_BACKUP_LENGTH) throw new EncryptedBackupFormatError('加密备份文件过大，已拒绝导入。');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new EncryptedBackupFormatError('加密备份不是有效的 JSON。');
  }
  const document = validateEncryptedDocument(parsed);
  const salt = base64ToBytes(document.salt, '盐值');
  const combined = base64ToBytes(document.ciphertext, '密文');
  const nonce = combined.slice(0, NONCE_BYTES);
  const ciphertext = combined.slice(NONCE_BYTES);
  if (nonce.length !== NONCE_BYTES || ciphertext.length < AUTH_TAG_BYTES) {
    throw new EncryptedBackupFormatError('加密备份缺少有效的随机数或认证标签。');
  }

  try {
    const key = await deriveKey(password, salt);
    const plaintext = gcm(key, nonce, AAD).decrypt(ciphertext);
    return parseLocalBackupText(bytesToUtf8(plaintext));
  } catch (error) {
    if (error instanceof EncryptedBackupFormatError) throw error;
    throw new EncryptedBackupFormatError('密码错误或加密备份已损坏，无法恢复。');
  }
}
