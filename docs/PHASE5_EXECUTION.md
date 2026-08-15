# Phase 5 · P5-A1～P5-A4b1 四术可信度与输入边界审计

更新日期：2026-08-15  
批次状态：P5-A1、P5-A2、P5-A3a、P5-A3b、P5-A4a 已由 Sol High 独立验收 PASS；P5-A4b1 已完成实现并待 Sol High 独立预审；P5-A3 子里程碑已完成；整个 P5-A 与 Phase 5 仍未完成
范围：统一四术 Golden Case 数据合同、分类门禁、现状清单、回归测试、香港天文台 published-reference Golden、P5-A3a 真太阳时版本兼容与 Storage Schema 3、P5-A3b 历史证据展示与显式当前规则复核、P5-A4a 四术边界与输入策略机器可检查审计，以及 P5-A4b1 安全输入校验、可识别错误合同和 resolution overlay

说明：第 1～8 节保留 P5-A1/P5-A2 的历史验收记录；第 9 节记录 P5-A3a 的实现、修复和 Sol High 独立验收 PASS，第 10 节记录 P5-A3b 实现、复核和 Sol High 独立验收 PASS，第 11 节记录 P5-A4a 审计合同实现和 Sol High 独立验收 PASS，第 12 节记录 P5-A4b1 实现和预审证据，不表示整个 P5-A 或 Phase 5 完成。

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

**P5-A2 已按独立 handoff 完成实现并经 Sol High 独立验收 PASS，见下节；这不等于整个 P5-A 或 Phase 5 完成。** P5-A3a 的方案 A 已由负责人选择并经 Sol High 独立验收 PASS；P5-A3b 不是新的 owner 决策门，已按主管授权完成实现并经 Sol High 独立验收 PASS；P5-A3 子里程碑至此完成。

## 8. P5-A2 香港天文台 published-reference Golden（Sol High 独立验收 PASS）

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

统一 `npm test` 由 83 项增加为 87 项。主管在本地独立复跑以下质量门并全部通过：

```text
git diff --check       PASS
白名单检查             PASS
npm run typecheck      PASS
npm run lint           PASS
npm test               PASS（87/87）
npm run build:web      PASS（8 routes）
```

交付证据：本地 commit `a9efd1b05d4a2387a8375b7bd5cc913cc136d232`；远端等价 commit `3ffdda0caa8fd4b7c91aef45f65c63ad22f815bb`；[GitHub Actions run 31869188065](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31869188065) 为 `completed/success`。run 的 `validate` job 中 Regression tests 与 Web export 两个步骤均实际执行并为 `success`。

Sol High 独立验收结论：**PASS**。本结论只覆盖 P5-A2 两条 HKO published-reference Golden 及其离线证据；整个 P5-A、Phase 5 和 Level A 发布门仍未完成。

### 8.4 P5-A3 风险与授权边界

P5-A2 时登记的真太阳时来源标签风险已由负责人选择的方案 A 处理，并经 P5-A3a 独立验收 PASS。P5-A3b 已获主管授权并完成记录页历史证据展示和显式当前规则复核实现，经 Sol High 独立验收 PASS。P5-A3 子里程碑已完成，但不能把本批实现写成最终专业真值或发布结论；整个 P5-A 与 Phase 5 仍未完成。

## 9. P5-A3a 真太阳时版本兼容与 Storage Schema 3（Sol High 独立验收 PASS）

### 9.1 Scope 与实现摘要

- 新计算默认使用 `true-solar-time-v2-noaa`：按 NOAA `solareqns.PDF` 的 229.18 系数、年内日序和民用时分秒计算均时差；计算只使用固定 `Asia/Shanghai` 民用字段和 UTC-only 日期运算，不读取 process/OS 时区。
- 保留 `true-solar-time-v1-approx` 的原近似公式与原 `Math.round` 行为，只有显式版本复现时使用；`legacy-unknown` 在要求实际真太阳时计算时拒绝，不猜版本。
- v2 证据保存 raw correction、展示 correction、实际应用分钟、对称 half-away-from-zero 舍入规则、`dataSource`、`dataVersion`、NOAA PDF URL 和 `provenanceStatus`；新 payload 与 `snapshotMeta.calculationSettings` 一致。
- `Storage Schema 2 → 3` 只补版本/来源/证据元数据，不调用 `calculateBaziView`，保留历史四柱、归一化盘、证据图、解释、生成时间、引擎版本、输入/命主快照、反馈和收藏；缺失真太阳时证据以 `provenanceStatus=unknown` 表达，`applied`、修正数值和有效时刻均保持缺省，不合成 `false`、0 或民用时刻。
- 普通/加密备份接受 schema 1、2、3；旧 schema 2 明文及其加密载荷都经过同一无计算迁移，future schema 4 仍保持 blocked/write-protected。

### 9.2 测试与限制

