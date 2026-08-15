import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSnapshotViewerModel } from '../src/domains/archive/types.ts';
import { calculateAstrologyView, calculateBaziView, calculateLiuyaoView, calculateZiweiView } from '../src/services/chart-engine.ts';
import { createLocalBackupText, parseLocalBackupText } from '../src/storage/backup.ts';
import { snapshotMetaFromPayload } from '../src/storage/schema.ts';

const generatedAt = '2026-08-15T00:00:00.000Z';
const profile = {
  id: 'p4-h-golden',
  name: 'P4-H 四术样例',
  relationship: '本人',
  birthDate: '2001-09-08',
  birthTime: '20:30',
  birthCity: '广东省深圳市',
  timeKnown: true,
  calendar: 'solar',
  gender: 'male',
  latitude: 22.5431,
  longitude: 114.0579,
  createdAt: generatedAt,
  updatedAt: generatedAt,
};

function readingFor(payload, id) {
  assert.ok(payload.explanation, `${payload.module} explanation`);
  return {
    id,
    profileId: profile.id,
    profileName: profile.name,
    module: payload.module,
    title: `${payload.module} golden`,
    summary: payload.focus[0],
    createdAt: payload.generatedAt,
    engineVersion: payload.engineVersion,
    interpretationVersion: payload.explanation.explanationVersion,
    snapshotMeta: snapshotMetaFromPayload(payload),
    inputSnapshot: payload.inputSnapshot,
    profileSnapshot: profile,
    explanationSnapshot: payload.explanation,
    favorite: false,
    feedback: [],
    payload,
  };
}

test('P4-H 四模块都生成可保存解释快照，并在普通备份中 deepEqual 往返', async () => {
  const bazi = calculateBaziView(profile, undefined, { generatedAt });
  const ziwei = calculateZiweiView(profile, undefined, { generatedAt });
  const astrology = calculateAstrologyView(profile, { generatedAt });
  const liuyao = await calculateLiuyaoView('这个版本的证据链是否清晰？', '官鬼', {
    seed: 'p4-h-golden-seed',
    date: '2026-08-15T12:34:56',
    timezone: 'Asia/Shanghai',
    generatedAt,
  });
  const payloads = [bazi, liuyao, ziwei, astrology];
  for (const payload of payloads) {
    assert.ok(payload.explanation);
    assert.equal(payload.explanation.blocks.length > 0, true);
    const evidenceIds = new Set(payload.evidenceGraph.nodes.map((node) => node.id));
    assert.equal(payload.explanation.blocks.every((block) => block.evidenceRefs.every((ref) => evidenceIds.has(ref))), true);
    const text = payload.explanation.blocks.flatMap((block) => [block.summary, ...block.paragraphs, ...block.caveats]).join(' ');
    assert.equal(text.match(/一定|必然|注定|必有|疾病|死亡|投资收益|应期|何时/) ?? null, null, payload.module);
  }

  const data = JSON.parse(JSON.stringify({
    user: { id: 'p4-h-user', displayName: 'P4-H', provider: 'phone' },
    profiles: [profile],
    selectedProfileId: profile.id,
    readings: payloads.map((payload, index) => readingFor(payload, `p4-h-reading-${index}`)),
  }));
  const parsed = parseLocalBackupText(createLocalBackupText(data, generatedAt));
  assert.deepEqual(parsed.data, data);
  for (const reading of parsed.data.readings) {
    assert.ok(reading.explanationSnapshot);
    assert.equal(buildSnapshotViewerModel(reading).hasExplanationSnapshot, true);
  }
});
