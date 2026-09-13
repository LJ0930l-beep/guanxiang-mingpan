# Dependency security notes

## 2026-09-14 处置闭环基线

Command:

```bash
npm audit --omit=dev
npm run security:audit
```

Current lockfile result after a semver-compatible `npm audit fix --omit=dev`
(no `--force`, lockfile-only transitive bumps within existing ranges):

- Critical: 0
- High: 4
- Moderate: 15
- Low: 0
- Total: 19

Prior baselines for comparison: 2026-09-03 交付为 0 critical / 9 high / 17
moderate（26 total）；2026-09-08 复盘时审计库滚动更新为 10 high（27 total）。

处置方式按开发执行书（2026-09-08 第 14 节）落地：

1. 兼容修复：非强制的 `npm audit fix --omit=dev` 已将可在现有 semver 范围内
   修复的公告全部升级（10 high → 4 high）。升级后完整门禁重跑通过：
   typecheck、lint、`npm test` 251/251、`build:web` 14 routes、
   `verify:web` 深链与 SW 迁移验证。
2. 剩余 high 全部位于 Metro 构建期工具链（`metro`、`metro-config`、
   `metro-transform-worker` 及其传递依赖 `image-size`），不进入 dist/ 生产包
   或 iPhone 运行时。
3. 门禁升级：`scripts/production-audit.mjs` 现在要求每一条 high/critical
   公告在 `docs/security-advisory-dispositions.json` 处置账本中登记
   依赖路径、是否进入交付物、可达性、决策、责任人与复核期限；缺失或登记
   不完整时门禁失败。当前为 4/4 已登记（decision=accepted，责任人
   安全负责人，复核期限为下次 Expo SDK 升级或 2026-12-31）。

该基线仍不是"生产风险清零"的声明；moderate 公告保持可见，在 SDK 升级或
复核期限到来时随账本一并复审。

## 2026-08-14 production baseline

Command:

```bash
npm audit --omit=dev
```

Result:

- Critical: 0
- High: 18
- Moderate: 10
- Low: 0
- Total: 28

This is the production-only audit view after adding the Expo 57 file, sharing,
document-picker and local backup encryption modules. The direct crypto helpers
(`@noble/ciphers`, `@noble/hashes`, and `expo-crypto`) introduce no audit
findings. Expo SDK 57 and React Native are runtime dependencies in this app, so
their Metro/configuration dependency chain is included. The findings include
`brace-expansion`, `image-size`, `js-yaml`, `nanoid`, `postcss`, `uuid` and the
Expo/Metro/RN chain. The available automatic fixes include incompatible major
changes (for example Expo 53 or React Native 0.72), so `npm audit fix --force`
was not applied.
This baseline must be rechecked during the next compatible Expo/RN upgrade and
before production submission; it is not a claim of zero production findings.

## 2026-08-15 recheck

`npm audit --omit=dev --audit-level=low` was rerun against the current lockfile.
The result is unchanged: 0 critical, 18 high, 10 moderate, 0 low (28 total).
No production dependency was force-upgraded because the suggested fixes still
include incompatible Expo major changes.

## 2026-07-18 baseline

Command:

```bash
npm audit --omit=dev --json
```

Result:

- Critical: 0
- High: 0
- Moderate: 11
- Low: 0

The reported moderate findings are in the Expo build/configuration dependency chain, including `@expo/cli`, `@expo/config-plugins`, `xcode` and a transitive `uuid` version. The automatic “fix” proposes incompatible major downgrades such as Expo 46 or `expo-splash-screen` 55, so `npm audit fix --force` was intentionally not applied.

Before a public release:

1. Re-run the audit against the latest compatible Expo SDK 57 patch.
2. Review the upstream Expo advisories and changelog.
3. Regenerate the lockfile only as part of a tested SDK upgrade.
4. Require zero high or critical production findings before submission.

## 2026-09-03 current production audit baseline

Command:

```bash
npm audit --omit=dev
```

Current lockfile result:

- Critical: 0
- High: 9
- Moderate: 17
- Low: 0
- Total: 26

The raw npm command exits non-zero when advisories exist; the repository gate
`npm run security:audit` parses the same JSON and fails only for critical
findings. This is an explicit temporary engineering gate, not a declaration
that high/moderate risk is acceptable for public release. The current findings
remain concentrated in the Expo/Metro/React Native runtime dependency chain;
no force upgrade was applied because the available automatic fixes change
incompatible Expo/React Native majors. Recheck after a compatible SDK upgrade
and require owner/security review before public submission.

The release-security batch also adds `npm run security:scan` for repository
secret patterns, static CSP/security headers in `public/_headers`, Web export
metadata/public-file verification, and CI steps that run Web Export with
`if: ${{ always() }}`. Secret scanning and the wrapper gate are green locally;
they do not replace dependency remediation, signing-key custody or external
penetration review.

Final delivery evidence: remote commit `052634c1066479d9910f37d8e45d5d3a0ad0f903` (local `e2689527e2b2a642e7d2f894013b38b913f583c6`) passed GitHub Actions [run 33767015750](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33767015750), including Install dependencies, Secret scan, Production audit gate, Typecheck, Lint, Regression tests, Web export and Verify web export. Every step completed successfully; Web Export was not skipped. This proves the reproducible engineering gate only, not that the outstanding high/moderate advisories are acceptable for a public release.
