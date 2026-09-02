import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CHINA_CITY_SOURCE_DECISION_SNAPSHOT,
  CITY_SOURCE_DECISION_CONTRACT_VERSION,
  CITY_SOURCE_DECISION_SOURCES,
  getCitySourceDecisionValidationErrors,
  isCitySourceDecisionSnapshot,
  validateCitySourceDecisionSnapshot,
} from '../src/data/city-source-decision.ts';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('P5-B2 来源矩阵覆盖必查权威/标准/候选/许可来源并保持唯一 sourceId', () => {
  const ids = new Set(CITY_SOURCE_DECISION_SOURCES.map((source) => source.sourceId));
  assert.equal(ids.size, CITY_SOURCE_DECISION_SOURCES.length);
  for (const required of [
    'mca-dmfw-admin-and-history',
    'gbt-2260-admin-code-standard',
    'geonames-cc-by-enrichment',
    'modood-administrative-divisions-of-china',
    'kk418-cn-division',
    'adyliu-china-area',
  ]) assert.ok(ids.has(required), required);
  assert.equal(CITY_SOURCE_DECISION_SOURCES.filter((source) => source.role === 'candidate-import').length, 1);
  assert.equal(CITY_SOURCE_DECISION_SOURCES.filter((source) => source.role === 'licensed-enrichment').length, 2);
});

