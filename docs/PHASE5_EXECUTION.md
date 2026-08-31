# Phase 5 · P5-A1～P5-A5c 四术可信度与输入边界审计

更新日期：2026-08-31
批次状态：P5-A1、P5-A2、P5-A3a、P5-A3b、P5-A4a、P5-A4b1、P5-A4b2、P5-A4b3、P5-A4b4、P5-A4b5、P5-A5a、P5-A5b、P5-A5c 已由 Sol High 独立验收 PASS；P5-A3 子里程碑已完成；P5-A 仅待最终总验收与审计收口，整个 Phase 5 仍未完成
范围：统一四术 Golden Case 数据合同、分类门禁、现状清单、回归测试、香港天文台 published-reference Golden、P5-A3a 真太阳时版本兼容与 Storage Schema 3、P5-A3b 历史证据展示与显式当前规则复核、P5-A4a 四术边界与输入策略机器可检查审计，以及 P5-A4b1 安全输入校验、可识别错误合同和 resolution overlay、P5-A4b2 六爻 seed/date 输入合同与跨宿主 TZ 复现、P5-A4b3 八字真太阳时跨日/子初边界矩阵与 cumulative resolution overlay、P5-A4b4 紫微农历/闰月输入校验与 cumulative resolution overlay、P5-A4b5 四模块 engine failures 与跨模块失败契约、P5-A5a 统一公开出生日期政策与 owner-decision overlay、P5-A5b Astrology 日级近似与缺坐标 fail-closed、P5-A5c 中国大陆 1986–1991 历史 DST 规则与快照复现

说明：第 1～8 节保留 P5-A1/P5-A2 的历史验收记录；第 9 节记录 P5-A3a 的实现、修复和 Sol High 独立验收 PASS，第 10 节记录 P5-A3b 实现、复核和 Sol High 独立验收 PASS，第 11 节记录 P5-A4a 审计合同实现和 Sol High 独立验收 PASS，第 12 节记录 P5-A4b1 实现和 Sol High 独立验收 PASS，第 13 节记录 P5-A4b2 六爻输入合同实现和 Sol High 独立验收 PASS，第 14 节记录 P5-A4b3 八字跨日/子初矩阵与 v3 overlay 实现及 Sol High 独立验收 PASS，第 15 节记录 P5-A4b4 紫微农历/闰月输入校验与 v4 overlay 实现及 Sol High 独立验收 PASS，第 16 节记录 P5-A4b5 四模块 engine failures 与 v5 overlay 实现及 Sol High 独立验收 PASS，第 17 节记录 P5-A5a 统一公开出生日期政策与独立 owner-decision overlay 实现及 Sol High 独立验收 PASS，第 18 节记录 P5-A5b Astrology 日级近似/地点安全策略与 additive overlays 实现及 Sol High 独立验收 PASS，第 19 节记录 P5-A5c 中国大陆 1986–1991 历史 DST 与 owner-decision v3 实现及 Sol High 独立验收 PASS；不表示整个 P5-A 或 Phase 5 完成。

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
- 紫微对 `2024-02-30` 等无效公历日期当前可能返回 `solarDate=2024-2-30`；占星同输入依赖第三方错误，普通无效日期已拆成 P5-A4b 安全输入 gap；错误 taxonomy/contract 进入 P5-A4b，UI/读屏文案仍单独路由 P5-C，公开支持日期范围在本 A4a immutable snapshot 中保留为 owner decision，后续已由 P5-A5a overlay 解析。
- 八字真太阳时在 120°E 标准经线两侧的跨日矩阵、六爻 seed/非法日期与四术统一错误分类仍为后续 gap；城市完整覆盖路由 P5-B，无障碍文案路由 P5-C。
- 八字/紫微/占星的公开日期范围、历史夏令时处理、占星缺时辰近似模式等会改变公开规则或承诺；在本 A4a immutable snapshot 中标记为 `decision-required`，当时等待负责人决策，不在 A4a 擅自选择；普通无效公历日期拒绝则单独标为 P5-A4b 安全输入 gap，不升级为 owner 决策。

