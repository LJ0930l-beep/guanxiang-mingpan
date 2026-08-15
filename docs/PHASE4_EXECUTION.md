# Phase 4 · 四术解释体验与三术深度化执行记录

更新日期：2026-08-15  
当前状态：P4-A～P4-H 代码基线已完成，等待最后一批 GitHub Actions 绿色 Success 后进入真实 iPhone/TestFlight 验收。

## 目标与边界

Phase 4 将四个模块从“盘面展示”推进到可检查的解释体验：

```text
引擎原始输出 → 标准化命盘 → 证据图 → 解释快照 → 解释 UI / Glossary → 保存与历史 Diff
```

本阶段不接 AI、账号后端、支付、广告、云同步、流派切换或大运/流年扩展。解释默认使用人话，证据可展开，低置信和近似输入必须显式保留边界。

## 批次完成情况

| 批次 | 交付 | 验证 |
|---|---|---|
| P4-A | `ExplanationBlock`、`ExplanationSnapshot`、Glossary、运行时校验/迁移；`ChartPayload`、`SavedReading`、本机备份接入解释快照。 | P4-A 回归、备份损坏拒绝、CI 绿色 |
| P4-B | 八字 8 类解释块：overview / strength / season / roots / elements / ten-gods / relations / summary；L1/L2 展开与八字 Golden。 | 四档强弱、低置信边界、CI 绿色 |
| P4-C | 紫微标准化十二宫/星曜/命身宫/四化模型和 `ziwei-evidence-v1`。 | 稳定 ID、证据引用、CI 绿色 |
| P4-D | 紫微 Explanation V1、Glossary 与结果页展开。 | 缺失四化降级、内容安全、CI 绿色 |
| P4-E | 占星天体/角点/宫位/相位/逆行/精度标准化和证据图；精确/近似解释分支。 | 近似盘不猜上升/天顶/宫位、CI 绿色 |
| P4-F | 六爻标准化爻位与 `liuyao-evidence-v1`：问题、用神、旺衰、世应、动变、空亡、时间、本变卦。 | 固定 seed/date/timezone、CI 绿色 |
| P4-G | 六爻 Explanation V1；只解释结构、支持/限制和复盘入口，不输出应期/时间承诺。 | 内容安全、静卦边界、CI 绿色 |
| P4-H | 四模块解释快照 Golden、普通备份 deepEqual、通用解释历史 Diff、只读 Snapshot Viewer 和统一 Glossary 接入。 | 全量测试、Lint、类型检查、Web Export、CI |

## 关键公共协议

- `src/domains/explanation/types.ts`：解释块、快照和术语版本。
- `src/domains/explanation/snapshot.ts`：快照运行时校验和旧记录迁移；旧记录没有解释时不补造。
- `src/domains/explanation/history.ts`：只比较两个已保存解释快照，输出块、摘要、段落、证据和术语引用变化，不触发重算。
- `src/components/explanation-layer.tsx`：统一 L1 摘要、L2 解释、术语点击、证据/反证、原始事实和边界提示。
- `src/domains/archive/types.ts` 与 `src/components/snapshot-viewer.tsx`：历史记录只读显示保存时的解释快照。

## 模块入口

- 八字：`src/domains/bazi/explanation/index.ts`
- 紫微：`src/domains/ziwei/model/normalized-chart.ts`、`evidence/index.ts`、`explanation/index.ts`
- 占星：`src/domains/astrology/model/normalized-chart.ts`、`evidence/index.ts`、`explanation/index.ts`
- 六爻：`src/domains/liuyao/model/normalized-chart.ts`、`evidence/index.ts`、`explanation/index.ts`

页面只消费 `ChartPayload.explanation` 与 `evidenceGraph`；判断逻辑不应回到页面临时拼接。每个解释块必须带版本、置信度、边界和证据引用。

## 当前验证门禁

```text
npm run typecheck
npm run lint
npm test
npm run build:web
```

GitHub Actions `ci.yml` 会按同一顺序执行，Web Export 使用 `always()`，即使前置检查失败也不会被跳过。Phase 4 之后仍有真实 iPhone/TestFlight 文件流、账号/隐私合规、全国城市覆盖和发布材料等上线门槛。
