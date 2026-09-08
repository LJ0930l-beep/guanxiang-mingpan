import assert from 'node:assert/strict';
import test from 'node:test';

import {
  feedbackLinkSummary,
  listFeedbackLinkOptions,
  resolveFeedbackLinkSelection,
  serializeFeedbackLinkSelection,
} from '../src/domains/archive/feedback-links.ts';

const reading = {
  id: 'feedback-reading',
  profileId: 'profile',
  profileName: '命主',
  module: 'liuyao',
  title: '复盘盘',
  summary: '摘要',
  createdAt: '2026-01-01T00:00:00.000Z',
  engineVersion: 'engine',
  interpretationVersion: 'liuyao-explanation-v2',
  snapshotMeta: { snapshotVersion: 1, generatedAt: '2026-01-01T00:00:00.000Z', engineVersion: 'engine', calculationSettings: { timezone: 'Asia/Shanghai' }, inputSnapshot: { type: 'legacy', timezone: 'Asia/Shanghai', module: 'liuyao', reason: 'fixture' } },
  inputSnapshot: { type: 'legacy', timezone: 'Asia/Shanghai', module: 'liuyao', reason: 'fixture' },
  favorite: false,
  feedback: [],
  payload: {
    module: 'liuyao',
    evidenceGraph: { nodes: [{ id: 'e:question', label: '问题：工作机会' }, { id: 'e:strength', label: '三爻 · 旺' }, { id: 'e:unrelated', label: '不应出现在卡片中的节点' }] },
  },
  explanationSnapshot: { blocks: [
    { id: 'block:question', title: '问题边界', summary: '只固定本次问题', evidenceRefs: ['e:question'], paragraphs: [], counterEvidenceRefs: [], glossaryRefs: [], confidence: 'high', caveats: [], explanationVersion: 'v2', module: 'liuyao', category: 'question' },
    { id: 'block:strength', title: '旺衰与动变', summary: '核对具体爻位', evidenceRefs: ['e:strength'], paragraphs: [], counterEvidenceRefs: [], glossaryRefs: [], confidence: 'medium', caveats: [], explanationVersion: 'v2', module: 'liuyao', category: 'strength' },
  ] },
};

test('反馈关联选项只暴露解读卡自身引用的可读证据', () => {
  const options = listFeedbackLinkOptions(reading);
  assert.deepEqual(options.map((item) => item.title), ['问题边界', '旺衰与动变']);
  assert.deepEqual(options[0].evidence, [{ id: 'e:question', label: '问题：工作机会' }]);
  assert.equal(options[0].evidence.some((item) => item.label.includes('不应')), false);
});

test('编辑、保存和导入导出保留选中的卡片；默认不关联且可显式解除', () => {
  const existing = { id: 'f', status: 'not-yet', observedAt: '2026-02-01', note: '事实', createdAt: '2026-02-01', linkedInterpretationIds: ['block:strength'], linkedEvidenceIds: ['e:strength'] };
  const selection = resolveFeedbackLinkSelection(reading, existing);
  assert.equal(selection.interpretationId, 'block:strength');
  assert.deepEqual(selection.evidenceIds, ['e:strength']);
  assert.deepEqual(serializeFeedbackLinkSelection(selection), { linkedInterpretationIds: ['block:strength'], linkedEvidenceIds: ['e:strength'] });
  assert.deepEqual(serializeFeedbackLinkSelection({ interpretationId: undefined, evidenceIds: [], unresolvedInterpretationIds: [], unresolvedEvidenceIds: [] }), {});
  assert.match(feedbackLinkSummary(reading, existing).join(' '), /旺衰与动变/);
});

test('旧版本无法解析的关联默认只读保留，不会被新卡片凑成无关证据', () => {
  const existing = { id: 'f-old', status: 'not-yet', observedAt: '2026-02-01', note: '事实', createdAt: '2026-02-01', linkedInterpretationIds: ['old:block'], linkedEvidenceIds: ['old:evidence'] };
  const selection = resolveFeedbackLinkSelection(reading, existing);
  assert.deepEqual(selection.unresolvedInterpretationIds, ['old:block']);
  assert.deepEqual(selection.unresolvedEvidenceIds, ['old:evidence']);
  assert.deepEqual(serializeFeedbackLinkSelection(selection), { linkedInterpretationIds: ['old:block'], linkedEvidenceIds: ['old:evidence'] });
});