上述 A4a 快照及其统计保持不可变。P5-A5a 后续通过独立的 `p5-a5a-owner-decision.v1` overlay 解析三项公开日期范围决策，不改写 A4a 条目或 A4b v1-v5 overlays；历史 DST 与占星缺时辰近似仍待后续决策/实现。

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

## 12. P5-A4b1 安全输入校验、可识别错误与 resolution overlay（Sol High 独立验收 PASS）

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

主管本地独立验收命令结果：

```text
git diff --check       PASS
npm run typecheck      PASS
npm run lint           PASS
npm test               PASS（120/120，含本批新增 8 项）
npm run build:web      PASS（8 routes，Web Export 实际执行）
```

实现交付与独立验收证据：local `0d279c677c1c05eb2492f9ae3b779267feb8b165`；remote `8ab5c6981c89590f6f19fabdc688c34ae60650ed`；[GitHub Actions run 31882220415](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31882220415) 为 `completed/success`，validate job 的 Typecheck、Lint、Regression tests 与 Web Export 均实际执行并成功，Web Export 未 skip。主管独立复跑 `git diff --check`、typecheck、lint、`npm test` 120/120 与 Web Export 8 routes，全部 PASS。Node 20 action runtime warning 仍按既有非阻断 CI maintenance 登记，不新增结论。

Sol High 独立验收结论：**P5-A4b1 PASS**。本结论只覆盖本批安全输入校验、可识别错误合同、resolution overlay 和对应工程回归；不关闭 cross error taxonomy、unknown-coordinate `0,0`、日期支持范围、DST、缺时辰或其余 A4a gap/decision-required 项，P5-A 与 Phase 5 仍未完成。

## 13. P5-A4b2 六爻 seed/date 输入合同与跨宿主 TZ 复现（Sol High 独立验收 PASS）

### 13.1 Scope 与明确不做

本小批只关闭 P5-A4a 中六爻的两个安全输入 gap：`p5-a4a-liuyao-invalid-date` 与 `p5-a4a-liuyao-invalid-seed`。本批不处理六爻引擎失败 taxonomy、cross error taxonomy、unknown-coordinate `0,0`、公开日期范围、DST、缺时辰、scope 选择、用神/算法或 UI/Storage/schema/备份/城市/依赖/lockfile/CI。

### 13.2 实现摘要与合同

- `ChartInputError` 增加 `INVALID_LIUYAO_DATE` 与 `INVALID_LIUYAO_SEED`，稳定字段分别为 `date` 与 `seed`；canonical message 由错误码决定，不接受调用方覆盖。
- `normalizeLiuyaoDate` 先按原始 civil 年月日时分秒校验 Gregorian 合法性，再处理 timezone-free、空格分隔、Z、`±HH:MM`、`±HHMM`；带偏移输入统一转换为 `Asia/Shanghai` 的 `YYYY-MM-DDTHH:MM:SS`，毫秒固定丢弃，禁止依赖宿主 TZ。
- `normalizeLiuyaoSeed` 只用 `trim()` 判空，按原始字符串 `Array.from(input).length` 限制 1～256，并保留合法原字符串；自动 seed 也走同一校验。`seedScope` 继续固定为 `guanxiang-local-v1`。
- `p5-a4b-input-resolution.v1` 的原三项 export、registry 和 validator 保持不变；新增纯 JSON、唯一、版本感知的 `p5-a4b-input-resolution.v2` 五项 registry，追加上述两个 A4a gap，所有 resolution 仍要求原 audit gap 与 `targetBatch=P5-A4b`，不写 commit SHA。

### 13.3 测试与质量门

新增 `tests/p5-liuyao-input-validation.regression.mjs` 8 项回归并接入统一 `npm test`，覆盖 v1 三项、v2 五项及负向 validator；合法 local/seconds/millis、Z/`+08:00`/`+0800`、offset Feb30、24:00/分秒 60/坏 offset/非字符串等非法矩阵；空白/超长/非字符串 seed、合法 Unicode seed 原样进入 payload/inputSnapshot、相同 seed/date deepEqual、自动 seed 合法，以及 UTC/Asia/Shanghai 宿主 TZ 下结果和错误完全一致。A4a 的 41/18/15/5/2/1 snapshot、unknown-coordinate `0,0` probe 和其他 v1 行为保持不变；A4a probe 不再要求空 seed 成功。