新增/强化回归覆盖：UTC 与 `Asia/Shanghai` 环境 deepEqual、NOAA 数值与闰年 fixture、正负 0.5 对称舍入、北京 116.4074E 的 09:13/09:14/09:15 实际时柱边界、东经 121 度跨时辰/子初/午夜、schema 2 → 3 不重算与 snapshot-only settings、缺失证据 unknown 及普通/加密备份 roundtrip、merge/replace 和 payload/snapshot settings 一致性。统一 `npm test` 当前为 99 项。

### 9.3 交付与独立验收

初始实现已由主管独立复验：本地 `51fcd3bd8b7938e54f6604785544574115e34733`、远端 `2da65c0928aa23af0ed1fabb36de3008a23ff5d5`、CI [run 31872612966](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31872612966)；修复后本地 `4ed5081354747cc4b4a342552436d0263780f0ff`、远端 `a3e7193d2a0b1c9c4de7b3d9e859a0eb61983459`、CI [run 31873458023](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31873458023)。最终 CI 均为 `completed/success`，Regression tests 与 Web export 均实际执行并成功。

主管最终独立复验 `git diff --check`、`npm run typecheck`、`npm run lint`、`npm test`（99/99）和 `npm run build:web`（8 routes），全部 PASS。方案 A 验收范围为：新计算使用 NOAA v2；旧 v1 仅用于明确的历史结果复现；`legacy-unknown` 不伪造证据，也不用于实际计算。

Sol High 独立验收结论：**P5-A3a PASS**。

本批明确不做：其他术数算法、真太阳时历史重算、公式流派选择或最终专业真值声明。P5-A3a 与 P5-A3b 均已完成独立验收，P5-A3 子里程碑整体完成；边界日期、闰月、DST、未知时辰、未知城市及四术输入失败路径仍需后续审计。整个 P5-A 和 Phase 5 仍未完成。

## 10. P5-A3b 历史真太阳时证据展示与显式当前规则复核（Sol High 独立验收 PASS）

### 10.1 Scope 与实现摘要

- 历史记录页面只从 `SavedReading` 已保存的 payload、snapshotMeta、evidence 和 interpretation 构造展示；真太阳时状态明确区分 NOAA v2（当前规则）、v1 近似公式（仅历史复现、非 NOAA）、历史版本未知和未启用。
- 八字实时结果的“本次计算依据”和摘要展示证据版本、来源/URL、raw/display/applied 修正、舍入规则、民用时刻与有效计算时刻；历史缺失值统一显示“历史记录未保存/无法确认”，不合成 0 或民用时刻。
- 新增纯函数复核构造器：只保留历史快照中的业务时区、日界线、真太阳时开关、模型和冻结出生输入/坐标，显式把实际复核版本强制为 `true-solar-time-v2-noaa`。缺时辰、缺已确认经度或缺深度快照时拒绝，并给出可理解提示。
- “按当前规则复核”只在用户点击后于内存生成当前结果与 Interpretation Diff，不调用保存/更新操作；原 `SavedReading` 不被覆盖。设置与证据版本或启用状态冲突时，在历史页面显式提示。
- 不修改任何算法、Storage Schema、备份合同、依赖、网络/AI/支付或其他术数行为；P5-A3b 不代表整个 P5-A3 或 Phase 5 完成。

### 10.2 测试与质量门

新增 `tests/bazi-current-replay.regression.mjs` 5 项回归并接入统一 `npm test`，覆盖四种展示状态、未知证据空值、设置/证据冲突、v1→v2 当前规则复核边界、真太阳时与子初换日最终有效时刻、legacy-unknown 复核、缺时辰/经度拒绝及 SavedReading deepEqual。

本地质量门：

```text
git diff --check       PASS
npm run typecheck      PASS
npm run lint           PASS
npm test               PASS（104/104）
npm run build:web      PASS（8 routes，Web Export 实际执行）
```

候选实现交付：本地 `30f2db2c164bd1cac709025a340e91f32a3fa147`；远端等价 `baea5f6e53bcc52564fd7b7e375cc4e70463398f`；[GitHub Actions run 31875157338](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31875157338) 为 `completed/success`，Regression tests 与 Web Export 均实际执行并成功。主管初审本地 `git diff --check`、`npm run typecheck`、`npm run lint`、`npm test` 104/104、`npm run build:web` 8 routes 均 PASS。

验收收口交付：账本修复本地 `1189f5e9d7ed6001ac8ce132e8ee69b79435c052`；远端等价 `c5bc6f04a0b6ddc1f43233d88c061a7efeccebfb`；[GitHub Actions run 31876037500](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31876037500) 为 `completed/success`，Regression tests 与 Web Export 均实际执行并成功。Sol High 独立审阅纯 helper、UI 接入、records replay 调用链、SavedReading 不变性、最终 `effectiveCalculationTime` 优先级、scope/白名单，并独立重跑 `git diff --check`、typecheck、lint、`npm test` 104/104 与 Web Export 8 routes，全部 PASS。

