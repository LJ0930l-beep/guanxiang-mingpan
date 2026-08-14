# Phase 1：八字可信度工程

本文件是仓库内的执行跟踪，依据项目负责人提供的
`观象命盘_Phase1_八字可信度工程开发执行书_2026-08-14.docx`。Phase 1 只处理八字基础结果的可信度、复现和证据，不提前加入大运、流年、格局、喜忌/用神、神煞、合婚、AI、支付或真实账户。

## 目标流水线

```text
输入校验
  → 公历/农历与闰月解析（固定 Asia/Shanghai）
  → 节气边界与月份依据
  → 日界规则（午夜 / 子初）
  → 可选真太阳时与地点数据
  → 第三方引擎适配
  → 统一四柱结果 + Calculation Evidence
  → ChartSnapshot / 历史复盘
```

## 批次状态

| 批次 | 状态 | 当前交付 |
|---|---|---|
| P1-A Golden 框架 | 已完成第一版 | `src/domains/bazi/golden-cases.ts` 定义来源、来源类型、规则前提、验证人/日期、预期四柱与边界备注；`lunar-javascript@1.7.7` 作为独立 MIT 来源交叉校验；新增两条非 `regression-only` 样例和 2 项测试。 |
| P1-A 设置/证据骨架 | 已完成第一版 | `BaziCalculationSettings` 固定时区、日界、真太阳时模型、位置数据版本、历法解析版本；`BaziCalculationEvidence` 显式记录民用时刻、有效时刻、节气状态、日界和警告。真太阳时仍会拒绝执行，子初由 P1-C 接管。 |
| P1-B 节气边界 | 已完成第一版 | `solar-terms.ts` 固定 `Asia/Shanghai`、数据源/版本/秒级精度；返回最近/下一节气、当前月柱依据和 ±1 分钟边界窗口；已加入立春 T-1/T/T+1 与 `TZ=UTC`/`Asia/Shanghai` fixtures。 |
| P1-C 日界规则 | 已完成第一版 | `day-boundary.ts` 固定 `midnight` / `ziEarly`：23:00 起按下一日期计算日柱与时柱；结果保存有效计算时刻、规则和警告；UI 提供切换并提示会影响日柱/时柱；加入 22:59/23:00/23:01 fixtures。 |
| P1-D 地点/真太阳时 | 已完成第一版 | `true-solar-time.ts` 用 UTC-only 算术实现地方平太阳时/视太阳时；标准经线固定 120°E，记录经度、均时差/经度修正、精度、有效时刻与数据版本；UI 可切换模型；已加入跨 `TZ=UTC`/`Asia/Shanghai` 回归。城市库扩展与来源许可仍在 P1-E/F 收口。 |
| P1-E 农历/闰月/UI | 已完成第一版 | `calendar-resolver.ts` 固定 `lunar-javascript@1.7.7`，显式校验农历日期/闰月组合并转换公历；证据记录输入、换算结果、来源和 resolver 版本；跨春节、非法闰月、无效日期与跨 TZ fixtures 已加入。前后计算依据仍需在 P1-F 做成可折叠完整面板。 |
| P1-F 收口 | 未开始 | 全 Golden 回归、旧记录迁移、跨 TZ、文档和 CI 绿色。 |

## P1-A 证据边界

- `lunar-javascript` 只作为独立交叉校验来源；应用仍通过自己的 `chart-engine` facade 产出结果。
- 当前 Golden Case 仍避开节气边界和午夜争议时间；P1-B/P1-C 的独立边界 fixtures 已标记为回归证据，后续再补更多公开来源样例。
- 公历与已通过解析的农历输入，`solarTermBoundary.status` 均为 `resolved`；农历证据会写明输入历法、是否闰月、公历换算结果、数据源/版本和 resolver 版本。
- 当前默认真太阳时关闭，`trueSolarTime` 开启后必须选择 `localMeanSolarTime` 或 `apparentSolarTime`；修正后的有效时刻、经度和标准经线会写入证据，农历输入暂明确拒绝真太阳时并等待 P1-E 换算证据。
- 旧记录迁移后会补一份“历史默认规则”证据，且保留原始结果，不自动用新规则重算。

## 独立来源记录

来源、固定提交与许可证边界见 `../metaphysics-app-research/SOURCE_MANIFEST.md`。P1-A 使用 `6tail/lunar-javascript` MIT 版本 `1.7.7`；不得把 Taibu 应用层或 AGPL 代码复制到本项目。
