# 当前开发状态

## 里程碑

P5-A3b：历史真太阳时证据展示与显式“按当前规则复核”。

状态：实现完成，等待 Sol High 独立验收；Luna Max 不执行自身验收。

## 实现摘要

- 历史记录只读取已保存的 payload、snapshotMeta、evidence 和 interpretation，真太阳时展示区分 NOAA v2、v1 近似（非 NOAA、仅历史复现）、历史版本未知和未启用。
- 实时八字依据展示来源/版本/URL、raw/display/applied 修正、舍入规则、归一化民用时刻和最终有效计算时刻；未知值显示“历史记录未保存/无法确认”。
- 显式复核 helper 保留历史业务设置与冻结输入/坐标，强制当前规则 `true-solar-time-v2-noaa`，仅在内存生成结果与 Diff，不保存或覆盖原记录。
- 缺时辰、缺确认经度、缺深度快照和设置/证据冲突均有明确处理；未修改算法、Storage Schema、备份合同或依赖。

## 变更文件

- `src/domains/bazi/true-solar-presentation.ts`
- `src/components/snapshot-viewer.tsx`
- `src/screens/records-screen.tsx`
- `src/screens/module-workspace.tsx`
- `tests/bazi-current-replay.regression.mjs`
- `package.json`
- `docs/PHASE5_EXECUTION.md`
- `docs/PROJECT_MASTER_EXECUTION.md`
- `docs/HANDOFF.md`
- `docs/ROADMAP.md`

## 测试命令与结果

- `git diff --check`：PASS
- `npm run typecheck`：PASS
- `npm run lint`：PASS
- `npm test`：PASS，104/104
- `npm run build:web`：PASS，8 routes，Web Export 实际执行
- 直接回归：`tests/bazi-current-replay.regression.mjs`，5/5 PASS

## 阻塞与剩余风险

- 阻塞：等待 Sol High 独立验收和后续 GitHub Actions 结果；本文件不宣称 PASS。
- P5-A3b 不完成历史结果重算、公式选择、专业真值验证、Schema bump 或其他术数改动。
- 真实 iPhone/TestFlight、发布合规、账号、支付、广告和 AI 仍不在本批范围。
