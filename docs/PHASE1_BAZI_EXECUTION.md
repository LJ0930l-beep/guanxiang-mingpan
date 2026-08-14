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
| P1-A 设置/证据骨架 | 已完成第一版 | `BaziCalculationSettings` 固定时区、日界、真太阳时模型、位置数据版本、历法解析版本；`BaziCalculationEvidence` 显式记录民用时刻、有效时刻、节气状态、日界和警告。未实现设置会拒绝执行。 |
| P1-B 节气边界 | 未开始 | 需要独立边界数据、精度/版本和 T-1/T/T+1 分钟样例。 |
| P1-C 日界规则 | 未开始 | 需要落实 `midnight` / `ziEarly`、设置影响预览和历史记录不可静默重算。 |
| P1-D 地点/真太阳时 | 未开始 | 需要完整大陆城市数据集、来源许可、真太阳时模型和实际修正证据。 |
| P1-E 农历/闰月/UI | 未开始 | 需要合法性校验、春节/跨年/闰月样例，以及前后计算依据折叠面板。 |
| P1-F 收口 | 未开始 | 全 Golden 回归、旧记录迁移、跨 TZ、文档和 CI 绿色。 |

## P1-A 证据边界

- `lunar-javascript` 只作为独立交叉校验来源；应用仍通过自己的 `chart-engine` facade 产出结果。
- 当前 Golden Case 避开节气边界和午夜争议时间；边界样例必须等 P1-B/P1-C 完成后再标记为已校验。
- 当前 `solarTermBoundary.status` 是 `pending`，不是“已按节气校准”的声明。
- 当前真太阳时关闭，`effectiveCalculationTime === normalizedCivilTime`；传入 `trueSolarTime` 或 `ziEarly` 会拒绝计算。
- 旧记录迁移后会补一份“历史默认规则”证据，且保留原始结果，不自动用新规则重算。

## 独立来源记录

来源、固定提交与许可证边界见 `../metaphysics-app-research/SOURCE_MANIFEST.md`。P1-A 使用 `6tail/lunar-javascript` MIT 版本 `1.7.7`；不得把 Taibu 应用层或 AGPL 代码复制到本项目。

