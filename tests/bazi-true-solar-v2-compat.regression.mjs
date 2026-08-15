import assert from 'node:assert/strict';
import test from 'node:test';

import { gcm } from '@noble/ciphers/aes.js';
import { utf8ToBytes } from '@noble/ciphers/utils.js';
import { scryptAsync } from '@noble/hashes/scrypt.js';

import { createBaziHistorySnapshot } from '../src/domains/bazi/interpretation/history.ts';
import { calculateBaziView } from '../src/services/chart-engine.ts';
import { applyImportPlan } from '../src/storage/import-plan.ts';
import {
  ENCRYPTED_BACKUP_ALGORITHM,
  ENCRYPTED_BACKUP_FORMAT,
  ENCRYPTED_BACKUP_KDF,
  ENCRYPTED_BACKUP_VERSION,
  createEncryptedLocalBackupText,
  parseEncryptedLocalBackupText,
} from '../src/storage/encrypted-backup.ts';
import { createLocalBackupText, parseLocalBackupText } from '../src/storage/backup.ts';
import {
  decodeStorageValue,
  migrateReadings,
  snapshotMetaFromPayload,
  STORAGE_SCHEMA_VERSION,
} from '../src/storage/schema.ts';

const generatedAt = '2026-08-15T00:00:00.000Z';

const SCRYPT_OPTIONS = { N: 32_768, r: 8, p: 1, dkLen: 32, asyncTick: 10, maxmem: 128 * 1024 * 1024 };

function bytesToBase64(bytes) {
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

async function encryptLegacySchema2Backup(document, password) {
  const salt = Uint8Array.from({ length: 16 }, (_, index) => index + 1);
  const nonce = Uint8Array.from({ length: 12 }, (_, index) => 32 + index);
  const key = await scryptAsync(password, salt, SCRYPT_OPTIONS);
  const encrypted = gcm(key, nonce, utf8ToBytes('guanxiang-local-backup-encrypted-v1'))
    .encrypt(utf8ToBytes(JSON.stringify(document)));
  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce, 0);
  combined.set(encrypted, nonce.length);
  return JSON.stringify({
    format: ENCRYPTED_BACKUP_FORMAT,
    backupVersion: ENCRYPTED_BACKUP_VERSION,
    algorithm: ENCRYPTED_BACKUP_ALGORITHM,
    kdf: ENCRYPTED_BACKUP_KDF,
    kdfParams: { N: SCRYPT_OPTIONS.N, r: SCRYPT_OPTIONS.r, p: SCRYPT_OPTIONS.p, dkLen: SCRYPT_OPTIONS.dkLen },
    salt: bytesToBase64(salt),
    ciphertext: bytesToBase64(combined),
  });
}

const profile = {
  id: 'p5-a3a-compat',
  name: 'P5-A3a 兼容命主',
  relationship: '本人',
  birthDate: '2024-06-21',
  birthTime: '05:30',
  birthCity: '北京市',
  timeKnown: true,
  calendar: 'solar',
  gender: 'male',
  latitude: 39.9042,
  longitude: 116.4074,
  createdAt: generatedAt,
  updatedAt: generatedAt,
};

function oldV1Reading() {
  const v1Payload = calculateBaziView(profile, undefined, {
    generatedAt,
    bazi: {
      trueSolarTime: true,
      solarTimeModel: 'apparentSolarTime',
      trueSolarTimeVersion: 'true-solar-time-v1-approx',
    },
  });
  const oldSettings = { ...v1Payload.calculationSettings };
  delete oldSettings.trueSolarTimeVersion;
  const oldCorrection = { ...v1Payload.calculationEvidence.trueSolarCorrection };
  delete oldCorrection.algorithmVersion;
  delete oldCorrection.rawCorrectionMinutes;
  delete oldCorrection.appliedCorrectionMinutes;
  delete oldCorrection.roundingRule;
  delete oldCorrection.dataSource;
  delete oldCorrection.dataVersion;
  delete oldCorrection.provenanceStatus;
  const oldPayload = {
    ...v1Payload,
    calculationSettings: oldSettings,
    calculationEvidence: {
      ...v1Payload.calculationEvidence,
      trueSolarCorrection: oldCorrection,
    },
  };
  const deep = createBaziHistorySnapshot(oldPayload);
  assert.ok(deep);
  return {
    id: 'reading-p5-a3a-v1',
    profileId: profile.id,
    profileName: profile.name,
    module: 'bazi',
    title: '旧 v1 真太阳时记录',
    summary: '历史结果不得静默重算',
    createdAt: oldPayload.generatedAt,
    engineVersion: oldPayload.engineVersion,
    interpretationVersion: oldPayload.interpretation.interpretationVersion,
    snapshotMeta: {
      ...snapshotMetaFromPayload(oldPayload),
      calculationSettings: oldSettings,
    },
    inputSnapshot: oldPayload.inputSnapshot,
    profileSnapshot: profile,
    normalizedChartSnapshot: deep.normalizedChart,
    evidenceGraphSnapshot: deep.evidenceGraph,
    interpretationSnapshot: deep.interpretation,
    favorite: true,
    feedback: [{
      id: 'feedback-p5-a3a',
      status: 'confirmed',
      observedAt: '2026-08-16',
      note: '历史事实',
      createdAt: '2026-08-16T00:00:00.000Z',
    }],
    payload: oldPayload,
  };
}

