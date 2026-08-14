# Phase 2 — 八字深度结果与证据链执行记录

更新时间：2026-08-15  
范围：`观象·命盘` Phase 2（八字深度结果、证据追溯、历史快照与复盘）

## 目标与边界

Phase 1 负责证明“盘为什么这样算”，Phase 2 负责证明“为什么得到这条判断”。本阶段把第三方排盘结果转为观象自己的领域模型，再依次生成结构化证据、强弱证据链、版本化解释和可回看的历史快照。

本阶段没有修改 Phase 1 的节气、历法、日界线、真太阳时或城市解析规则，也没有加入大运流年、完整格局、神煞大全、AI、支付、账号服务或云同步。

## 批次状态

| 批次 | 状态 | 主要交付 | 关键入口 |
| --- | --- | --- | --- |
| P2-A | 完成 | `NormalizedBaziChart`、稳定干支/藏干 ID、结构化关系边 | `src/domains/bazi/model/normalized-chart.ts` |
| P2-B | 完成 | 五行事实、月令影响、根气与透干 Evidence Node | `src/domains/bazi/evidence/element-evidence.ts`、`season-evidence.ts`、`root-evidence.ts` |
| P2-C | 完成 | Relation Graph、合冲刑害事实节点、支持/反对/决定性证据与四类强弱状态 | `src/domains/bazi/evidence/relation-evidence.ts`、`support-control-evidence.ts` |
| P2-D | 完成 | `bazi-rules-v2`、InterpretationResult、少量结构标签、不确定性标签 | `src/domains/bazi/interpretation/rules.ts` |
| P2-E | 完成 | 结果页 L1 概览 → L2 为什么 → L3 原始证据三层展开 | `src/screens/module-workspace.tsx` |
| P2-F | 完成 | 历史深度快照、主动 Diff、Interpretation Golden Cases、交接文档 | `src/domains/bazi/interpretation/history.ts`、`golden-cases.ts` |

## 分层数据链

```text
Phase 1 Calculation
        ↓
NormalizedBaziChart（稳定 ID，不含解释结论）
        ↓
BaziEvidenceGraph（五行/月令/根气/透干/关系事实）
        ↓
StrengthAssessment（支持、反对、决定性证据 + confidence）
        ↓
BaziInterpretation（bazi-rules-v2 + structure tags）
        ↓
UI Evidence Explorer / Saved History / User-triggered Diff
```

任何深度观察必须能回到 `EvidenceNode.id`。UI 不计算旺衰、不重建关系，也不使用展示字符串作为规则关联键。

## 历史快照与 Diff

新八字 `SavedReading` 会明确保存以下三个 Phase 2 字段：

- `normalizedChartSnapshot`
- `evidenceGraphSnapshot`
- `interpretationSnapshot`（含 `interpretationVersion: bazi-rules-v2`）

`snapshotMeta` 继续保存 Phase 1 的 `engineVersion`、`calculationSettings` 和 `inputSnapshot`。记录页打开时只读取已保存快照；旧记录没有深度字段时显示“旧记录未保存 Phase 2 深度快照”，不会静默用新规则重算。

“按当前规则复核并生成 Diff”是显式用户操作。它才会依据原始输入快照重新计算，并通过 `diffBaziInterpretations` 展示：

- 规则/解释版本是否变化；
- 结论和置信度变化；
- 新增/删除的正向证据与反证引用；
- 强弱状态和置信度是否变化。

用户反馈仍是现实世界事实层，只追加到记录，不会反向修改排盘事实、证据图或旧解释。

## Golden Interpretation Cases

`src/domains/bazi/interpretation/golden-cases.ts` 将解释用例和普通回归用例明确分开：

- `golden-interpretation`：偏强、偏弱、接近平衡、证据冲突/不确定四类样例；每个样例断言状态、置信度和 EvidenceRefs。
- `regression-only`：关系图回归样例，当前覆盖半合与相害，断言关系类型和关系解释证据引用。

测试入口为 `tests/bazi-history.regression.mjs`。规则版本发生可能改变历史解释的修改，必须更新版本并先检查 Golden expected 是否仍符合规则意图，不得为了过 CI 直接改 expected。

## 验证基线

当前本地验证：

```text
npm run typecheck  PASS
npm run lint       PASS
npm test           PASS（44/44）
npm run build:web  PASS（8 static routes，Web Export 实际执行）
git diff --check   PASS
```

GitHub Actions 的 `validate` job 继续执行 `npm ci`、typecheck、lint、npm test 和 `build:web`；Web Export 使用 `if: always()`，不会因测试失败而跳过。每个 P2 批次独立提交并等待远端 Success。

## 当前仍未完成的上线事项

Phase 2 完成不等于正式上线完成。仍需单独处理：

1. 中国大陆真实短信、Apple、微信认证与账号注销/找回；
2. 订阅、单次付费、服务端权益和后续付费 AI；
3. 全国完整城市数据、更多流派设置和更多人工核验样例；
4. iPhone 真机全量验收、隐私政策、用户协议、内容合规和 App Store 材料；
5. 生产依赖审计中的 high/moderate findings，应在兼容的 Expo/RN 升级后重新处理。