Sol High 独立验收结论：**P5-A3b PASS**。P5-A3a 与 P5-A3b 均完成，P5-A3 真太阳时版本兼容、证据展示和显式 current-rule replay 子里程碑整体完成；无算法、Storage Schema、依赖变化，历史结果不静默重算。P5-A 的边界日期、闰月、DST、未知时辰、未知城市及四术输入失败路径仍需后续审计；P5-B 尚未开始。

当前状态：P5-A3b 已经 Sol High 独立复验 PASS；不标记整个 P5-A 或 Phase 5 完成。

## 11. P5-A4a 四术边界与输入策略机器可检查审计（Sol High 独立验收 PASS）

### 11.1 Scope 与明确不做

本批把“边界日期、闰月、DST、未知时辰、未知城市、四术输入失败路径”从散落说明整理为纯 JSON 审计合同和运行时门禁。合同位于 `src/domains/golden/boundary-input-contract.ts`，离线审计说明见 [P5_A_BOUNDARY_AUDIT.md](P5_A_BOUNDARY_AUDIT.md)。

- 覆盖八字、紫微、占星、六爻和跨模块共 41 项；每项固定 `id`、输入/fixture 摘要、真实 `currentBehavior`、`expectedPolicy`、风险、状态、验证级别、证据引用、目标批次和 owner 决策标记。
- 运行时拒绝非纯 JSON、函数、`Date`、循环引用、非有限数字、未知枚举、坏 evidence reference、重复 ID，以及与状态不一致的 `targetBatch` / `ownerDecisionRequired`。
- 当前 41 项全部诚实标记为 `regression-only`；项目自身测试不提升为 independent-validation，也不宣称四术专业真值。
- 本批只盘点、建合同和增加审计门禁；不修四术算法、UI、Storage、备份、依赖、lockfile 或 CI，不扩充城市数据。

### 11.2 当前矩阵统计与已确认事实

| 维度 | 统计 |
|---|---:|
| 总项数 | 41 |
| 模块 | 八字 10、紫微 9、占星 8、六爻 9、跨模块 5 |
| 状态 | covered 18、gap 15、decision-required 5、not-applicable 2、routed-p5-b 1 |
| validationClass | regression-only 41；independent-validation 0；pending-verification 0 |

当前明确登记的 gap/决策包括：

- 占星未知城市会把缺失坐标传为 `0,0`；虽标记为 approximate 并隐藏角点/宫位，但行星位置仍会变化，不能视为仅降低精度；因此跨模块“无猜测”整体仍是 gap。
- 紫微对 `2024-02-30` 等无效公历日期当前可能返回 `solarDate=2024-2-30`；占星同输入依赖第三方错误，普通无效日期已拆成 P5-A4b 安全输入 gap；错误 taxonomy/contract 进入 P5-A4b，UI/读屏文案仍单独路由 P5-C，公开支持日期范围仍保留为 owner decision。
- 八字东西经真太阳时跨日矩阵、六爻 seed/非法日期与四术统一错误分类仍为后续 gap；城市完整覆盖路由 P5-B，无障碍文案路由 P5-C。
- 八字/紫微/占星的公开日期范围、历史夏令时处理、占星缺时辰近似模式等会改变公开规则或承诺，标记为 `decision-required`，等待负责人决策，不在本批擅自选择；普通无效公历日期拒绝则单独标为 P5-A4b 安全输入 gap，不升级为 owner 决策。

### 11.3 DoD 与当前状态

新增 `tests/p5-boundary-input-audit.regression.mjs` 8 项测试并接入统一 `npm test`，覆盖合同纯 JSON/重复 ID/枚举门禁、矩阵统计、占星 0,0 行为、紫微非法日期、六爻输入失败路径、占星跨宿主 TZ deepEqual、八字合法/非法闰日。

本地质量门：

```text
git diff --check       PASS
npm run typecheck      PASS
npm run lint           PASS
npm test               PASS（112/112）
npm run build:web      PASS（8 routes，Web Export 实际执行）
```

实现交付与独立验收证据：本地 commit `2cf82d402e2f840ebf7c29bf47ee3b167fab9688`；远端等价 commit `c7055e8962b3b21dd8b78c8f5c64769e9528daf0`；[GitHub Actions run 31879638540](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31879638540) 为 `completed/success`。该 run 的 Typecheck、Lint、Regression tests 与 Web Export 均实际执行并 Success；主管本地独立复跑 `git diff --check`、typecheck、lint、`npm test`（112/112）和 `build:web`（8 routes），全部 PASS。

