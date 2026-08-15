# Phase 5 · P5-A1 四术 Golden Case 合同与现状盘点

更新日期：2026-08-15  
批次状态：P5-A1 已经 Sol High 独立验收 PASS；P5-A2 实现完成，等待 Sol High 独立验收
范围：统一四术 Golden Case 数据合同、分类门禁、现状清单、回归测试，以及香港天文台 published-reference Golden

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

`src/domains/golden/validator.ts` 同时递归验证整条记录（包括未来扩展字段）的纯 JSON 结构，再验证顶层字段、枚举、日期、分类门禁和 registry ID 唯一性。`src/domains/golden/registry.ts` 从既有 `src/domains/bazi/golden-cases.ts` 映射两条独立八字记录，保留完整输入、计算设置、四柱事实、边界备注、来源和验证日期，并在模块加载时执行 registry validator，防止无效清单或来源漂移进入测试或后续消费方。

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

新增 `tests/golden-case-contract.regression.mjs` 9 项测试，覆盖：

- 合法独立八字条目通过；
- 四模块清单齐全、ID 唯一；
- 紫微/占星/六爻不被标为独立验证；
- 独立验证缺来源、regression-only 矛盾声明独立验证、重复 ID 被拒绝；
- 顶层/嵌套额外函数、`Date`、循环引用、非法日期和缺必填字段被拒绝；
- 两条独立八字 registry 条目与 `BAZI_GOLDEN_CASES` 的完整输入、设置、四柱事实、来源和验证日期逐字段锁定；
- registry 可以纯 JSON 往返，且新测试已接入统一 `npm test`。

本批质量结果：

```text
git diff --check       PASS
npm run typecheck      PASS
npm run lint           PASS
npm test               PASS（83/83，包含新增 9 项）
npm run build:web      PASS（8 条静态 routes，Web Export 实际执行）
```

提交与远端 CI 证据：

| 交付 | 本地 commit | 远端等价 commit | GitHub Actions |
|---|---|---|---|
| 初始 P5-A1 实现 | `e318d48fdf9bcc673fcf8102ca438ecd51305c02` | `5a2876c1b131037f5bef73d4c625ab242e264504` | [run 31867588722](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31867588722) · Success；Regression tests 与 Web export 均 Success |
| 主管退回修复 | `86a62cdd01639e70a76bb1c95048853cb2119cdf` | `2b9412adf78e480f4acd1c6b9682dd372bffd756` | [run 31868036244](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31868036244) · Success；Regression tests 与 Web export 均实际执行并 Success |

Sol High 独立验收结论：**PASS**。主管发现的两项问题已在同一批修复：完整 GoldenCase 纯 JSON 递归门禁，以及从 `BAZI_GOLDEN_CASES` 映射独立八字条目的完整输入/事实防漂移；未改变引擎、排盘输出或持久化 schema。

## 7. 限制与下一候选（未批准）

本批没有声称节气边界、子初、闰月、跨日、未知时辰、未知城市或所有流派已经获得独立专业金标准；这些仍属于后续输入/边界证据工作。城市覆盖和来源/许可审计仍属于 P5-B，不在本批范围。

**P5-A2 已按独立 handoff 授权并完成实现，见下节；本批仍等待 Sol High 独立验收。** P5-A3 只保留候选风险与决策门，不预先批准任何算法或来源变更。

## 8. P5-A2 香港天文台 published-reference Golden（实现完成，等待主管验收）

### 8.1 Scope 与明确不做

本小批只增加两条由香港天文台（HKO）公开资料支持的 `published-reference` Golden Case，验证公开的天文/历法事实，不改变任何计算输出：

- 2024 年立春：HKO 公开时刻为香港时间 UTC+8 的 `2024-02-04 16:27`；测试以现有 `resolveSolarTermBoundary` 的 `2024-02-04T16:27:07` 离线 probe 断言应用在该分钟已进入立春。HKO 只发布到分钟，不能据此宣称官方验证了应用的 `16:27:07` 秒值。
- 农历 2024 正月初一：HKO 2024 对照表公开对应公历 `2024-02-10`；测试以现有 `calculateBaziView` 复现 `2024-01-01 12:00` 到 `2024-02-10 12:00:00` 的日期转换，保留 `sourceCalendar` 与 calendar evidence，不验证八字年/月柱流派。

本小批明确不做：

- 不联网调用 HKO；URL、事实、来源精度和争议边界均固化在 registry fixture 与离线回归测试中。
- 不修改八字 resolver、engine、真太阳时代码、数据依赖、lockfile、UI、Storage、schema 或 CI。
- 不把 HKO 公历/农历事实扩展为八字立春换年、月柱、年柱或其他命理专业真值。

### 8.2 实现与合同

- 新增 `src/domains/golden/published-references.ts`，保存两条纯 JSON HKO fixture；两条均为 `validationClass=independent-validation`、`sourceType=published-reference`、`independentVerification.scope=published-comparison`。
- `sourceReferences` 只指向 HKO 官方说明、2024 节气 XML、2024 对照表 PDF、对照入口及官方历法/立春换年说明；`verifiedBy` 明确为本项目 fixture review，`verifiedAt=2026-08-15`。
- `expectedFacts` 保存 HKO 的公开精度：立春为分钟、农历换算为日期；`expectedInterpretation.notProfessionalTruth=true`；`knownDisputes` 明确秒值、流派和官方历法/立春换年边界。
- `golden-case.v1` 不变；registry 从 10 条增加为 12 条。P5-A1 source-of-truth 测试只比较 `sourceType=independent-library` 的两条既有八字记录，避免把 published-reference 误要求映射自 `BAZI_GOLDEN_CASES`。

### 8.3 测试与质量门

新增 `tests/golden-published-reference.regression.mjs` 4 项测试，覆盖：

- 两条 HKO fixture 通过 validator，引用非空且全部为 `published-reference`；
- 立春公开分钟与 resolver 当前节令匹配，且不把应用秒值宣称为 HKO 精度；
- 农历正月初一日期映射与 calendar evidence/source calendar 保留；
- registry 分类统计更新，紫微/占星/六爻仍无 `independent-validation`。

统一 `npm test` 由 83 项增加为 87 项；P5-A2 实现提交前必须完成 `git diff --check`、`npm run typecheck`、`npm run lint`、`npm test`、`npm run build:web`（8 routes）和白名单检查。远端 CI 必须为 Success 且实际执行 Web Export；本节最终证据由主管验收时回填。

### 8.4 P5-A3 候选风险（仅登记，未批准）

核实 `src/domains/bazi/true-solar-time.ts`：当前 `TRUE_SOLAR_DATA_VERSION` 名称为 `equation-of-time-noaa-v1`，但实现公式并非本批 HKO 引用或 NOAA 229.18 系数公式，且该常量当前未进入保存 evidence。P5-A3 需要 Sol High 决策：继续当前近似式并纠正来源标签，或切换 NOAA 公式并处理版本/历史兼容。本小批不修改真太阳时代码、版本名或快照。
