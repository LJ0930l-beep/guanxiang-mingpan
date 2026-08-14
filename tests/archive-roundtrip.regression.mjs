import assert from 'node:assert/strict';
import test from 'node:test';

import { createBaziHistorySnapshot } from '../src/domains/bazi/interpretation/history.ts';
import { calculateBaziView } from '../src/services/chart-engine.ts';
import { createEncryptedLocalBackupText, parseEncryptedLocalBackupText } from '../src/storage/encrypted-backup.ts';
import { createLocalBackupText, parseLocalBackupText } from '../src/storage/backup.ts';
import { snapshotMetaFromPayload } from '../src/storage/schema.ts';

const profile = {
  id: 'profile-roundtrip',
  name: 'Round-trip 命主',
  relationship: '本人',
  birthDate: '1988-09-17',
  birthTime: '06:20',
  birthCity: '北京',
  timeKnown: true,
  calendar: 'solar',
  gender: 'female',
  createdAt: '2026-08-15T00:00:00.000Z',
  updatedAt: '2026-08-15T00:00:00.000Z',
};

function buildData() {
  const payload = calculateBaziView(profile, undefined, { generatedAt: '2026-08-15T01:02:03.000Z' });
  const deep = createBaziHistorySnapshot(payload);
  assert.ok(deep);
  const data = {
    user: { id: 'phone_roundtrip', displayName: 'Round-trip', provider: 'phone' },
    profiles: [profile],
    selectedProfileId: profile.id,
    readings: [{
      id: 'reading-roundtrip',
      profileId: profile.id,
      profileName: profile.name,
      module: 'bazi',
      title: '深度快照往返',
      summary: 'Evidence / Interpretation 必须完整保留',
      createdAt: payload.generatedAt,
      engineVersion: payload.engineVersion,
      interpretationVersion: payload.interpretation.interpretationVersion,
      snapshotMeta: snapshotMetaFromPayload(payload),
      inputSnapshot: payload.inputSnapshot,
      profileSnapshot: profile,
      normalizedChartSnapshot: deep.normalizedChart,
      evidenceGraphSnapshot: deep.evidenceGraph,
      interpretationSnapshot: deep.interpretation,
      favorite: true,
      feedback: [{
        id: 'feedback-roundtrip',
        status: 'partial',
        observedAt: '2026-08-15',
        note: '现实事实',
        createdAt: '2026-08-15T02:00:00.000Z',
        updatedAt: '2026-08-15T02:30:00.000Z',
        linkedInterpretationIds: ['interpretation:strength'],
        linkedEvidenceIds: ['evidence:month-command'],
      }],
      payload,
    }],
  };
  return JSON.parse(JSON.stringify(data));
}

test('P3-D 普通 JSON 备份往返保持 Phase2 深度快照与反馈 deepEqual', () => {
  const data = buildData();
  const raw = createLocalBackupText(data, '2026-08-15T03:00:00.000Z');
  const parsed = parseLocalBackupText(raw);
  assert.deepEqual(parsed.data, data);
  assert.deepEqual(parsed.data.readings[0].normalizedChartSnapshot, data.readings[0].normalizedChartSnapshot);
  assert.deepEqual(parsed.data.readings[0].evidenceGraphSnapshot, data.readings[0].evidenceGraphSnapshot);
  assert.deepEqual(parsed.data.readings[0].interpretationSnapshot, data.readings[0].interpretationSnapshot);
});

test('P3-D 加密备份先解密再复用同一 decoded 校验层，并保持 deepEqual', async () => {
  const data = buildData();
  const raw = await createEncryptedLocalBackupText(data, '观象 round-trip 密码 2026', '2026-08-15T03:00:00.000Z');
  const parsed = await parseEncryptedLocalBackupText(raw, '观象 round-trip 密码 2026');
  assert.deepEqual(parsed.data, data);
  assert.deepEqual(parsed.data.readings[0].evidenceGraphSnapshot, data.readings[0].evidenceGraphSnapshot);
  assert.deepEqual(parsed.data.readings[0].interpretationSnapshot, data.readings[0].interpretationSnapshot);
});
