import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CHINA_CITY_DATASET_AUDIT_REGISTRY,
  CHINA_CITY_DATASET_AUDIT_SNAPSHOT,
  CITY_DATASET_AUDIT_CONTRACT_VERSION,
  getCityDatasetAuditValidationErrors,
  validateCityDatasetAuditSnapshot,
  validateCityDatasetReleaseEligibility,
} from '../src/data/city-dataset-contract.ts';
import {
  CHINA_CITY_DATASET_VERSION,
  listMainlandCities,
  resolveCityCoordinates,
} from '../src/data/china-cities.ts';
import { P5_BOUNDARY_INPUT_AUDIT_CASES } from '../src/domains/golden/index.ts';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('P5-B1 当前 35 条城市审计快照保持生产 identity、坐标、版本和 101 个名称 token', () => {
  const production = listMainlandCities();
  assert.equal(production.length, 35);
  assert.equal(new Set(production.map((city) => city.locationId)).size, 35);
  assert.equal(production.reduce((count, city) => count + 1 + city.aliases.length, 0), 101);
  assert.equal(CHINA_CITY_DATASET_AUDIT_REGISTRY.length, 35);
  assert.equal(CHINA_CITY_DATASET_AUDIT_SNAPSHOT.coverage.recordCount, 35);
  assert.equal(CHINA_CITY_DATASET_AUDIT_SNAPSHOT.coverage.uniqueLocationIdCount, 35);
  assert.equal(CHINA_CITY_DATASET_AUDIT_SNAPSHOT.coverage.nameAliasTokenCount, 101);
  assert.equal(CHINA_CITY_DATASET_AUDIT_SNAPSHOT.status, 'partial');
  assert.equal(CHINA_CITY_DATASET_AUDIT_SNAPSHOT.releaseEligibility, 'blocked');
  assert.equal(CHINA_CITY_DATASET_AUDIT_SNAPSHOT.contractVersion, CITY_DATASET_AUDIT_CONTRACT_VERSION);

  for (const city of production) {
    const audit = CHINA_CITY_DATASET_AUDIT_REGISTRY.find((item) => item.locationId === city.locationId);
    assert.ok(audit, city.locationId);
    assert.equal(audit.canonicalName, city.name);
    assert.deepEqual(audit.aliases, city.aliases);
    assert.equal(audit.latitude, city.latitude);
    assert.equal(audit.longitude, city.longitude);
    assert.equal(audit.timezone, city.timezone);
    assert.equal(audit.sourceVersion, city.datasetVersion);
    assert.equal(audit.adminCode, null);
    assert.equal(audit.administrativeLevel, null);
    assert.equal(audit.status, 'prototype');
    assert.equal(audit.centerType, 'city-center-approximate');
  }
  assert.doesNotThrow(() => validateCityDatasetAuditSnapshot(CHINA_CITY_DATASET_AUDIT_SNAPSHOT));
});

test('P5-B1 深圳精确匹配和未知城市行为保持不变', () => {
  const shenzhen = resolveCityCoordinates('广东省深圳市');
  assert.ok(shenzhen);
  assert.equal(shenzhen.locationId, 'CN-GD-SHENZHEN');
  assert.equal(shenzhen.datasetVersion, CHINA_CITY_DATASET_VERSION);
  assert.equal(resolveCityCoordinates('深圳市南山区'), undefined);
  assert.equal(resolveCityCoordinates('福建省泉州市'), undefined);
});

test('P5-B1 合同是纯 JSON 且保留明确的发布阻断原因', () => {
  const roundTripped = JSON.parse(JSON.stringify(CHINA_CITY_DATASET_AUDIT_SNAPSHOT));
  assert.deepEqual(roundTripped, CHINA_CITY_DATASET_AUDIT_SNAPSHOT);
  assert.ok(CHINA_CITY_DATASET_AUDIT_SNAPSHOT.blockers.includes('coverage-not-complete'));
  assert.ok(CHINA_CITY_DATASET_AUDIT_SNAPSHOT.blockers.includes('offline-redistribution-license-unknown'));
  assert.ok(CHINA_CITY_DATASET_AUDIT_SNAPSHOT.blockers.includes('missing-row-coordinate-provenance'));
  assert.ok(CHINA_CITY_DATASET_AUDIT_SNAPSHOT.blockers.includes('missing-row-alias-provenance'));
  assert.ok(CHINA_CITY_DATASET_AUDIT_REGISTRY.every((item) => item.licenseStatus === 'unknown'));
  assert.ok(CHINA_CITY_DATASET_AUDIT_REGISTRY.every((item) => item.rowEvidence.coordinate.status === 'missing'));
});

