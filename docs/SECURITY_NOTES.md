# Dependency security notes

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