本地实现质量门结果：

```text
git diff --check       PASS
npm run typecheck      PASS
npm run lint           PASS
npm test               PASS（128/128）
npm run build:web      PASS（8 routes，Web Export 实际执行）
```

实现 local `0815612cb8e2261325828ccf0d07e51525f34280` / remote `a976b4f07a2d516713db10cb2c0f2b53c98aa51a`；GitHub Actions run `31884436927` 为 `completed/success`，validate job `95011564415` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功；主管本地独立门禁 `git diff --check`、typecheck、lint、`npm test` 128/128 和 `build:web` 8 routes 均 PASS。Sol High 独立验收结论：**P5-A4b2 PASS**。当前仅关闭六爻 date/seed 两项；六爻引擎错误/跨模块 taxonomy、`0,0`、公开日期范围、DST、缺时辰、owner decisions 和其余 gap/decision-required 仍未完成，P5-A 与 Phase 5 仍未完成。

## 14. P5-A4b3 八字真太阳时跨日/子初边界矩阵与 cumulative resolution overlay

**状态：Sol High 独立验收 PASS**

### 14.1 Scope 与明确不做

本小批只关闭原始 gap `p5-a4a-bazi-true-solar-cross-day`。新增 regression-only 八字真太阳时边界矩阵，覆盖 135°E / 75°E（相对 120°E 标准经线两侧）、正负应用修正、民用时刻跨到前/后一天，以及 `midnight` / `ziEarly` 两种日界线；固定断言 `trueSolarCorrection.civilTime`、含日期的 `effectiveTime`、`appliedCorrectionMinutes` 和最终 `calculationEvidence.effectiveCalculationTime`。结果只代表当前已验收 NOAA v2 实现的工程回归，不是专业或独立真值。

本批不修改任何八字算法、公式、日界线、Storage/schema、UI、依赖、lockfile 或 CI，不处理日期范围、1986–1991 DST、缺时辰、`0,0`、紫微 lunar、engine/cross taxonomy 或其他 owner decision/gap。

### 14.2 实施摘要与合同

- 新增纯 JSON `p5-a4b-input-resolution.v3`，累计 v1 原 3 项 + v2 追加 2 项 + 本批八字 1 项，共 6 项；v1/v2 原 exports、registry、validator、数据顺序与精确 3/5 计数保持可用。
- version-aware validator 同时支持 v1/v2/v3，检查纯 JSON、唯一 resolution/audit ID、原始 audit case `status=gap`、`targetBatch=P5-A4b` 和测试引用，不写 commit SHA。
- 同一矩阵在 `TZ=UTC` 与 `TZ=Asia/Shanghai` 下整体 deepEqual；A4a `41 / 18 / 15 / 5 / 2 / 1` 与 astrology unknown-city `0,0` probe 保持不变。
- 已核对 Expo SDK 57 exact docs；本批没有使用 Expo API。

实际变更严格限于两份 golden 源文件、新增一份 regression 测试、`package.json` 测试接入和五份 P5 文档；未修改算法测试历史含义。Sol High 已完成独立验收，结论为 **P5-A4b3 PASS**。

### 14.3 回归与未完成项

新增测试覆盖 v1/v2/v3 计数与前缀、v3 混版本/重复/缺项/非 JSON/错误 audit 引用门禁、跨宿主 TZ deepEqual、A4a 统计和 `0,0` probe。

```text
git diff --check       PASS
npm run typecheck      PASS
npm run lint           PASS（0 warning）
npm test               PASS（132/132）
npm run build:web      PASS（8 routes，Web Export 实际执行）
```

实现 local `53a3c46a1145a10f78f7f193df9b6e01dc12bbeb` / remote `c2daaf5691980da3faa839df4847680331d90b53`；GitHub Actions [run 33352537186](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33352537186) 为 `completed/success`，validate job `99368535197` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功。Luna Max 本地独立门禁为 `npm test` 132/132、Web Export 8 routes；`git diff --check`、typecheck、lint 均通过（Lint 0 warning）。