function coreResult(reading) {
  return JSON.parse(JSON.stringify({
    pillars: reading.payload.pillars,
    normalizedChart: reading.payload.normalizedChart,
    evidenceGraph: reading.payload.evidenceGraph,
    interpretation: reading.payload.interpretation,
    explanation: reading.payload.explanation,
    generatedAt: reading.payload.generatedAt,
    engineVersion: reading.payload.engineVersion,
    inputSnapshot: reading.payload.inputSnapshot,
    profileSnapshot: reading.profileSnapshot,
    feedback: reading.feedback,
    favorite: reading.favorite,
  }));
}

test('P5-A3a schema2 到 schema3 只补版本元数据，不重算历史结果', () => {
  const original = oldV1Reading();
  const originalCore = coreResult(original);
  const decoded = decodeStorageValue(
    JSON.stringify({ schemaVersion: 2, value: [original] }),
    [],
    migrateReadings,
  );
  const [migrated] = decoded.value;

  assert.equal(STORAGE_SCHEMA_VERSION, 3);
  assert.equal(decoded.needsRewrite, true);
  assert.equal(decoded.blocked, false);
  assert.deepEqual(coreResult(migrated), originalCore);
  assert.equal(migrated.snapshotMeta.calculationSettings, migrated.payload.calculationSettings);
  assert.equal(migrated.snapshotMeta.calculationSettings.trueSolarTimeVersion, 'true-solar-time-v1-approx');
  assert.equal(migrated.snapshotMeta.calculationSettingsOrigin, 'legacy-true-solar-v1');
  assert.equal(migrated.payload.calculationEvidence.trueSolarCorrection.effectiveTime, original.payload.calculationEvidence.trueSolarCorrection.effectiveTime);
  assert.equal(migrated.payload.calculationEvidence.trueSolarCorrection.correctionMinutes, original.payload.calculationEvidence.trueSolarCorrection.correctionMinutes);
  assert.equal(
    migrated.payload.calculationEvidence.trueSolarCorrection.appliedCorrectionMinutes,
    Math.round(original.payload.calculationEvidence.trueSolarCorrection.correctionMinutes),
  );
  assert.equal(migrated.payload.calculationEvidence.trueSolarCorrection.provenanceStatus, 'legacy');
});

test('P5-A3a 缺少旧真太阳时证据时标记 unknown，不伪装为未应用', () => {
  const original = oldV1Reading();
  const payload = { ...original.payload };
  delete payload.calculationEvidence;
  const legacy = { ...original, payload, snapshotMeta: { ...original.snapshotMeta, calculationSettings: { ...original.snapshotMeta.calculationSettings } } };
  const [migrated] = decodeStorageValue(JSON.stringify({ schemaVersion: 2, value: [legacy] }), [], migrateReadings).value;

  assert.equal(migrated.snapshotMeta.calculationSettings.trueSolarTimeVersion, 'true-solar-time-v1-approx');
  assert.equal(migrated.payload.calculationEvidence.trueSolarCorrection.applied, undefined);
  assert.equal(migrated.payload.calculationEvidence.trueSolarCorrection.provenanceStatus, 'unknown');
  assert.equal(migrated.payload.calculationEvidence.trueSolarCorrection.dataVersion, 'legacy-unknown');
  assert.match(migrated.payload.calculationEvidence.warnings.join(' '), /状态未知/);
});

