/**
 * Owner-approved unknown-hour policy for the Bazi module.
 *
 * The 2026-09-08 review charter (§7) authorizes changing the previous
 * blocking strategy: a chart with an unknown birth hour now provides the
 * year, month and stable day pillars as a partial chart. The hour pillar is
 * never fabricated and the noon anchor is a calculation basis, not a claimed
 * birth time. Ziwei and other hour-required modules keep their blocking
 * policy; the dayun time layer needs the exact moment and stays unavailable
 * on partial charts.
 */
export const BAZI_PARTIAL_CHART_POLICY = 'bazi-partial-chart-policy.v1' as const;
export const BAZI_PARTIAL_CHART_ANCHOR = 'Asia/Shanghai-12:00' as const;
export const BAZI_PARTIAL_CHART_DECISION =
  '负责人批准的开发执行书（2026-09-08 第 7 节）授权：未知时辰提供年、月、日三柱部分盘；时柱不补造，正午仅作计算锚点。' as const;