Sol High 独立验收结论：**P5-A4b3 PASS**。本批只关闭 `p5-a4a-bazi-true-solar-cross-day`；紫微 lunar/闰月、六爻 engine/cross taxonomy、unknown-coordinate `0,0`、公开日期范围、1986–1991 DST、缺时辰、owner decisions 及其余 A4a gap/P5-B/P5-C 路由仍未完成。整个 P5-A 与 Phase 5 仍未完成。

## 15. P5-A4b4 紫微农历/闰月输入校验与 cumulative resolution overlay

**状态：Sol High 独立验收 PASS**

### 15.1 Scope 与明确不做

本小批只关闭原始审计 gap `p5-a4a-ziwei-lunar-input` 与 `p5-a4a-ziwei-leap-month`。在既有输入解析/边界层建立可复现 fail-fast 契约：有效普通农历与有效闰月接受，不存在的闰月组合和无效农历日期拒绝；农历路径不套用公历 Gregorian 校验。只使用仓库固定成熟库 `lunar-javascript@1.7.7` 的日历数据能力，不自创历法结论、不宣称独立专业真值。

本批不修改紫微核心算法/公式、UI、Storage/schema、依赖、lockfile 或 CI；不处理日期范围、DST、未知时辰、Astrology `0,0`、engine/cross error taxonomy 或负责人决策项。

### 15.2 实施摘要与合同

- 新增纯 JSON `p5-a4b-input-resolution.v4`，累计 v1=3/v2=5/v3=6/v4=8；保留 v1/v2/v3 exports、顺序前缀与 validator，并新增 v4 validator。
- 两项 v4 resolution 分别关闭 `p5-a4a-ziwei-lunar-input`（日期格式、月份和当月实际日数）与 `p5-a4a-ziwei-leap-month`（按年历核对闰月存在性并拒绝不存在的组合）；闰月事实传递给既有 iztro 路径，不改变排盘算法。
- P5-A4a immutable 审计 registry 与 `41 / 18 / 15 / 5 / 2 / 1` 统计、Astrology `0,0` probe 保持不变。

### 15.3 回归、质量与远端证据

新增回归覆盖普通农历、有效闰月、无效闰月组合、无效农历日期，以及 `TZ=UTC` 与 `TZ=Asia/Shanghai` 整体 deepEqual；不依赖 OS/process TZ。

```text
git diff --check       PASS
npm run typecheck      PASS
npm run lint           PASS（0 warning）
npm test               PASS（139/139）
npm run build:web      PASS（8 routes，Web Export 实际执行）
```

实现 local `62697525875a6214b19b447c1d08753bfdb18d75` / remote `306fdcdc89090f2c3c018ab8a25c5938b1e74195`，remote parent `e41513d3343c7d081bd17d06521c9410139286ab`；GitHub Actions [run 33357809089](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33357809089) 与 validate job `99383188584` 均 `completed/success`，Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功。`npm audit --omit=dev` 生产基线为 0 critical、8 high、13 moderate、0 low；未升级依赖。

### 15.4 验收结论与下一批

Sol High 独立验收结论：**P5-A4b4 PASS**。本批只关闭上述两个紫微农历/闰月输入 gap；下一微批为 **P5-A4b5 四模块 engine errors 与跨模块失败契约**，owner decision items 继续 pending。整个 P5-A、Phase 5 和 Level A 发布门仍未完成。

## 16. P5-A4b5 四模块 engine failures 与跨模块失败契约（Sol High 独立验收 PASS）

### 16.1 Scope 与明确不做

本小批只关闭 immutable P5-A4a registry 中仍为 `gap` 的四个真实条目：

- `p5-a4a-ziwei-engine-error-path`
- `p5-a4a-astrology-engine-error-path`
- `p5-a4a-liuyao-engine-error-path`
- `p5-a4a-cross-error-copy-failure-mode`

真实跨模块审计项是 `p5-a4a-cross-error-copy-failure-mode`；不存在且未使用 `p5-a4a-cross-error-taxonomy`。八字 engine-error 路径在原审计中已经通过，本批仅纳入四模块同形/兼容回归，不虚构新的八字 gap。

