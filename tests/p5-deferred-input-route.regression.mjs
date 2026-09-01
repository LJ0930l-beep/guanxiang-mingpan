import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BOUNDARY_INPUT_RESOLUTION_V2_AUDIT_CASE_IDS,
  BOUNDARY_INPUT_RESOLUTION_V3_AUDIT_CASE_IDS,
  BOUNDARY_INPUT_RESOLUTION_V4_AUDIT_CASE_IDS,
  BOUNDARY_INPUT_RESOLUTION_V5_AUDIT_CASE_IDS,
  BOUNDARY_INPUT_RESOLUTION_V6_AUDIT_CASE_IDS,
  P5_A4B_INPUT_RESOLUTION_CASES,
  P5_A4B_INPUT_RESOLUTION_V2_CASES,
  P5_A4B_INPUT_RESOLUTION_V3_CASES,
  P5_A4B_INPUT_RESOLUTION_V4_CASES,
  P5_A4B_INPUT_RESOLUTION_V5_CASES,
  P5_A4B_INPUT_RESOLUTION_V6_CASES,
  P5_A5A_OWNER_DECISION_RESOLUTION_CASES,
  P5_A5A_OWNER_DECISION_RESOLUTION_V2_CASES,
  P5_A5A_OWNER_DECISION_RESOLUTION_V3_CASES,
  P5_BOUNDARY_INPUT_AUDIT_CASES,
  P5_C_DEFERRED_INPUT_ROUTE_CASES,
  P5_C_DEFERRED_INPUT_ROUTE_DISPOSITION,
  P5_C_DEFERRED_INPUT_ROUTE_IMPLEMENTATION_STATUS,
  P5_C_DEFERRED_INPUT_ROUTE_STATUS,
  P5_C_DEFERRED_INPUT_ROUTE_TARGET_BATCH,
  getP5CDeferredInputRouteRegistryValidationErrors,
  getP5CDeferredInputRouteValidationErrors,
  validateP5CDeferredInputRoute,
  validateP5CDeferredInputRouteRegistry,
} from '../src/domains/golden/index.ts';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const route = P5_C_DEFERRED_INPUT_ROUTE_CASES[0];

const clone = (value) => JSON.parse(JSON.stringify(value));