test('P5-B2 每条来源证据有 URL/version/hash/retrievedAt，legacy HTTP 必须显式标记', () => {
  assert.ok(CITY_SOURCE_DECISION_SOURCES.every((source) => source.evidence.length > 0));
  for (const source of CITY_SOURCE_DECISION_SOURCES) {
    for (const item of source.evidence) {
      assert.match(item.url, /^https?:\/\//);
      assert.ok(item.sourceVersion.length > 0);
      assert.match(item.contentHash, /^sha256:[0-9a-f]{64}$/);
      assert.match(item.retrievedAt, /T/);
      if (item.url.startsWith('http://')) assert.equal(item.transport, 'http-legacy');
      else assert.equal(item.transport, 'https');
    }
  }
  assert.doesNotThrow(() => validateCitySourceDecisionSnapshot(CHINA_CITY_SOURCE_DECISION_SNAPSHOT));
});

test('P5-B2 许可证字段区分数据文件授权、上游权利、商业离线再分发和 ShareAlike', () => {
  const mca = CITY_SOURCE_DECISION_SOURCES.find((source) => source.sourceId === 'mca-dmfw-admin-and-history');
  const geonames = CITY_SOURCE_DECISION_SOURCES.find((source) => source.sourceId === 'geonames-cc-by-enrichment');
  const modood = CITY_SOURCE_DECISION_SOURCES.find((source) => source.sourceId === 'modood-administrative-divisions-of-china');
  const osm = CITY_SOURCE_DECISION_SOURCES.find((source) => source.sourceId === 'openstreetmap-odbl-enrichment');
  assert.equal(mca.license.explicitForDataFiles, false);
  assert.equal(mca.license.commercialOfflineRedistribution, 'not-proven');
  assert.equal(geonames.license.declaredLicense, 'CC BY 4.0');
  assert.equal(geonames.license.explicitForDataFiles, true);
  assert.equal(geonames.license.commercialOfflineRedistribution, 'conditional');
  assert.equal(geonames.license.shareAlikeRisk, 'none');
  assert.equal(modood.license.explicitForDataFiles, false);
  assert.equal(modood.license.upstreamRightsProven, false);
  assert.equal(osm.license.shareAlikeRisk, 'high');
});

test('P5-B2 当前不能以 GitHub MIT/WTFPL/GPL 许可证自动推断上游数据许可', () => {
  for (const id of ['modood-administrative-divisions-of-china', 'kk418-cn-division', 'adyliu-china-area']) {
    const source = CITY_SOURCE_DECISION_SOURCES.find((item) => item.sourceId === id);
    assert.equal(source.license.upstreamRightsProven, false, id);
    assert.equal(source.license.explicitForDataFiles, false, id);
  }
  assert.equal(CITY_SOURCE_DECISION_SOURCES.find((item) => item.sourceId === 'kk418-cn-division').decision, 'UNKNOWN');
  assert.equal(CITY_SOURCE_DECISION_SOURCES.find((item) => item.sourceId === 'modood-administrative-divisions-of-china').decision, 'BLOCKED');
  assert.equal(CITY_SOURCE_DECISION_SOURCES.find((item) => item.sourceId === 'adyliu-china-area').decision, 'BLOCKED');
});

test('P5-B2 矩阵维度完整覆盖 authority/completeness/freshness/codes/coords/aliases/history/license/redistribution/cost', () => {
  const keys = ['authority', 'completeness', 'freshness', 'stableCodes', 'coordinates', 'aliases', 'history', 'licenseClarity', 'redistributionFit', 'operationalCost'];
  for (const source of CITY_SOURCE_DECISION_SOURCES) {
    assert.deepEqual(Object.keys(source.dimensions).sort(), [...keys].sort(), source.sourceId);
    for (const key of keys) {
      assert.ok(['strong', 'partial', 'weak', 'unknown', 'blocked'].includes(source.dimensions[key].status));
      assert.ok(source.dimensions[key].fact.length > 0);
      assert.ok(source.dimensions[key].evidence.length > 0);
    }
  }
});

test('P5-B2 组合方案保持官方人工核验、许可数据包和 app 身份三层边界', () => {
  const plan = CHINA_CITY_SOURCE_DECISION_SNAPSHOT.combinationPlan;
  assert.equal(plan.officialPageManualVerification.sourceId, 'mca-dmfw-admin-and-history');
  assert.match(plan.officialPageManualVerification.forbiddenUse, /不得.*复制/);
  assert.deepEqual(plan.licensedDataBundle.sourceIds, ['geonames-cc-by-enrichment']);
  assert.match(plan.appIdentity.locationId, /稳定 app/);
  assert.match(plan.appIdentity.adminCode, /独立六位/);
  assert.match(plan.appIdentity.historicalChanges, /显式/);
  assert.match(plan.appIdentity.aliasConflicts, /不首条猜测/);
});

test('P5-B2 source-decision 维持 fail-closed，数据库许可传播风险有记录且下一批不导入数据', () => {
  assert.equal(CHINA_CITY_SOURCE_DECISION_SNAPSHOT.contractVersion, CITY_SOURCE_DECISION_CONTRACT_VERSION);
  assert.equal(CHINA_CITY_SOURCE_DECISION_SNAPSHOT.releaseDecision, 'BLOCKED');
  assert.ok(CHINA_CITY_SOURCE_DECISION_SNAPSHOT.blockers.length > 0);
  assert.equal(CHINA_CITY_SOURCE_DECISION_SNAPSHOT.databaseLicensePropagationRisk.overall, 'high');
  assert.ok(CHINA_CITY_SOURCE_DECISION_SNAPSHOT.databaseLicensePropagationRisk.risks.length >= 4);
  assert.equal(CHINA_CITY_SOURCE_DECISION_SNAPSHOT.nextMinimumBatch.allowedWithoutUpstreamPermission, true);
  assert.ok(CHINA_CITY_SOURCE_DECISION_SNAPSHOT.nextMinimumBatch.deliverables.some((item) => /不导入/.test(item)));
  assert.equal(isCitySourceDecisionSnapshot(CHINA_CITY_SOURCE_DECISION_SNAPSHOT), true);
});

test('P5-B2 非法许可证/哈希/决策和重复 sourceId 会被拒绝', () => {
  const invalidLicense = clone(CHINA_CITY_SOURCE_DECISION_SNAPSHOT);
  invalidLicense.sources[0].license.explicitForDataFiles = true;
  invalidLicense.sources[0].decision = 'ALLOW';
  const licenseErrors = getCitySourceDecisionValidationErrors(invalidLicense);
  assert.ok(licenseErrors.some((error) => /upstream rights/.test(error)));

  const invalidHash = clone(CHINA_CITY_SOURCE_DECISION_SNAPSHOT);
  invalidHash.sources[0].evidence[0].contentHash = 'sha256:not-a-hash';
  assert.throws(() => validateCitySourceDecisionSnapshot(invalidHash), /contentHash/);

  const duplicate = clone(CHINA_CITY_SOURCE_DECISION_SNAPSHOT);
  duplicate.sources[1].sourceId = duplicate.sources[0].sourceId;
  assert.throws(() => validateCitySourceDecisionSnapshot(duplicate), /sourceId duplicates/);

  const nonBlockedRelease = clone(CHINA_CITY_SOURCE_DECISION_SNAPSHOT);
  nonBlockedRelease.releaseDecision = 'ALLOW';
  assert.throws(() => validateCitySourceDecisionSnapshot(nonBlockedRelease), /releaseDecision must be BLOCKED/);
});