本批不处理 Astrology unknown-coordinate `0,0`/no-guessing、公开日期支持范围、DST、未知时辰、算法/公式/历法规则、UI/读屏、Storage/schema、依赖或 CI，也不代替负责人决策；正常成功盘保持原样，任何引擎失败均不得返回部分盘、默认盘或猜测盘。

### 16.2 实施摘要与失败契约

- 新增纯 JSON `p5-a4b-input-resolution.v5`，累计 v1=3、v2=5、v3=6、v4=8、v5=12；v1/v2/v3/v4 exports、顺序前缀与 validators 保持兼容，并新增 version-aware v5 validator。
- Bazi/Ziwei/Astrology/Liuyao 统一使用稳定、JSON-safe、fail-closed 的引擎失败契约，公开形状严格为 `{name,category,module,code}`；本批错误值为 `ChartEngineError`/`engine-failure`/对应模块/`ENGINE_FAILURE`。公开 contract 不含 `cause`、`message`、`stack`、PII 或底层库细节。
- 底层未知异常按模块包装，稳定 engine error 不重复包装；`ChartInputError` 完全兼容并原样重抛，同步、异步及跨边界纯合同均保持输入错误语义。引擎失败不会返回部分盘、默认盘或猜测盘。
- 只使用局部 seam 注入异常，避免全局 monkey patch 和并行污染；正常成功盘保持不变。回归覆盖四模块成功、输入错误、异常包装、安全序列化、跨模块同形与 overlay 前缀/校验。

实现批次实际变更为 10 paths：`package.json`、`src/domains/golden/boundary-input-resolution.ts`、`src/domains/golden/index.ts`、`src/services/chart-engine.ts`、`src/services/chart-errors.ts`、`src/services/engines/astrology-engine.ts`、`src/services/engines/bazi-engine.ts`、`src/services/engines/liuyao-engine.ts`、`src/services/engines/ziwei-engine.ts`、`tests/p5-engine-errors.regression.mjs`。本次文档收口只修改五份指定 P5 文档。

### 16.3 测试、质量与远端证据

```text
git diff --check       PASS
npm run typecheck      PASS
npm run lint           PASS（0 warning）
npm test               PASS（146/146）
npm run build:web      PASS（8 routes，Web Export 实际导出/路由校验通过）
npm audit --omit=dev   0 critical / 8 high / 13 moderate / 0 low（21 total；未升级依赖）
```

GitHub Actions [run 33363580174](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33363580174) 的 validate job `99399593743` 为 `completed/success`，Typecheck、Lint、Regression tests 与 Web Export 均实际执行并成功。实现基线 local `f6dad29fc72b1c49e296b5300ae19c5a2cd6a5b3`；remote `98a336b8381016d781abc2b5584cc0777cb8bbd5`；remote parent `c7801ddc28522a7fdcfe0b38931443ba559868c2`。

P5-A4a immutable audit 本体、`41 / 18 / 15 / 5 / 2 / 1` 统计与 Astrology `0,0` probe 原样不动；npm audit 生产基线为 `0 critical / 8 high / 13 moderate / 0 low`。Sol High 独立验收结论：**P5-A4b5 PASS**。P5-A5a 已通过独立验收并以单独 owner-decision overlay 关闭三项公开日期范围决策；以上为 P5-A4b5 当时的历史下一步记录，P5-A5b 已在第 18 节收口。历史 DST、城市数据完整覆盖及其他发布门仍 pending，整个 P5-A、Phase 5 和 Level A 发布门仍未完成。

## 17. P5-A5a 统一公开出生日期政策（Sol High 独立验收 PASS）

### 17.1 负责人决策与公开日期合同

负责人确认中国大陆首发的八字、紫微和占星公开出生日期统一采用 **1900-01-01 至 2099-12-31（含端点）**。政策版本固定为 `cn-mainland-public-birth-date-range.v1`：三模块范围外统一 fail-fast，返回兼容的稳定 `ChartInputError` code、field 与安全中文文案；八字/紫微农历输入先经过真实农历/闰月校验，再按农历输入年份/日期范围执行，不将 lunar 当 Gregorian，也不以第三方库可计算范围替代产品支持范围。六爻不受该出生日期政策影响。

