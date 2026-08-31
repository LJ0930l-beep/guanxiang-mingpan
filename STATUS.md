# Project Status

## P5-A5a — public birth-date range policy

Implementation is complete and is waiting for independent review by Sol.

Summary:

- Added the versioned inclusive `cn-mainland-public-birth-date-range.v1` contract for `1900-01-01` through `2099-12-31`.
- Applied real Gregorian/lunar validation before the policy in Bazi and Ziwei, and Gregorian validation plus the policy in Astrology; Liuyao remains outside this birth-date policy.
- Added stable `UNSUPPORTED_BIRTH_DATE_RANGE` input error handling and persisted the policy in calculation settings and birth input snapshots, with snapshot/backup migration compatibility.
- Added an independent additive owner-decision registry for the three P5-A4a decision-required date-range cases; A4a and A4b registries remain unchanged.

Changed paths are the files in the P5-A5a implementation and regression-test diff, plus this status file.

Verification:

- `git diff --check` — pass.
- `npm run typecheck` — pass.
- `npm run lint` — pass, 0 warnings.
- `npm test` — pass, 155/155 tests.
- `npm run build:web` — pass; 8 static routes exported.
- `npm audit --omit=dev --json` — recorded production baseline only: 21 advisories (8 high, 13 moderate, 0 critical); no dependency upgrades made.

Blockers: none found for this milestone.

Residual risks:

- The production audit baseline remains non-zero and requires a separately authorized dependency-upgrade milestone.
- Historical DST, Astrology missing-time/coordinate policy, and other owner decisions remain outside P5-A5a.
- Sol must independently review and accept this milestone.
