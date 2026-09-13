import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateAstrologyView } from '../src/services/chart-engine.ts';
import { calculateLiuyaoView } from '../src/services/chart-engine.ts';
import { calculateZiweiView } from '../src/services/chart-engine.ts';
import {
  MUTAGEN_MEANINGS,
  PALACE_THEMES,
  STAR_TRAITS,
  describeMutagenEdge,
  describePalaceContext,
  describePalaceStars,
} from '../src/domains/ziwei/interpretation/knowledge.ts';
import { describeCoreTriad, SIGN_TRAITS } from '../src/domains/astrology/interpretation/knowledge.ts';

const generatedAt = '2026-08-15T00:00:00.000Z';

const FORBIDDEN = /一定|必然|注定|必有|疾病|死亡|投资收益|成功|失败|何时|应期/;

const ziweiFixture = {
  id: 'interpretation-ziwei',
  name: '紫微解读样例',
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

const liuyaoFixture = {
  id: 'interpretation-liuyao',
  name: '六爻解读样例',
  relationship: '本人',
  createdAt: generatedAt,
  updatedAt: generatedAt,
};

test('紫微解读知识表覆盖十二宫、十四主星与四化且不含禁用断言', () => {
  const palaceNames = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];
  const starNames = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
  for (const name of palaceNames) {
    assert.ok(PALACE_THEMES[name], `missing palace theme: ${name}`);
  }
  for (const name of starNames) {
    assert.ok(STAR_TRAITS[name], `missing star trait: ${name}`);
  }
  for (const key of ['禄', '权', '科', '忌']) {
    assert.ok(MUTAGEN_MEANINGS[key], `missing mutagen meaning: ${key}`);
  }
  for (const value of [...Object.values(PALACE_THEMES), ...Object.values(STAR_TRAITS), ...Object.values(MUTAGEN_MEANINGS)]) {
    assert.ok(!FORBIDDEN.test(value), value);
  }
});

test('紫微解释 v3 对本盘生成四化与主星的逐条解读', () => {
  const result = calculateZiweiView(ziweiFixture, undefined, { generatedAt });
  const snapshot = result.explanation;
  assert.ok(snapshot);
  assert.ok(result.normalizedChart.mutagenEdges.length >= 4, 'fixture must carry the four year-mutagens');

  const mutagens = snapshot.blocks.find((block) => block.category === 'mutagens');
  assert.ok(mutagens);
  assert.ok(mutagens.summary.startsWith('本盘四化：'));
  for (const edge of result.normalizedChart.mutagenEdges) {
    const joined = mutagens.paragraphs.join(' ');
    assert.ok(joined.includes(`${edge.starName}化${edge.mutagen}`), `missing reading for ${edge.starName}化${edge.mutagen}`);
    const palace = result.normalizedChart.palaces.find((item) => item.id === edge.palaceRefId);
    assert.ok(palace && joined.includes(palace.name), `mutagen reading must name its palace: ${edge.starName}`);
    const composed = describeMutagenEdge(result.normalizedChart, edge);
    assert.ok(composed.includes(`化${edge.mutagen}`));
    assert.ok(!FORBIDDEN.test(composed), composed);
  }

  const stars = snapshot.blocks.find((block) => block.category === 'star-combinations');
  assert.ok(stars);
  assert.ok(stars.paragraphs.join('').length > 40, 'life-palace star reading must carry trait content');

  const square = snapshot.blocks.find((block) => block.category === 'three-square-four-correctness');
  assert.ok(square);
  assert.match(square.summary, /对宫为/);

  const selected = result.normalizedChart.palaces.find((palace) => palace.id === result.normalizedChart.lifePalaceRefId);
  assert.ok(selected);
  const context = describePalaceContext(result.normalizedChart, selected.id);
  assert.ok(context.length >= 3);
  assert.ok(describePalaceStars(result.normalizedChart, selected.id).includes(selected.stemBranch));
});

test('占星解读包含日/月落座特质且保持边界措辞', () => {
  const traits = Object.values(SIGN_TRAITS);
  assert.equal(traits.length, 12);
  for (const value of traits) assert.ok(!FORBIDDEN.test(value), value);
  const reading = describeCoreTriad('白羊座', '天秤座');
  assert.ok(reading.includes('白羊座'));
  assert.ok(reading.includes(SIGN_TRAITS.白羊座));
  assert.ok(reading.includes(SIGN_TRAITS.天秤座));
  assert.ok(!FORBIDDEN.test(reading));

  const view = calculateAstrologyView(ziweiFixture, { generatedAt });
  const core = view.explanation?.blocks.find((item) => item.category === 'core-triad');
  assert.ok(core);
  assert.ok(core.paragraphs.join('').includes('情绪习惯偏向'));
});

test('六爻解释 v3 用神与世应给出基于事实的结构解读', async () => {
  const options = { generatedAt, seed: 'interpretation-seed-v1', date: generatedAt };
  const result = await calculateLiuyaoView('这次岗位调整对我的影响如何评估', '父母', options);
  const snapshot = result.explanation;
  assert.ok(snapshot);
  const yongshen = snapshot.blocks.find((block) => block.category === 'yongshen');
  assert.ok(yongshen);
  assert.ok(yongshen.paragraphs.some((paragraph) => /用神.*爻/.test(paragraph)), 'yongshen block must read the selected line');
  assert.ok(yongshen.paragraphs.some((paragraph) => paragraph.includes('结构上')));
  const shiYing = snapshot.blocks.find((block) => block.category === 'shi-ying');
  assert.ok(shiYing);
  assert.match(shiYing.summary, /世爻在第/);
  for (const block of snapshot.blocks) {
    assert.ok(!FORBIDDEN.test(block.paragraphs.join(' ')), block.category);
  }
});