本批建立独立、JSON-safe、版本感知的 owner-decision overlay `p5-a5a-owner-decision.v1`，精确解析以下三项 A4a decision-required case：`p5-a4a-bazi-supported-date-range`、`p5-a4a-ziwei-date-range`、`p5-a4a-astrology-date-range`。A4a immutable registry/statistics `41 / 18 / 15 / 5 / 2 / 1` 及 A4b v1-v5 overlays 全部保持不变。

### 17.2 可复现快照与兼容性

政策版本和 inclusive 起止边界写入 `calculationSettings`，并通过 `inputSnapshot`、`ChartSnapshotMeta`、`SavedReading` 与普通/加密 backup roundtrip 保留；旧快照读取继续兼容且不补写日期政策，没有 Storage Schema 破坏性变更或迁移。三模块 2099 端点均由固定依赖可靠计算。

### 17.3 回归与远端证据

专项回归 9/9 覆盖八字 solar/lunar、紫微 solar/lunar/闰月、Astrology solar 的 1900/2099 端点、1899/2100 拒绝、既有非法 Gregorian/lunar error code 兼容、Liuyao 2100 不误拦、`TZ=UTC`/`TZ=Asia/Shanghai` deepEqual、快照/replay/backup JSON roundtrip；统一 `npm test` 为 155/155。`npm run typecheck` PASS，`npm run lint` PASS（0 warning），`npm run build:web` PASS（8 routes，Web Export 实际执行）；`npm audit --omit=dev` 生产基线为 0 critical / 8 high / 13 moderate / 0 low，未升级依赖。

实现远端 commit `61805e8998ab4ca701e4960d6129e3b7cb381b17`（parent `496902c875072769439c90cf52f130331fa473d3`），CI run `33375970276` / job `99437414040`；该提交错误新增根目录 `STATUS.md`。随后 cleanup 远端 commit `5350baa9a857b86e2a02c0c42036d72dfe06a0c4`（parent `61805e8998ab4ca701e4960d6129e3b7cb381b17`）只删除 `STATUS.md`；当前仓库无该文件。cleanup 后最终 CI run `33376590722` / job `99439354459` 为 Success，Typecheck、Lint、Regression tests 与 Web Export 均实际执行并成功。

Sol High 独立验收结论：**P5-A5a PASS**。本批只关闭三项公开日期范围 decision-required；P5-A/Phase 5 仍未完成。下一批为 **P5-A5b Astrology 日级近似 + 缺坐标 fail-closed**；DST、缺时辰和其他发布门不在本批。

## 18. P5-A5b Astrology 日级近似与缺坐标 fail-closed（Sol High 独立验收 PASS）

### 18.1 负责人决策与范围

负责人确认 Astrology 出生时辰未知时采用“日级近似”，明确偏差，不伪装精确盘；依赖时辰的 Ascendant、Midheaven、houses、angles 与 aspects 不输出，时间敏感因素只有通过全天稳定性检查后才展示。本批只处理缺时辰近似、地点解析安全边界、精度/定位 metadata、快照兼容和对应审计 overlay；不处理 1986–1991 历史 DST、城市数据完整覆盖、其他术数算法、支付/AI 或 UI redesign。

### 18.2 固定、可复现的计算与地点策略

- 新增并版本化 Astrology contract：`astrology-calculation-policy.v1`、`astrology-precision-policy.v1`、`astrology-location-policy.v1`、`astrology-date-level-approximation.v1` 和 `astrology-date-level-policy.v1`。
- 缺时辰不调用 `requireExactBirth`，固定使用 `Asia/Shanghai` 当地 `12:00:00` 作为内部锚点；以日首 `00:00:00`、锚点和日末 `23:59:59` 比较星座，只有全天稳定的天体才保留锚点度数。Moon 等可能跨星座的快速因素隐藏；逆行等瞬时字段隐藏；不生成相位。
- 日级结果标记 `calculationMode=approximate`、`precision=date-level-approximate`、`completeness=partial`，caveats/focus 明示正午锚点、日首/日末检查和度数近似偏差；normalized/evidence/explanation 同样不产生角点、宫位、相位或时间敏感字段。
- 地点解析优先使用显式成对坐标，其次使用可识别城市数据；缺少、单边、非有限或越界显式坐标沿既有 `INVALID_BIRTH_COORDINATES` 安全错误返回。空城市、未知城市且没有有效成对坐标返回 `MISSING_BIRTH_COORDINATES`，`field=birthCity`，文案为“无法识别出生城市，请补充城市或成对的纬度和经度。”；不存在 `0,0` fallback。