test('P5-B1 重复 locationId/adminCode、canonical name 和跨记录 alias 会被拒绝', () => {
  const duplicateLocation = clone(CHINA_CITY_DATASET_AUDIT_SNAPSHOT);
  duplicateLocation.records[1].locationId = duplicateLocation.records[0].locationId;
  assert.throws(() => validateCityDatasetAuditSnapshot(duplicateLocation), /locationId duplicates/);

  const duplicateAdminCode = clone(CHINA_CITY_DATASET_AUDIT_SNAPSHOT);
  duplicateAdminCode.records[0].adminCode = '110000';
  duplicateAdminCode.records[1].adminCode = '110000';
  assert.throws(() => validateCityDatasetAuditSnapshot(duplicateAdminCode), /adminCode duplicates/);

  const duplicateCanonical = clone(CHINA_CITY_DATASET_AUDIT_SNAPSHOT);
  duplicateCanonical.records[1].canonicalName = duplicateCanonical.records[0].canonicalName;
  assert.throws(() => validateCityDatasetAuditSnapshot(duplicateCanonical), /canonicalName conflicts/);

  const conflictingAlias = clone(CHINA_CITY_DATASET_AUDIT_SNAPSHOT);
  conflictingAlias.records[1].aliases = [conflictingAlias.records[0].aliases[0]];
  assert.throws(() => validateCityDatasetAuditSnapshot(conflictingAlias), /conflicts with records/);
});

test('P5-B1 非法坐标、非 Asia/Shanghai、缺逐行 provenance/license 字段会被拒绝', () => {
  const invalid = clone(CHINA_CITY_DATASET_AUDIT_SNAPSHOT);
  invalid.records[0].latitude = 91;
  invalid.records[1].longitude = 181;
  invalid.records[2].timezone = 'UTC';
  invalid.records[3].rowEvidence.coordinate = undefined;
  invalid.records[4].licenseStatus = undefined;
  const errors = getCityDatasetAuditValidationErrors(invalid);
  assert.ok(errors.some((error) => error.includes('latitude')));
  assert.ok(errors.some((error) => error.includes('longitude')));
  assert.ok(errors.some((error) => error.includes('timezone')));
  assert.ok(errors.some((error) => error.includes('rowEvidence.coordinate')));
  assert.ok(errors.some((error) => error.includes('licenseStatus')));
});

test('P5-B1 locationId 不得被静默替换为 adminCode，身份替换必须显式映射', () => {
  const sameIdentity = clone(CHINA_CITY_DATASET_AUDIT_SNAPSHOT);
  sameIdentity.records[0].adminCode = sameIdentity.records[0].locationId;
  assert.throws(() => validateCityDatasetAuditSnapshot(sameIdentity), /separate from locationId/);

  const crossRecordIdentityCollision = clone(CHINA_CITY_DATASET_AUDIT_SNAPSHOT);
  crossRecordIdentityCollision.records[0].adminCode = '110000';
  crossRecordIdentityCollision.records[1].locationId = '110000';
  assert.throws(() => validateCityDatasetAuditSnapshot(crossRecordIdentityCollision), /collides with an adminCode/);

  const implicitReplacement = clone(CHINA_CITY_DATASET_AUDIT_SNAPSHOT);
  implicitReplacement.records[0].identityChange = 'replace';
  implicitReplacement.records[0].supersedes = [];
  implicitReplacement.records[0].replacedBy = [];
  assert.throws(() => validateCityDatasetAuditSnapshot(implicitReplacement), /requires supersedes or replacedBy/);

  const explicitReplacement = clone(CHINA_CITY_DATASET_AUDIT_SNAPSHOT);
  explicitReplacement.records[0].identityChange = 'replace';
  explicitReplacement.records[0].supersedes = ['CN-OLD-BEIJING'];
  assert.doesNotThrow(() => validateCityDatasetAuditSnapshot(explicitReplacement));
});

test('P5-B1 release-ready 必须 fail closed：当前 prototype/partial 审计不能冒充可发布数据', () => {
  const releaseClaim = clone(CHINA_CITY_DATASET_AUDIT_SNAPSHOT);
  releaseClaim.releaseEligibility = 'release-ready';
  releaseClaim.blockers = [];
  const errors = getCityDatasetAuditValidationErrors(releaseClaim);
  assert.ok(errors.some((error) => error.includes('adminCode is required for release-ready')));
  assert.ok(errors.some((error) => error.includes('licenseStatus must not be unknown')));
  assert.ok(errors.some((error) => error.includes('must be verified with source')));
  assert.throws(() => validateCityDatasetAuditSnapshot(releaseClaim), /Invalid P5-B1/);
  assert.throws(() => validateCityDatasetReleaseEligibility(CHINA_CITY_DATASET_AUDIT_SNAPSHOT), /release eligibility is blocked/);
});

test('P5-B1 cross-city-coverage 继续保持 routed-p5-b/P5-B，不被本批伪关闭', () => {
  const route = P5_BOUNDARY_INPUT_AUDIT_CASES.find((item) => item.id === 'p5-a4a-cross-city-coverage');
  assert.ok(route);
  assert.equal(route.status, 'routed-p5-b');
  assert.equal(route.targetBatch, 'P5-B');
});
