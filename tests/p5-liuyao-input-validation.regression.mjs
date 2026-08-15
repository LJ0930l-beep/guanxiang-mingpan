import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION,
  BOUNDARY_INPUT_RESOLUTION_V2_CONTRACT_VERSION,
  P5_A4B_INPUT_RESOLUTION_CASES,
  P5_A4B_INPUT_RESOLUTION_V2_CASES,
  P5_BOUNDARY_INPUT_AUDIT_CASES,
  getBoundaryInputResolutionV2ValidationErrors,
  getBoundaryInputResolutionVersionedRegistryValidationErrors,
  validateBoundaryInputResolutionRegistry,
  validateBoundaryInputResolutionV2,
  validateBoundaryInputResolutionV2Registry,
  validateBoundaryInputResolutionVersionedRegistry,
} from '../src/domains/golden/index.ts';
import {
  calculateLiuyaoView,
  getChartInputErrorContract,
  isChartInputError,
  normalizeLiuyaoDate,
  normalizeLiuyaoSeed,
} from '../src/services/chart-engine.ts';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const generatedAt = '2026-08-15T00:00:00.000Z';
const fixedDate = '2026-01-01T12:34:56.789Z';
const fixedQuestion = '六爻输入合同是否能稳定复现？';
const fixedTarget = '官鬼';

const clone = (value) => JSON.parse(JSON.stringify(value));

function expectLiuyaoInputError(run, field, code) {
  let caught;
  try {
    run();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught, 'expected a ChartInputError');
  assert.equal(isChartInputError(caught), true);
  assert.equal(caught.code, code);
  assert.equal(caught.field, field);
  const contract = getChartInputErrorContract(caught);
  assert.deepEqual(contract, {
    name: 'ChartInputError',
    category: 'input-validation',
    code,
    field,
    message: code === 'INVALID_LIUYAO_DATE'
      ? '六爻日期无效，请使用有效的本地时间或带时区 ISO 时间。'
      : '六爻 seed 无效，请提供 1 至 256 个字符的非空字符串。',
  });
  return caught;
}

async function expectAsyncLiuyaoInputError(run, field, code) {
  let caught;
  try {
    await run();
  } catch (error) {
    caught = error;
  }
  return expectLiuyaoInputError(() => {
    if (!caught) throw new Error('expected a ChartInputError');
    throw caught;
  }, field, code);
}

test('P5-A4b2 v1 overlay 保持三项，v2 追加六爻 date/seed 两项且均指向原始 gap', () => {
  const v1 = validateBoundaryInputResolutionRegistry(P5_A4B_INPUT_RESOLUTION_CASES);
  const v2 = validateBoundaryInputResolutionV2Registry(P5_A4B_INPUT_RESOLUTION_V2_CASES);
  assert.equal(v1.length, 3);
  assert.equal(v2.length, 5);
  assert.deepEqual(JSON.parse(JSON.stringify(v1)), v1);
  assert.deepEqual(JSON.parse(JSON.stringify(v2)), v2);
  assert.deepEqual(
    v1.map((item) => item.auditCaseId),
    [
      'p5-a4a-ziwei-invalid-gregorian-date',
      'p5-a4a-astrology-invalid-gregorian-date',
      'p5-a4a-astrology-invalid-coordinate',
    ],
  );
  assert.deepEqual(
    v2.map((item) => item.auditCaseId),
    [
      'p5-a4a-ziwei-invalid-gregorian-date',
      'p5-a4a-astrology-invalid-gregorian-date',
      'p5-a4a-astrology-invalid-coordinate',
      'p5-a4a-liuyao-invalid-date',
      'p5-a4a-liuyao-invalid-seed',
    ],
  );
  assert.equal(v1.every((item) => item.contractVersion === BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION), true);
  assert.equal(v2.every((item) => item.contractVersion === BOUNDARY_INPUT_RESOLUTION_V2_CONTRACT_VERSION), true);
  for (const resolution of v2) {
    const original = P5_BOUNDARY_INPUT_AUDIT_CASES.find((item) => item.id === resolution.auditCaseId);
    assert.equal(original?.status, 'gap');
    assert.equal(original?.targetBatch, 'P5-A4b');
    assert.equal(resolution.targetBatch, 'P5-A4b');
    assert.equal(resolution.testRefs.every((ref) => ref.startsWith('tests/')), true);
    assert.equal(JSON.stringify(resolution).includes('commit'), false);
  }
  assert.deepEqual(
    v2.slice(0, 3).map(({ contractVersion, ...item }) => item),
    v1.map(({ contractVersion, ...item }) => item),
  );
  assert.deepEqual(getBoundaryInputResolutionVersionedRegistryValidationErrors(v1), []);
  assert.deepEqual(getBoundaryInputResolutionVersionedRegistryValidationErrors(v2), []);
  assert.deepEqual(validateBoundaryInputResolutionVersionedRegistry(v1), v1);
  assert.deepEqual(validateBoundaryInputResolutionVersionedRegistry(v2), v2);
});

