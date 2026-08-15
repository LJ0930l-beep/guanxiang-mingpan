# Phase 5 · P5-A1 四术 Golden Case 合同与现状盘点

更新日期：2026-08-15  
批次状态：实现完成，等待 Sol High 独立验收  
范围：统一四术 Golden Case 数据合同、分类门禁、现状清单和回归测试

## 1. Scope 与明确不做

本批只完成 P5-A1：

- 建立共享、可序列化、可运行时验证的四术 Golden Case 合同；
- 为现有八字、六爻、紫微、占星和 Phase 4 解释 fixture 登记来源、用途和验证级别；
- 让 `independent-validation`、`regression-only`、`pending-verification` 之间的矛盾状态在运行时被拒绝；
- 将新测试接入统一 `npm test`，不复制大段既有 expected 输出。

本批明确不做：

- 不新增专业结论，不把项目自身输出或 CI 通过当作专业真值；
- 不替换任何排盘/解释引擎，不改变现有四术结果；
- 不扩充城市数据、流派、输入策略、账号、支付、广告、AI、UI、Storage 或备份；
- 不修改持久化 schema、迁移版本、依赖版本、lockfile 或 CI 配置。

## 2. 合同版本与字段

合同版本固定为 `golden-case.v1`，定义在 `src/domains/golden/types.ts`。每条记录必须是纯 JSON 数据，不能携带函数、`Date`、循环引用、`NaN`、`Infinity` 或 UI 回调。

必填语义字段：

| 字段 | 含义 |
|---|---|
| `contractVersion` | 稳定合同版本；当前必须为 `golden-case.v1`。 |
| `id` | 全局唯一、稳定的 kebab-case ID。 |
| `module` | `bazi`、`liuyao`、`ziwei`、`astrology` 之一。 |
| `validationClass` | `independent-validation`、`regression-only`、`pending-verification` 之一。 |
| `input` | 可复现输入摘要；只保存必要字段和 fixture 指针。 |
| `calculationSettings` | 时区、引擎/解释版本、seed/date/scope 等计算前提。 |
| `sourceReferences[]` | 来源或现有测试/fixture 位置、定位信息和用途。 |
| `sourceType` | 独立库、公开资料、仓库 fixture、当前输出或人工复核等来源分类。 |
| `independentVerification` | `status`、验证方法、验证范围和限制说明。 |
| `expectedFacts` | 需要稳定回归的事实断言，不复制完整输出。 |
| `expectedEvidence` | 证据节点/证据边界断言和 fixture 位置。 |
| `expectedInterpretation` | 解释层用途和非专业真值声明。 |
| `expectedExplanation` | 可选的解释快照断言。 |
| `knownDisputes[]` | 已知争议、输入近似或尚未独立复核的限制。 |
| `verifiedBy` / `verifiedAt` | 独立验证的验证主体和可验证 ISO 日期；未验证条目必须为 `null`。 |

`src/domains/golden/validator.ts` 同时验证顶层字段、枚举、日期、纯 JSON 结构、分类门禁和 registry ID 唯一性。`src/domains/golden/registry.ts` 在模块加载时执行 registry validator，防止无效清单进入测试或后续消费方。

## 3. 分类门禁

### `independent-validation`

只有同时满足以下条件才允许：

- `sourceReferences` 非空，且来源分类为独立库、公开资料或外部人工复核；
- 顶层来源和所有引用不能是 `repository-fixture` 或 `current-output`；
- `independentVerification.status=verified`，有非空方法和非回归/待验证范围；
- `verifiedBy` 非空，`verifiedAt` 是可验证的 ISO 日期或 UTC datetime。

当前两条八字计算用例满足的是 `lunar-javascript@1.7.7` 技术性交叉校验，不是对八字流派、专业断语或普遍真值的声明。

### `regression-only`

必须显式使用 `status=not-verified`、`scope=regression-only`，并将 `verifiedBy`/`verifiedAt` 保持为 `null`。`expectedInterpretation.notProfessionalTruth` 必须为 `true`，且至少记录一项已知限制或争议。它只表示当前代码的稳定性/结构回归，不是专业真值。

### `pending-verification`

必须使用 `status=pending`、`scope=pending`，不能携带已独立验证的主体或日期，也不能用“verified”状态冒充来源已经复核。

## 4. 当前用例清单