已知时辰加有效显式坐标或城市数据命中仍走 exact 路径，成功 fixture 深度兼容，仅增加 additive policy/location metadata。新结果在 `calculationSettings`、`inputSnapshot`、`ChartSnapshotMeta`、`SavedReading`、backup/replay 中保存 exact/date-level-approximate、内部锚点/规则版本和 location source/policy；旧快照读取保持可用，不补写缺失历史政策，不静默重算。

### 18.3 Additive overlay 与不可变审计边界

P5-A5a 的 `p5-a5a-owner-decision.v1` 保留；累计 `p5-a5a-owner-decision.v2` 为 4 项，新增且仅新增 owner decision `p5-a4a-astrology-missing-time`，对应 `astrology-date-level-approximation` 政策。两个原始 gap 不伪装成负责人决策：累计 `p5-a4b-input-resolution.v6` 为 14 项（v1=3、v2=5、v3=6、v4=8、v5=12、v6=14），v6 关闭 `p5-a4a-astrology-missing-coordinate` 与 `p5-a4a-cross-no-guessing`，只是 cumulative overlay 版本，不新增 A4b 批次。

A4a immutable registry、`41 / 18 / 15 / 5 / 2 / 1` 统计及历史 Astrology `0,0` probe/currentBehavior/evidence 文本均未改写；历史 probe 继续作为旧行为证据，新安全行为仅通过 v2/v6 additive resolution 记录。Liuyao 与其他模块不受本批地点/时辰策略影响。

### 18.4 回归、质量与远端证据

`tests/p5-astrology-safety.regression.mjs` 专项 **7/7**；统一 `npm test` **162/162**；`npm run typecheck` PASS；`npm run lint` PASS（0 warning）；`npm run build:web` PASS（8 routes，Web Export 实际执行）；`git diff --check` PASS；`npm audit --omit=dev` 基线为 **0 critical / 8 high / 13 moderate / 0 low**，未升级依赖。专项覆盖 exact 显式坐标/城市命中、日级近似字段隐藏/partial/caveats、缺地点/空城市/单边/越界坐标 fail-fast、局部 seam 确认 Horoscope 未收到 `0,0`、旧快照读取、SavedReading/backup/replay roundtrip、TZ UTC/Asia/Shanghai deepEqual、owner v1/v2 与 A4b v1-v6 validator 前缀及 exact fixture 兼容。

实现 local `7f0caef63a0656ff21a571c7edb9cb7db1828d49`、remote `6d00ad4834f012e61a99431d24d2301f766d7d40`，remote parent `44488581f0853a1be7a8366881f42b6a6f65f581`，实际变更 21 paths。GitHub Actions run `33385531379` / job `99467178839` 为 `completed/success`，Typecheck、Lint、Regression tests 与 Web Export 均实际执行并成功。Sol High 独立验收结论：**P5-A5b PASS**。下一批为 **P5-A5c 中国大陆 1986–1991 历史 DST**；P5-A 与 Phase 5 仍未完成。

## 19. P5-A5c 中国大陆 1986–1991 历史 DST（Sol High 独立验收 PASS）

### 19.1 Scope、来源与规则边界

本批只关闭 `p5-a4a-bazi-historical-dst`，为八字增加中国大陆 1986–1991 历史夏令时的冻结、版本化、可审计规则和既有快照复现语义；不修改紫微、占星或六爻行为，不回写第 1～7 节的 A4a immutable registry。输入假设为 **Asia/Shanghai 官方民用钟表/北京时间**；非官方地区习惯时间不在中国大陆 v1 承诺范围内，作为残余风险记录。