test('P5-A3a 无可信八字设置时保留 legacy-unknown 标签', () => {
  const original = oldV1Reading();
  const payload = { ...original.payload, calculationSettings: { timezone: 'Asia/Shanghai' } };
  delete payload.calculationEvidence;
  const legacy = {
    ...original,
    payload,
    snapshotMeta: { ...original.snapshotMeta, calculationSettings: { timezone: 'Asia/Shanghai' } },
  };
  const [migrated] = decodeStorageValue(JSON.stringify({ schemaVersion: 2, value: [legacy] }), [], migrateReadings).value;

  assert.equal(migrated.snapshotMeta.calculationSettings.trueSolarTimeVersion, 'legacy-unknown');
  assert.equal(migrated.snapshotMeta.calculationSettingsOrigin, 'legacy-unknown');
  assert.equal(migrated.payload.calculationEvidence.trueSolarCorrection.dataVersion, 'legacy-unknown');
});

test('P5-A3a 仅 snapshotMeta 保存旧八字设置时仍按实际保存来源迁移', () => {
  const original = oldV1Reading();
  const payload = { ...original.payload };
  delete payload.calculationSettings;
  const legacy = { ...original, payload };
  const [migrated] = decodeStorageValue(JSON.stringify({ schemaVersion: 2, value: [legacy] }), [], migrateReadings).value;

  assert.equal(migrated.payload.calculationSettings.trueSolarTimeVersion, 'true-solar-time-v1-approx');
  assert.equal(migrated.snapshotMeta.calculationSettings.trueSolarTimeVersion, 'true-solar-time-v1-approx');
  assert.equal(migrated.snapshotMeta.calculationSettingsOrigin, 'legacy-true-solar-v1');
});

function runBoundary(time, dayBoundary) {
  return calculateBaziView({
    ...profile,
    id: `boundary-${time}-${dayBoundary}`,
    birthDate: '2024-01-15',
    birthTime: time,
    birthCity: '东经121度测试点',
    latitude: 30,
    longitude: 121,
  }, undefined, {
    generatedAt,
    bazi: {
      dayBoundary,
      trueSolarTime: true,
      solarTimeModel: 'localMeanSolarTime',
      trueSolarTimeVersion: 'true-solar-time-v2-noaa',
    },
  });
}

test('P5-A3a v2 舍入穿越时辰、子初和午夜时保持固定 pillar', () => {
  const before = runBoundary('22:55', 'ziEarly');
  const atZiEarly = runBoundary('22:56', 'ziEarly');
  const atMidnight = runBoundary('22:56', 'midnight');
  const nextDay = runBoundary('23:56', 'midnight');

  assert.equal(before.calculationEvidence.effectiveCalculationTime, '2024-01-15T22:59:00');
  assert.equal(before.pillars.find((pillar) => pillar.key === 'hour').branch, '亥');
  assert.equal(atZiEarly.calculationEvidence.effectiveCalculationTime, '2024-01-16T23:00:00');
  assert.equal(atZiEarly.pillars.find((pillar) => pillar.key === 'hour').branch, '子');
  assert.notEqual(atZiEarly.pillars.find((pillar) => pillar.key === 'day').branch, atMidnight.pillars.find((pillar) => pillar.key === 'day').branch);
  assert.equal(atMidnight.calculationEvidence.effectiveCalculationTime, '2024-01-15T23:00:00');
  assert.equal(nextDay.calculationEvidence.trueSolarCorrection.effectiveTime, '2024-01-16T00:00:00');
  assert.equal(nextDay.calculationEvidence.effectiveCalculationTime, '2024-01-16T00:00:00');
});