当前 registry 共 10 条：2 条独立技术性交叉验证、8 条 regression-only、0 条 pending-verification。清单只引用 fixture 位置和断言用途，不复制现有测试的大段 expected 输出。

| ID | 模块 | 分类 | 当前用途/来源 | 独立专业真值 |
|---|---|---|---|---|
| `bazi-calculation-1986-05-29-beijing` | 八字 | independent-validation | `lunar-javascript@1.7.7` 四柱交叉校验；测试位于 `tests/bazi-golden.regression.mjs`。 | 否，仅技术交叉校验 |
| `bazi-calculation-2024-02-10-shenzhen` | 八字 | independent-validation | `lunar-javascript@1.7.7` 四柱交叉校验；测试位于 `tests/bazi-golden.regression.mjs`。 | 否，仅技术交叉校验 |
| `bazi-interpretation-fixtures` | 八字 | regression-only | `tests/bazi-history.regression.mjs` 的解释状态、置信度和证据引用回归。 | 否 |
| `ziwei-fixed-chart-engine-fixture` | 紫微 | regression-only | `tests/chart-engine.regression.mjs` 的十二宫、命身主、四化固定样例。 | 否 |
| `astrology-fixed-chart-engine-fixture` | 占星 | regression-only | `tests/chart-engine.regression.mjs` 的精确模式、角点、行星和相位固定样例。 | 否 |
| `liuyao-fixed-seed-fixture` | 六爻 | regression-only | `tests/chart-engine.regression.mjs` 的固定 seed/date/scope/timezone 复现样例。 | 否 |
| `phase4-bazi-explanation-fixture` | 八字 | regression-only | `tests/phase4-golden.regression.mjs` 的解释快照/证据引用/普通备份回归。 | 否 |
| `phase4-liuyao-explanation-fixture` | 六爻 | regression-only | `tests/phase4-golden.regression.mjs` 的解释快照和不承诺应期边界回归。 | 否 |
| `phase4-ziwei-explanation-fixture` | 紫微 | regression-only | `tests/phase4-golden.regression.mjs` 的解释快照、Glossary 和证据引用回归。 | 否 |
| `phase4-astrology-explanation-fixture` | 占星 | regression-only | `tests/phase4-golden.regression.mjs` 的精确/近似解释边界回归。 | 否 |

紫微、占星、六爻当前没有外部来源或人工复核证据，因此不能登记为独立验证。Phase 4 解释固定样例同理；项目自身 CI 通过只证明工程回归门通过，不提高验证级别。

## 5. Schema / 迁移结论

本批**不修改持久化 schema**，不新增 Storage key，不新增迁移，不改变 `SavedReading`、`ChartSnapshotMeta`、备份格式或历史快照。`golden-case.v1` 是开发/验证合同版本，不是用户数据 schema 版本；后续若要把 Golden registry 持久化，必须另开批次评估兼容性、迁移和备份影响。

## 6. DoD 与测试

新增 `tests/golden-case-contract.regression.mjs` 8 项测试，覆盖：

- 合法独立八字条目通过；
- 四模块清单齐全、ID 唯一；
- 紫微/占星/六爻不被标为独立验证；
- 独立验证缺来源、regression-only 矛盾声明独立验证、重复 ID 被拒绝；
- 非 JSON 值、非法日期和缺必填字段被拒绝；
- registry 可以纯 JSON 往返，且新测试已接入统一 `npm test`。

本批质量结果：

```text
git diff --check       PASS
npm run typecheck      PASS
npm run lint           PASS
npm test               PASS（82/82，包含新增 8 项）
npm run build:web      PASS（8 条静态 routes，Web Export 实际执行）
```

提交和远端 CI 结果由最终交接补录；CI 必须包含实际 Web Export Success。

## 7. 限制与下一候选（未批准）

本批没有声称节气边界、子初、闰月、跨日、未知时辰、未知城市或所有流派已经获得独立专业金标准；这些仍属于后续输入/边界证据工作。城市覆盖和来源/许可审计仍属于 P5-B，不在本批范围。

**P5-A2 候选（仅供 Sol High 决策，未批准、未开始）：** 建立边界输入与失败路径的四术证据清单，先盘点节气/子初/闰月/跨日/未知时辰/未知城市/业务时区/六爻固定种子现有 fixture，再决定哪些需要外部来源或人工复核；不预先承诺任何专业结论，也不自动提升当前 registry 条目的验证级别。
