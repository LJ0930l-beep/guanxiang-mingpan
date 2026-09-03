# Dependency security notes

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