test('cross-a11y-copy-route-deferred：P5-C deferred route 以可执行 testRef 明确路由、未实现和原始 gap', () => {
  const registry = validateP5CDeferredInputRouteRegistry(P5_C_DEFERRED_INPUT_ROUTE_CASES);
  assert.equal(registry.length, 1);
  assert.equal(route.routeId, 'p5-c-deferred-cross-a11y-copy-route');
  assert.equal(route.auditCaseId, 'p5-a4a-cross-a11y-copy-route');
  assert.equal(route.status, P5_C_DEFERRED_INPUT_ROUTE_STATUS);
  assert.equal(route.disposition, P5_C_DEFERRED_INPUT_ROUTE_DISPOSITION);
  assert.equal(route.implementationStatus, P5_C_DEFERRED_INPUT_ROUTE_IMPLEMENTATION_STATUS);
  assert.equal(route.targetBatch, P5_C_DEFERRED_INPUT_ROUTE_TARGET_BATCH);
  assert.match(route.summary, /路由到 P5-C/);
  assert.match(route.summary, /功能尚未实现/);
  assert.ok(route.testRefs.length > 0);

  for (const testRef of route.testRefs) {
    const [relativePath, anchor] = testRef.split('#');
    assert.match(testRef, /^tests\/[^\s#]+(?:#[^\s]+)?$/);
    assert.ok(anchor);
    assert.equal(readFileSync(resolve(projectRoot, relativePath), 'utf8').includes(anchor), true);
  }

  assert.deepEqual(getP5CDeferredInputRouteValidationErrors(route), []);
  assert.deepEqual(JSON.parse(JSON.stringify(registry)), registry);
  const original = P5_BOUNDARY_INPUT_AUDIT_CASES.find((item) => item.id === route.auditCaseId);
  assert.equal(original?.status, 'gap');
  assert.equal(original?.targetBatch, 'P5-C');
});

test('P5-C deferred route validator 拒绝伪装完成、错误目标、模糊语义和空证据', () => {
  const completed = clone(route);
  completed.status = 'resolved';
  assert.throws(() => validateP5CDeferredInputRoute(completed), /status must be deferred/);

  const wrongTarget = clone(route);
  wrongTarget.targetBatch = 'P5-A4b';
  assert.throws(() => validateP5CDeferredInputRoute(wrongTarget), /targetBatch must be P5-C/);

  const missingImplementationCopy = clone(route);
  missingImplementationCopy.summary = '已路由到 P5-C。';
  assert.throws(() => validateP5CDeferredInputRoute(missingImplementationCopy), /not implemented/);

  const emptyEvidence = clone(route);
  emptyEvidence.testRefs = [];
  assert.throws(() => validateP5CDeferredInputRoute(emptyEvidence), /testRefs must contain/);

  const duplicate = [clone(route), clone(route)];
  assert.throws(() => validateP5CDeferredInputRouteRegistry(duplicate), /exactly 1 route|duplicates/);
  assert.notDeepEqual(getP5CDeferredInputRouteValidationErrors(completed), []);
});

test('P5-C route 不改变 A4a immutable 统计，也不进入 A4b/owner cumulative overlay', () => {
  const count = (key, value) => P5_BOUNDARY_INPUT_AUDIT_CASES.filter((item) => item[key] === value).length;
  assert.deepEqual(
    {
      total: P5_BOUNDARY_INPUT_AUDIT_CASES.length,
      covered: count('status', 'covered'),
      gap: count('status', 'gap'),
      decisionRequired: count('status', 'decision-required'),
      notApplicable: count('status', 'not-applicable'),
      routedP5B: count('status', 'routed-p5-b'),
    },
    { total: 41, covered: 18, gap: 15, decisionRequired: 5, notApplicable: 2, routedP5B: 1 },
  );
  assert.deepEqual(
    [
      P5_A4B_INPUT_RESOLUTION_CASES.length,
      P5_A4B_INPUT_RESOLUTION_V2_CASES.length,
      P5_A4B_INPUT_RESOLUTION_V3_CASES.length,
      P5_A4B_INPUT_RESOLUTION_V4_CASES.length,
      P5_A4B_INPUT_RESOLUTION_V5_CASES.length,
      P5_A4B_INPUT_RESOLUTION_V6_CASES.length,
    ],
    [3, 5, 6, 8, 12, 14],
  );
  assert.deepEqual(BOUNDARY_INPUT_RESOLUTION_V2_AUDIT_CASE_IDS, P5_A4B_INPUT_RESOLUTION_V2_CASES.map((item) => item.auditCaseId));
  assert.deepEqual(BOUNDARY_INPUT_RESOLUTION_V3_AUDIT_CASE_IDS, P5_A4B_INPUT_RESOLUTION_V3_CASES.map((item) => item.auditCaseId));
  assert.deepEqual(BOUNDARY_INPUT_RESOLUTION_V4_AUDIT_CASE_IDS, P5_A4B_INPUT_RESOLUTION_V4_CASES.map((item) => item.auditCaseId));
  assert.deepEqual(BOUNDARY_INPUT_RESOLUTION_V5_AUDIT_CASE_IDS, P5_A4B_INPUT_RESOLUTION_V5_CASES.map((item) => item.auditCaseId));
  assert.deepEqual(BOUNDARY_INPUT_RESOLUTION_V6_AUDIT_CASE_IDS, P5_A4B_INPUT_RESOLUTION_V6_CASES.map((item) => item.auditCaseId));
  assert.equal(P5_A4B_INPUT_RESOLUTION_V6_CASES.some((item) => item.auditCaseId === route.auditCaseId), false);
  assert.equal(P5_A5A_OWNER_DECISION_RESOLUTION_V3_CASES.length, 5);
  assert.deepEqual(
    P5_A5A_OWNER_DECISION_RESOLUTION_V3_CASES.slice(0, 4).map(({ contractVersion, ...item }) => item),
    P5_A5A_OWNER_DECISION_RESOLUTION_V2_CASES.map(({ contractVersion, ...item }) => item),
  );
  assert.equal(P5_A5A_OWNER_DECISION_RESOLUTION_CASES.length, 3);
  assert.equal(P5_A5A_OWNER_DECISION_RESOLUTION_V3_CASES.some((item) => item.auditCaseId === route.auditCaseId), false);
  const cityCoverage = P5_BOUNDARY_INPUT_AUDIT_CASES.find((item) => item.id === 'p5-a4a-cross-city-coverage');
  assert.equal(cityCoverage?.status, 'routed-p5-b');
  assert.equal(cityCoverage?.targetBatch, 'P5-B');
});

test('P5-C deferred route registry 的结构错误可被非抛出 validator 完整返回', () => {
  const malformed = clone(route);
  malformed.disposition = 'resolved';
  malformed.implementationStatus = 'implemented';
  malformed.testRefs = ['not-a-test-reference'];
  const errors = getP5CDeferredInputRouteRegistryValidationErrors([malformed]);
  assert.equal(errors.length >= 3, true);
  assert.equal(errors.some((error) => error.includes('disposition')), true);
  assert.equal(errors.some((error) => error.includes('implementationStatus')), true);
  assert.equal(errors.some((error) => error.includes('testRefs')), true);
});