test('P5-A4b2 v2 overlay validator 拒绝版本混用、重复 ID、错误引用和非 JSON 值', () => {
  const duplicateResolutionId = clone(P5_A4B_INPUT_RESOLUTION_V2_CASES);
  duplicateResolutionId[1].resolutionId = duplicateResolutionId[0].resolutionId;
  assert.throws(() => validateBoundaryInputResolutionV2Registry(duplicateResolutionId), /resolutionId duplicates/);

  const duplicateAuditCaseId = clone(P5_A4B_INPUT_RESOLUTION_V2_CASES);
  duplicateAuditCaseId[4].auditCaseId = duplicateAuditCaseId[0].auditCaseId;
  assert.throws(() => validateBoundaryInputResolutionV2Registry(duplicateAuditCaseId), /auditCaseId duplicates|resolution registry is missing/);

  const wrongVersion = clone(P5_A4B_INPUT_RESOLUTION_V2_CASES);
  wrongVersion[0].contractVersion = BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION;
  assert.throws(() => validateBoundaryInputResolutionV2(wrongVersion[0]), /contractVersion must be p5-a4b-input-resolution.v2/);

  const wrongAudit = clone(P5_A4B_INPUT_RESOLUTION_V2_CASES);
  wrongAudit[0].auditCaseId = 'p5-a4a-bazi-solar-date-validity';
  assert.throws(() => validateBoundaryInputResolutionV2(wrongAudit[0]), /auditCaseId is not supported/);

  const nonJsonDate = clone(P5_A4B_INPUT_RESOLUTION_V2_CASES);
  nonJsonDate[0].notes = new Date('2026-08-15T00:00:00.000Z');
  assert.throws(() => validateBoundaryInputResolutionV2Registry(nonJsonDate), /must be a plain JSON object/);

  const nonJsonFunction = clone(P5_A4B_INPUT_RESOLUTION_V2_CASES);
  nonJsonFunction[0].notes = () => 'not JSON';
  assert.throws(() => validateBoundaryInputResolutionV2Registry(nonJsonFunction), /not a JSON value/);

  const cyclic = clone(P5_A4B_INPUT_RESOLUTION_V2_CASES);
  cyclic[0].notes = cyclic;
  assert.throws(() => validateBoundaryInputResolutionV2Registry(cyclic), /cyclic reference/);

  assert.throws(() => validateBoundaryInputResolutionRegistry(P5_A4B_INPUT_RESOLUTION_V2_CASES), /contractVersion must be p5-a4b-input-resolution.v1/);
  assert.deepEqual(getBoundaryInputResolutionV2ValidationErrors(P5_A4B_INPUT_RESOLUTION_V2_CASES[0]), []);
});

test('P5-A4b2 normalizeLiuyaoDate 接受本地/秒/毫秒与 Z、+08:00、+0800，并固定丢弃毫秒', () => {
  assert.equal(normalizeLiuyaoDate('2026-01-01T12:34'), '2026-01-01T12:34:00');
  assert.equal(normalizeLiuyaoDate('2026-01-01 12:34:56'), '2026-01-01T12:34:56');
  assert.equal(normalizeLiuyaoDate('2026-01-01T12:34:56.789'), '2026-01-01T12:34:56');
  assert.equal(normalizeLiuyaoDate('2026-01-01T12:34:56.789Z'), '2026-01-01T20:34:56');
  assert.equal(normalizeLiuyaoDate('2026-01-01T12:34:56.789+08:00'), '2026-01-01T12:34:56');
  assert.equal(normalizeLiuyaoDate('2026-01-01T12:34:56.789+0800'), '2026-01-01T12:34:56');
  assert.equal(normalizeLiuyaoDate('2026-01-01T12:34:56.789+02:00'), '2026-01-01T18:34:56');
});

test('P5-A4b2 normalizeLiuyaoDate 在 Date 转换前拒绝全部非法 civil/offset 矩阵', () => {
  const invalid = [
    undefined,
    null,
    123,
    {},
    '',
    '2026-01-01',
    '2026-01-01T12',
    '2026-1-01T12:00',
    '2026-01-01T12:00:00.1234',
    '2026-01-01T24:00',
    '2026-01-01T12:60',
    '2026-01-01T12:00:60',
    '2026-02-30T12:00',
    '2023-02-29T12:00',
    '2026-04-31T12:00',
    '2026-01-01T12:00+8:00',
    '2026-01-01T12:00+24:00',
    '2026-01-01T12:00+2360',
    '2026-01-01T12:00+080',
    '2026-01-01T12:00Zjunk',
    '2026-02-30T12:00+08:00',
    '2023-02-29T12:00+0800',
  ];
  for (const value of invalid) expectLiuyaoInputError(() => normalizeLiuyaoDate(value), 'date', 'INVALID_LIUYAO_DATE');
});