该 CI run 唯一非阻断 warning 为：`actions/checkout@v4`、`actions/setup-node@v4` 的 Node 20 action runtime 被 runner 强制为 Node 24。该项登记为后续 CI maintenance；本批不修改 workflow，不影响四项质量门结果。

Sol High 独立验收结论：**P5-A4a PASS**。本结论只覆盖四术边界/输入审计合同、机器门禁和已登记的现状事实；P5-A4a 不关闭整个 P5-A，真实 gap、负责人决策项、P5-A4b、P5-B、P5-C 及 Phase 5 仍需独立授权和验收。

## 12. P5-A4b1 安全输入校验、可识别错误与 resolution overlay（实现待 Sol High 独立验收）

### 12.1 Scope 与明确不做

本批只关闭三项已在 P5-A4a 登记、且不需要负责人选择公开规则的安全输入 gap：

- `p5-a4a-ziwei-invalid-gregorian-date`：紫微 solar 路径拒绝格式错误或不存在的 Gregorian 日期；
- `p5-a4a-astrology-invalid-gregorian-date`：占星 solar 路径拒绝格式错误或不存在的 Gregorian 日期；
- `p5-a4a-astrology-invalid-coordinate`：占星显式坐标拒绝非成对、非有限或超出纬度/经度范围的输入。

本批没有修改 UI、Storage/schema、备份、城市数据、依赖/lockfile、CI、八字或六爻引擎，也没有选择 unknown-coordinate `0,0`、缺时辰、公开支持年份范围、DST、占星 lunar 历法或其他 owner decision。占星两项坐标都缺失时仍保留既有 unknown-city/`0,0` gap。

### 12.2 实现摘要与合同

- `src/services/chart-errors.ts` 定义稳定 `ChartInputError` 实例合同：`category=input-validation`、`code`、`field`、稳定中文 `message`；当前 codes 为 `INVALID_GREGORIAN_DATE` 与 `INVALID_BIRTH_COORDINATES`。`isChartInputError` 只识别真实实例，`isChartInputErrorContract` 识别跨边界反序列化后的纯合同。
- `src/services/chart-engine-shared.ts` 提供不读取宿主 TZ、只按字段和 Gregorian 闰年规则判断的严格 `YYYY-MM-DD` 校验，以及显式坐标 pair/finite/range 校验。仅紫微 solar 与占星 solar 调用日期校验；紫微 lunar 不调用，Astrology lunar 策略仍未决。
- `src/domains/golden/boundary-input-resolution.ts` 新增纯 JSON `p5-a4b-input-resolution.v1` overlay，严格只包含上述三个 A4a gap；validator 检查 auditCaseId 存在、原条目为 `gap` 且 target 为 `P5-A4b`、resolution/audit ID 唯一、纯 JSON 和 `tests/` 引用，不预填 commit SHA。

本批实际变更文件严格限于：`src/services/chart-errors.ts`、`src/services/chart-engine-shared.ts`、`src/services/engines/ziwei-engine.ts`、`src/services/engines/astrology-engine.ts`、`src/domains/golden/boundary-input-resolution.ts`、`src/services/chart-engine.ts`、`src/domains/golden/index.ts`、两份 P5 回归测试、`package.json` 测试脚本，以及 `docs/HANDOFF.md`、`docs/PHASE5_EXECUTION.md`、`docs/PROJECT_MASTER_EXECUTION.md`、`docs/ROADMAP.md`、`docs/P5_A_BOUNDARY_AUDIT.md` 五份账本；未产生其他文件改动。

P5-A4a 原 registry 与历史统计 `41 / 18 / 15 / 5 / 2 / 1` 未改，原始条目事实仍作为 immutable audit snapshot；overlay 只声明三项增量关闭，不重写 A4a 数据。

### 12.3 测试与质量门

新增 `tests/p5-input-validation.regression.mjs` 并接入统一 `npm test`，覆盖 overlay 合同、错误实例/纯合同守卫、非法日期、合法闰日（含世纪闰年）、partial/NaN/Infinity/越界/边界坐标、合法坐标、城市 resolver 命中、Ziwei lunar 绕过 Gregorian validator、overlay validator 负向门禁，以及 UTC/`Asia/Shanghai` 结果与错误一致性。A4a 回归保留 immutable registry 与未知坐标 `0,0` probe，不再要求已修复的非法日期旧行为。

当前工作树预审命令结果：

```text
git diff --check       PASS
npm run typecheck      PASS
npm run lint           PASS
npm test               PASS（120/120，含本批新增 8 项）
npm run build:web      PASS（8 routes，Web Export 实际执行）
```

上述结果不构成 Sol High 验收；实现仍待 Sol High 独立 review/acceptance。即使本批通过，cross error taxonomy、unknown-coordinate `0,0`、日期支持范围、DST、缺时辰及其余 A4a gap/decision-required 项仍未完成，P5-A 与 Phase 5 仍未完成。
