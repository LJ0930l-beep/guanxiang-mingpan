/**
 * Reproducible P5-D budgets for the local-first release candidate.
 *
 * These are guardrails for accidental regressions on the CI runner, not a
 * claim about low-end iPhone performance. Real-device numbers remain an
 * external acceptance item in docs/DEVICE_ACCEPTANCE.md.
 */
export const P5_D_PERFORMANCE_BUDGET_VERSION = 'p5-d-performance-budget.v1' as const;

export const P5_D_PERFORMANCE_BUDGETS = {
  bazi: { label: '八字排盘', maxMedianMs: 2500 },
  liuyao: { label: '六爻排盘', maxMedianMs: 2500 },
  ziwei: { label: '紫微排盘', maxMedianMs: 2500 },
  astrology: { label: '星盘排盘', maxMedianMs: 2500 },
  archiveFilter: { label: '历史筛选（250 条）', maxMedianMs: 250 },
  archiveMigration: { label: '历史迁移（250 条）', maxMedianMs: 2500 },
  backupRoundtrip: { label: '普通备份往返（250 条）', maxMedianMs: 5000 },
  inputFailure: { label: '错误边界 fail-fast', maxMedianMs: 250 },
} as const;

export const P5_D_BENCHMARK_ARCHIVE_SIZE = 250 as const;
export const P5_D_BENCHMARK_SAMPLE_COUNT = 3 as const;

export type P5DPerformanceBudgetKey = keyof typeof P5_D_PERFORMANCE_BUDGETS;
