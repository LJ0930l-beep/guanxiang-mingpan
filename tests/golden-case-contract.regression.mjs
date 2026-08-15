import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GOLDEN_CASE_REGISTRY,
  validateGoldenCase,
  validateGoldenCaseRegistry,
} from '../src/domains/golden/index.ts';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function independentBaziCase() {
  return clone(GOLDEN_CASE_REGISTRY.find((item) => item.id === 'bazi-calculation-1986-05-29-beijing'));
}

function regressionCase() {
  return clone(GOLDEN_CASE_REGISTRY.find((item) => item.id === 'liuyao-fixed-seed-fixture'));
}

test('P5-A1 合法独立八字条目通过 Golden Case 合同', () => {
  const item = independentBaziCase();
  assert.doesNotThrow(() => validateGoldenCase(item));
  assert.equal(item.validationClass, 'independent-validation');
  assert.equal(item.sourceReferences.length > 0, true);
  assert.equal(item.independentVerification.status, 'verified');
  assert.equal(item.expectedInterpretation.notProfessionalTruth, true);
});

test('P5-A1 四模块现状清单齐全且 ID 全局唯一', () => {
  const modules = new Set(GOLDEN_CASE_REGISTRY.map((item) => item.module));
  const ids = GOLDEN_CASE_REGISTRY.map((item) => item.id);

  assert.deepEqual([...modules].sort(), ['astrology', 'bazi', 'liuyao', 'ziwei']);
  assert.equal(new Set(ids).size, ids.length);
  assert.doesNotThrow(() => validateGoldenCaseRegistry(GOLDEN_CASE_REGISTRY));
});

test('P5-A1 紫微、占星和六爻当前项不会被标为独立验证', () => {
  for (const module of ['ziwei', 'astrology', 'liuyao']) {
    const cases = GOLDEN_CASE_REGISTRY.filter((item) => item.module === module);
    assert.equal(cases.length > 0, true, module);
    assert.equal(cases.some((item) => item.validationClass === 'independent-validation'), false, module);
  }
});

test('P5-A1 独立验证缺 sourceReferences 会被拒绝', () => {
  const item = independentBaziCase();
  item.sourceReferences = [];
  assert.throws(() => validateGoldenCase(item), /requires sourceReferences/);
});

test('P5-A1 regression-only 矛盾声明 independent 会被拒绝', () => {
  const item = regressionCase();
  item.independentVerification = {
    ...item.independentVerification,
    status: 'verified',
    scope: 'technical-cross-check',
  };
  item.verifiedBy = 'unapproved-review';
  item.verifiedAt = '2026-08-15';
  assert.throws(() => validateGoldenCase(item), /regression-only cannot claim independent verification/);
});

test('P5-A1 duplicate id 会被 registry validator 拒绝', () => {
  const first = independentBaziCase();
  const duplicate = clone(first);
  assert.throws(() => validateGoldenCaseRegistry([first, duplicate]), /duplicates/);
});

test('P5-A1 非 JSON 值、非法日期和缺必填字段会被拒绝', () => {
  const nonJson = independentBaziCase();
  nonJson.input.unsupported = () => 'not-json';
  assert.throws(() => validateGoldenCase(nonJson), /not a JSON value/);

  const invalidDate = independentBaziCase();
  invalidDate.verifiedAt = '2026-02-30';
  assert.throws(() => validateGoldenCase(invalidDate), /valid ISO date/);

  const missingField = independentBaziCase();
  delete missingField.expectedEvidence;
  assert.throws(() => validateGoldenCase(missingField), /expectedEvidence is required/);
});

test('P5-A1 registry data 是可序列化的纯 JSON，且统一 npm test 会执行本测试文件', () => {
  const roundTripped = JSON.parse(JSON.stringify(GOLDEN_CASE_REGISTRY));
  assert.deepEqual(roundTripped, GOLDEN_CASE_REGISTRY);
  assert.equal(GOLDEN_CASE_REGISTRY.every((item) => item.contractVersion === 'golden-case.v1'), true);
});