test('P5-A3a 北京负修正在 09:13/09:14/09:15 穿越实际时柱边界', () => {
  const base = {
    ...profile,
    birthDate: '2024-01-15',
    birthCity: '北京市 116.4074E',
    latitude: 39.9042,
    longitude: 116.4074,
  };
  const options = {
    generatedAt,
    bazi: {
      trueSolarTime: true,
      solarTimeModel: 'localMeanSolarTime',
      trueSolarTimeVersion: 'true-solar-time-v2-noaa',
    },
  };
  const at0913 = calculateBaziView({ ...base, birthTime: '09:13' }, undefined, options);
  const at0914 = calculateBaziView({ ...base, birthTime: '09:14' }, undefined, options);
  const at0915 = calculateBaziView({ ...base, birthTime: '09:15' }, undefined, options);
  const hour = (reading) => reading.pillars.find((pillar) => pillar.key === 'hour');

  assert.equal(at0913.calculationEvidence.trueSolarCorrection.appliedCorrectionMinutes, -14);
  assert.equal(at0913.calculationEvidence.effectiveCalculationTime, '2024-01-15T08:59:00');
  assert.deepEqual({ stem: hour(at0913).stem, branch: hour(at0913).branch }, { stem: '丙', branch: '辰' });
  assert.equal(at0914.calculationEvidence.effectiveCalculationTime, '2024-01-15T09:00:00');
  assert.deepEqual({ stem: hour(at0914).stem, branch: hour(at0914).branch }, { stem: '丁', branch: '巳' });
  assert.equal(at0915.calculationEvidence.effectiveCalculationTime, '2024-01-15T09:01:00');
  assert.deepEqual({ stem: hour(at0915).stem, branch: hour(at0915).branch }, { stem: '丁', branch: '巳' });
});

test('P5-A3a 普通/加密备份以及 merge/replace 导入共享旧记录迁移', async () => {
  const oldReading = oldV1Reading();
  const oldData = {
    user: { id: 'p5-a3a-user', displayName: 'P5-A3a', provider: 'phone' },
    profiles: [profile],
    selectedProfileId: profile.id,
    readings: [oldReading],
  };
  const oldDocument = JSON.parse(createLocalBackupText(oldData, generatedAt));
  oldDocument.storageSchemaVersion = 2;
  const parsedOld = parseLocalBackupText(JSON.stringify(oldDocument));
  const migratedReading = parsedOld.data.readings[0];
  assert.equal(parsedOld.storageSchemaVersion, STORAGE_SCHEMA_VERSION);
  assert.equal(migratedReading.snapshotMeta.calculationSettings.trueSolarTimeVersion, 'true-solar-time-v1-approx');
  assert.deepEqual(coreResult(migratedReading), coreResult(oldReading));

  const malformedCurrent = parseLocalBackupText(createLocalBackupText(oldData, generatedAt));
  assert.equal(malformedCurrent.data.readings[0].snapshotMeta.calculationSettings.trueSolarTimeVersion, 'true-solar-time-v1-approx');
  assert.deepEqual(coreResult(malformedCurrent.data.readings[0]), coreResult(oldReading));

  const otherProfile = { ...profile, id: 'p5-a3a-other', name: '另一个命主' };
  const current = { user: null, profiles: [otherProfile], selectedProfileId: otherProfile.id, readings: [] };
  const merged = applyImportPlan(current, parsedOld.data, 'merge');
  assert.ok(merged.profiles.some((item) => item.id === profile.id));
  assert.deepEqual(coreResult(merged.readings[0]), coreResult(oldReading));
  const replaced = applyImportPlan(current, parsedOld.data, 'replace');
  assert.deepEqual(replaced.readings[0], migratedReading);

  const roundTrip = parseLocalBackupText(createLocalBackupText(parsedOld.data, generatedAt));
  assert.deepEqual(roundTrip.data, parsedOld.data);
  const encrypted = await createEncryptedLocalBackupText(parsedOld.data, 'P5-A3a password', generatedAt);
  const decrypted = await parseEncryptedLocalBackupText(encrypted, 'P5-A3a password');
  assert.deepEqual(decrypted.data, parsedOld.data);

  const oldEncrypted = await encryptLegacySchema2Backup(oldDocument, 'P5-A3a password');
  const decryptedOld = await parseEncryptedLocalBackupText(oldEncrypted, 'P5-A3a password');
  assert.equal(decryptedOld.storageSchemaVersion, STORAGE_SCHEMA_VERSION);
  assert.equal(decryptedOld.data.readings[0].snapshotMeta.calculationSettings.trueSolarTimeVersion, 'true-solar-time-v1-approx');
  assert.deepEqual(coreResult(decryptedOld.data.readings[0]), coreResult(oldReading));
});