来源冻结为 IANA Time Zone Database `tzdata2025b` 的 `asia` 文件 `Rule PRC` 与 `Zone Asia/Shanghai`：[release archive](https://data.iana.org/time-zones/releases/tzdata2025b.tar.gz)，精确源码提交 [7e1145bfdb9630c127841dc8ce808a937a300938](https://github.com/eggert/tz/commit/7e1145bfdb9630c127841dc8ce808a937a300938)。运行时读取仓库内静态 transition table，不依赖 OS/process timezone 或设备 tzdata。

| 年份 | 春季开始 | 秋季结束 |
|---:|---|---|
| 1986 | 1986-05-04 | 1986-09-14 |
| 1987 | 1987-04-12 | 1987-09-13 |
| 1988 | 1988-04-17 | 1988-09-11 |
| 1989 | 1989-04-16 | 1989-09-17 |
| 1990 | 1990-04-15 | 1990-09-16 |
| 1991 | 1991-04-14 | 1991-09-15 |

转换发生在当地民用 `02:00:00`：春季 `02:00–02:59` 是不存在时刻（`NONEXISTENT_LOCAL_TIME`），秋季 `01:00–01:59` 是重复时刻（`AMBIGUOUS_LOCAL_TIME`），两者均 fail-fast，不猜测。夏令时期间民用 UTC+09:00 按固定 **-60 分钟**转为 UTC+08:00 有效时刻；冬季和政策年份外保持标准时、调整量为 0。特别锁定 1988-04-17 春季边界。

### 19.2 计算顺序、快照与 overlay

八字顺序固定为：**真实 calendar validation + 1900–2099 range → lunar-to-solar → DST → true solar → day boundary → engine**。农历先转换为公历后参与 DST 比较，同时保留原始农历标签和原始民用日期时间；跨日修正后再进入真太阳时、`midnight`/`ziEarly` 日界和引擎。

新结果把 DST policy/resolution、`calculationSettings`、`inputSnapshot`、`calculationEvidence`、`ChartSnapshotMeta`、`SavedReading` 及普通/加密 backup/replay 的对应字段完整保存。旧快照继续可读，不补写历史 DST 元数据、不静默重算；future-schema 只读/写保护保持不回归。

本批采用独立 `p5-a5a-owner-decision.v3` additive overlay，累计 owner decision 前缀保持 v1=3、v2=4，v3=5，仅新增 `p5-a4a-bazi-historical-dst`；A4a immutable `41 / 18 / 15 / 5 / 2 / 1` 与 A4b v1–v6 均不变。overlay validator 对 policy/source/version/transition 逐字段校验，不能将项目自身回归提升为专业真值。

### 19.3 回归、质量与远端证据

专项回归 **8/8**，统一 `npm test` **170/170**；`npm run typecheck` PASS；`npm run lint` PASS（0 warning）；`npm run build:web` PASS（实际 8 routes，Web Export 未 skip）；`git diff --check` PASS。专项覆盖六年 start/end、冬季 0、季中 -60、spring gap、autumn overlap、solar+lunar、跨日、true-solar on/off、`midnight`/`ziEarly`、settings/input/evidence/meta/SavedReading/plain+encrypted backup、旧快照、owner overlay v1–v3，以及 `TZ=UTC`、`TZ=Asia/Shanghai` 和第三时区 deepEqual。`npm audit --omit=dev` 生产审计基线为 **0 critical / 8 high / 13 moderate / 0 low**，未升级依赖。

实现本地 `886aec930564c5399e8e67d4878ff8aee135fa28`（parent `72287ce7698a673b098badcb0a0f0e2a196e3f29`），远端 `43def88793c189313c20c959f9a23712cd2fd811`（remote parent `fa40f8a389f64b214d672e6f3dc45c3f6341ee54`），实现批次 16 paths。GitHub Actions [run 33401047517](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33401047517) / job `99517136945` 为 `completed/success`；Typecheck、Lint、Regression tests 与 Web Export 均实际执行并成功。

Sol High 独立验收结论：**P5-A5c PASS**。本批已关闭历史 DST，P5-A 仍待最终总验收与审计收口；下一步固定为 **P5-A final acceptance/audit closure**。P5-B 城市覆盖、P5-C～P5-I 发布门及非官方地区时间习惯风险仍 pending。