test('P5-A4b2 normalizeLiuyaoSeed 只 trim 判空、按原始 Unicode 长度校验并保留原字符串', () => {
  const unicodeSeed = '  六爻✨ seed  ';
  assert.equal(normalizeLiuyaoSeed(unicodeSeed), unicodeSeed);
  assert.equal(normalizeLiuyaoSeed('界'.repeat(256)), '界'.repeat(256));
  expectLiuyaoInputError(() => normalizeLiuyaoSeed('界'.repeat(257)), 'seed', 'INVALID_LIUYAO_SEED');
  expectLiuyaoInputError(() => normalizeLiuyaoSeed(`${' '.repeat(256)}x`), 'seed', 'INVALID_LIUYAO_SEED');
});

test('P5-A4b2 calculateLiuyaoView 拒绝空白/超长/非字符串 seed，合法 Unicode seed 原样进入 payload 与 inputSnapshot', async () => {
  const legal = await calculateLiuyaoView(fixedQuestion, fixedTarget, {
    generatedAt,
    seed: '  六爻✨ seed  ',
    date: fixedDate,
    timezone: 'Asia/Shanghai',
  });
  assert.equal(legal.seed, '  六爻✨ seed  ');
  assert.equal(legal.inputSnapshot.seed, '  六爻✨ seed  ');
  assert.equal(legal.seedScope, 'guanxiang-local-v1');
  assert.equal(legal.inputSnapshot.seedScope, 'guanxiang-local-v1');

  for (const seed of ['', '   ', '\t\n', '界'.repeat(257), null, 123, {}]) {
    await expectAsyncLiuyaoInputError(
      () => calculateLiuyaoView(fixedQuestion, fixedTarget, { generatedAt, seed, date: fixedDate }),
      'seed',
      'INVALID_LIUYAO_SEED',
    );
  }
});

test('P5-A4b2 相同 seed/date 生成结果 deepEqual，自动 seed 也经过合法性校验', async () => {
  const options = {
    generatedAt,
    seed: 'p5-a4b2-repeat-seed',
    date: '2026-01-01T12:34:56.789+0800',
    timezone: 'Asia/Shanghai',
  };
  const first = await calculateLiuyaoView(fixedQuestion, fixedTarget, options);
  const second = await calculateLiuyaoView(fixedQuestion, fixedTarget, options);
  assert.deepEqual(second, first);

  const auto = await calculateLiuyaoView(fixedQuestion, fixedTarget, { generatedAt, date: fixedDate });
  assert.equal(typeof auto.seed, 'string');
  assert.equal(auto.seed.trim().length > 0, true);
  assert.equal(Array.from(auto.seed).length <= 256, true);
  assert.equal(auto.inputSnapshot.seed, auto.seed);
});

function runHostTimezone(hostTimezone, mode) {
  const source = `
    import { calculateLiuyaoView, getChartInputErrorContract } from './src/services/chart-engine.ts';
    const main = async () => {
      const options = ${JSON.stringify({ generatedAt, seed: '  六爻✨ host seed  ', date: fixedDate, timezone: 'Asia/Shanghai' })};
      try {
        if (${JSON.stringify(mode)} === 'invalid-date') options.date = '2026-02-30T12:00:00+08:00';
        if (${JSON.stringify(mode)} === 'invalid-seed') options.seed = '   ';
        const result = await calculateLiuyaoView(${JSON.stringify(fixedQuestion)}, ${JSON.stringify(fixedTarget)}, options);
        process.stdout.write(JSON.stringify({ ok: true, result }));
      } catch (error) {
        process.stdout.write(JSON.stringify({ ok: false, error: getChartInputErrorContract(error) }));
      }
    };
    main();
  `;
  return JSON.parse(execFileSync(
    process.execPath,
    ['--experimental-strip-types', '--experimental-loader', './scripts/ts-path-loader.mjs', '-e', source],
    {
      cwd: projectRoot,
      env: { ...process.env, TZ: hostTimezone },
      encoding: 'utf8',
    },
  ));
}

test('P5-A4b2 六爻合法结果与 date/seed 错误在 UTC/Asia/Shanghai 宿主 TZ 完全一致', () => {
  for (const mode of ['valid', 'invalid-date', 'invalid-seed']) {
    assert.deepEqual(runHostTimezone('UTC', mode), runHostTimezone('Asia/Shanghai', mode));
  }
});
