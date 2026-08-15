# 观象·命盘 — 项目交接文档

> 文档状态：可作为后续产品、设计、研发和上线协作的单一交接入口  
> 更新日期：2026-08-15  
> 当前阶段：Phase 4 四术解释体验与三术深度化代码基线已完成；P5-A1 Golden Case 合同与现状盘点、P5-A2 HKO published-reference Golden、P5-A3a 真太阳时版本兼容、P5-A3b 历史真太阳时证据展示与显式当前规则复核、P5-A4a 四术边界与输入策略机器可检查审计均已通过 Sol High 独立验收；P5-A4b1 安全输入校验、错误合同与 resolution overlay 已完成实现，待 Sol High 独立预审；P5-A3 子里程碑整体完成，但整个 P5-A/Phase 5 尚未完成，尚未达到公开上线标准，实体 iPhone/TestFlight 验收仍待执行。

## 1. 一页总览

**观象·命盘**是面向中国大陆年轻用户的本地命盘与复盘工具。它不以“给一句命运结论”为目标，而是把输入条件、排盘依据、动变/宫位/相位、基础观察与历史记录放在同一条可回看的路径里。

首发产品边界已经确定：

- 覆盖八字、六爻、紫微斗数、十二星座（西方本命盘）。
- 基础排盘和规则型基础观察永久免费；首版不接 AI、不放广告、不接支付。
- 数据默认只留在设备本地；设置页支持用户主动选择普通 JSON 或密码保护的加密备份，密码不会上传，也无法由应用找回。
- 首发支持 Web 与 iPhone；界面与文案为简体中文、中国大陆场景。
- 使用“观象仪”作为原创视觉母题：曜石黑、深玉绿、旧铜金，以及克制的同心环动画。

当前结论：**页面不再只是壳子**。四个模块均能在本地生成、解释并保存结构化排盘结果；八字、紫微、占星和六爻现在都有标准化模型/证据图/版本化解释快照，解释层支持术语与原始证据展开，记录页只读展示保存时解释，历史 Diff 只比较已保存快照。P5-A1 已建立 `golden-case.v1` 四术合同、分类门禁和现状 registry；P5-A2 又加入两条 HKO published-reference：立春只按公开分钟比较、农历只按公开日期比较，均不代表四柱流派或专业真值；P5-A3a、P5-A3b 与 P5-A4a 均已通过 Sol High 独立验收，P5-A3 子里程碑整体完成；P5-A4a 已将四术边界/输入策略整理为 41 项机器可检查审计合同。Phase 3 的记录搜索/分组/对比、按日事实反馈、普通/加密备份、导入冲突预览和事务回滚仍保持有效。账号、支付、专业校验、实体设备签字与合规材料尚未完成，因此不应将当前版本作为正式公开产品提交。Phase 2 的批次记录见 [PHASE2_BAZI_EXECUTION.md](PHASE2_BAZI_EXECUTION.md)，Phase 3 的批次记录见 [PHASE3_EXECUTION.md](PHASE3_EXECUTION.md)，Phase 4 的批次记录见 [PHASE4_EXECUTION.md](PHASE4_EXECUTION.md)，P5-A1/P5-A2/P5-A3a/P5-A3b/P5-A4a 的记录见 [PHASE5_EXECUTION.md](PHASE5_EXECUTION.md)。

## 2. 已确认的产品设计草案

### 2.1 目标用户与价值

| 项目 | 已确定方向 |
|---|---|
| 目标用户 | 对八字、六爻、紫微斗数、星盘感兴趣的年轻中文用户；希望先自行了解，不必一开始为单次咨询付费。 |
| 核心价值 | 看清“输入了什么、系统如何排、为什么给出这条基础观察”，并能以后回查，而不是制造确定性的宿命结论。 |
| 语气 | 平静、具体、非恐吓；明确区分已知、推断与不可确定部分。 |
| 免费边界 | 基础排盘、盘面结构、规则型基础观察、历史回看。 |
| 后续付费方向 | 订阅可提供每日/每周/流月等内容；单次付费可提供更完整解读；AI 只在后续服务端付费能力中评估接入。 |
| 当前不做 | 广告、客户端 AI、自动上传命盘、确定性预测或替用户作现实决策。 |

### 2.2 信息架构与主路径

```text
登录原型 → 首页“观象仪” → 选择/新建命主 → 进入术数工作台
                                             ├─ 八字：四柱与关系证据
                                             ├─ 六爻：问题、用神、纳甲、动变与世应
                                             ├─ 紫微：十二宫、主星、四化与身命主
                                             └─ 星盘：行星、相位、上升/宫位（条件满足时）
                                                             ↓
                                              自动保存本地记录 → 记录页展开复查
```

命主可以保存多位。出生时辰未知时，产品不擅自补一个时辰：需要精确时辰的模块会阻止生成并说明原因；城市坐标无法识别时，西方星盘会降级为近似盘，并隐藏上升、天顶和十二宫。

### 2.3 视觉与动效方案

设计规范主文件：[design-system/guanxiang/MASTER.md](../design-system/guanxiang/MASTER.md)。模块的独立设计说明位于 `design-system/guanxiang/pages/`。

- **首页**：缓慢旋转的观象仪、四个各自带有符号纹样的模块入口；让用户先感到“进入一座可观察的仪器”，不是进入一个普通卡片工具。
- **八字**：四柱自上而下落柱，突出天干、地支、藏干、十神和柱间关系。
- **六爻**：起卦按钮触发铜钱/爻线的生成感；六爻按自上而下的阅读顺序出现，动爻、世应、用神证据单独强调。
- **紫微斗数**：十二宫盘面分区呈现，命宫、身宫、四化和主星在进入时逐层显现。
- **西方星盘**：圆盘、行星和相位线分层进入；精确盘与近似盘以明确文案和视觉状态区分。
- **通用动效**：页面内容 240–260ms 的进入过渡、按钮按压反馈、每屏至多一项环境动效；遵守系统“减少动态效果”设置。

## 3. 已完成部分（以当前代码为准）

### 3.1 体验与页面

| 能力 | 状态 | 当前实现与边界 |
|---|---|---|
| 登录入口 | 已有原型 | 手机验证码、Apple、微信三种入口均可走通本地会话；没有真实短信、Apple 或微信服务端认证。 |
| 首页与导航 | 已完成 | 深色观象仪首页、四术入口、命主与记录入口；具备响应式 Web 布局。 |
| 多命主 | 已完成 | 可新建、切换多个命主；采集姓名/关系、日期、时辰、城市、历法、农历闰月与性别。 |
| 本地保存 | 已完成 | 命主、当前选择、登录原型和排盘记录存入带 schema version 的 AsyncStorage；最近保留 100 条记录，旧版数据会启动时迁移。future schema key 会进入只读状态。 |
| 记录复查 | 已完成 | 生成结果自动归档，记录页可展开查看保存的结构化结果、基础观察、引擎版本和快照元数据；支持单条删除与清空记录。 |
| 本地数据控制 | 已完成基线 | 命主支持编辑、删除及关联记录清理；记录支持收藏筛选、按日事实反馈、删除与清空；设置页支持带版本普通 JSON 与密码保护加密备份导出/导入，导入前展示数量和重复 ID 冲突，可选择合并或替换；多 key 写入失败会回滚旧值，Storage 写保护会阻止不兼容数据被覆盖。 |
| 进入动效与无障碍 | 已完成基线 | 有内容进入与模块视觉动效；读取“减少动态效果”偏好；按键提供可访问标签。 |

### 3.2 四个排盘模块

| 模块 | 状态 | 已生成的主要数据 | 当前重要边界 |
|---|---|---|---|
| 八字 | 已可用 | 年/月/日/时四柱、十神、藏干、纳音、空亡、部分柱间关系及基础观察；支持午夜/子初日界线、地方平太阳时/视太阳时第一版和农历/闰月换算证据，并记录有效计算时刻。 | 必须提供精确出生时辰与性别；尚无流派设置，完整地点库仍待补齐。 |
| 六爻 | 已可用 | 提问、用神、纳甲、六亲、六神、世应、旺衰证据、动爻、变卦、干支时间与空亡。 | 目前为自动起卦；问题必须具体。保存的是一次生成时的结果，不提供断事结论或应期承诺。 |
| 紫微斗数 | 已可用 | 十二宫、主星/部分辅星、身宫、命宫、五行局、四化、命主和身主；标准化模型、证据图、解释快照和 Glossary。 | 必须提供精确时辰与性别；支持公历/农历及农历闰月输入，流派切换仍未做。 |
| 西方本命盘 | 已可用 | 十大行星、主要相位、太阳/月亮；精确模式含上升、天顶和宫位；两种模式都有标准化模型、证据图和解释快照。 | 精确时辰必填。城市不在内置坐标表时只生成近似盘，主动隐藏上升、天顶和宫位，不能当作完整星盘。 |

所有模块的解释均为本地规则型基础观察，不调用 AI，也不输出确定性吉凶、医疗/法律/投资建议；六爻不输出应期承诺，近似星盘不解释角点/宫位。

## 4. 当前技术实现

### 4.1 架构

- **客户端框架**：Expo SDK 57、React Native 0.86、React 19、Expo Router；同一套代码支持 Web 和 iPhone 目标。
- **状态与存储**：`src/state/app-context.tsx` 负责本地会话、命主、当前命主和排盘记录。键名为 `@guanxiang/user`、`@guanxiang/profiles`、`@guanxiang/selected-profile`、`@guanxiang/readings`。
- **排盘适配层**：`src/services/chart-engine.ts` 是稳定的公共 facade；四个独立计算器位于 `src/services/engines/`，将不同开源引擎的输出统一为应用自己的 `ChartPayload`。页面只消费这个统一数据协议，后续替换引擎时应先维护该协议。
- **可复现快照**：`ChartSnapshotMeta`、`snapshotVersion`、`calculationSettings` 和 `inputSnapshot` 会随每个 `ChartPayload` 保存；首版计算业务时区固定为 `Asia/Shanghai`，六爻还会保留 `seed`、`date` 与 `seedScope`。`SavedReading` 同步保存 `snapshotMeta`，便于迁移、导出和复盘。
- **八字可信度 P1-A～P1-F**：`src/domains/bazi/` 维护独立来源 Golden Case、节气边界解析、午夜/子初日界线、UTC-only 真太阳时修正、农历/闰月解析、八字规则设置和 `BaziCalculationEvidence`。证据会记录模型、经度、标准经线、修正分钟数、历法换算、精度和有效时刻；结果页可展开查看完整依据；旧八字记录迁移时会标为“历史默认规则”，不静默重算。
- **本地存储迁移**：`src/storage/schema.ts` 为每个 AsyncStorage 值写入 `STORAGE_SCHEMA_VERSION` 包装，兼容首版未版本化数据、未来版本阻断写回，并为旧记录补齐快照字段。读取到 future schema 的 key 会进入只读/不兼容状态，用户写操作会拒绝且不会覆盖原始值。
- **坐标数据**：`src/data/china-cities.ts` 内置 `china-cities-p1f-mainland-v1`，带 `locationId`、省市、经纬度、业务时区、来源、许可和别名；当前覆盖大陆直辖市、省会/自治区首府及常用地级市，不是全国完整地级市库。输入只做精确匹配，未知地点不猜测；数据说明见 `docs/DATASET_PROVENANCE.md`。
- **本机备份**：`src/storage/backup.ts` 定义带 `backupVersion` 和 `storageSchemaVersion` 的普通 JSON 格式；`src/storage/encrypted-backup.ts` 在相同数据格式外包一层 scrypt + AES-256-GCM，使用随机 salt/nonce 和认证标签；`src/storage/import-plan.ts` 负责导入预览、冲突分类和确定性合并/替换，`src/storage/transaction.ts` 负责多 key 写入失败回滚；`src/services/local-backup-io.ts` 在 Web 走浏览器下载/选择，在 iPhone 走临时目录与系统分享/文件选择器，在恢复前校验版本、ID 和当前命主引用。设备验收清单见 [DEVICE_ACCEPTANCE.md](DEVICE_ACCEPTANCE.md)。
- **Phase 4 解释层**：公共协议在 `src/domains/explanation/`；四术各自的 normalized/evidence/explanation 目录只处理本模块事实和规则，`ExplanationLayer` 负责统一交互；`SavedReading.explanationSnapshot` 与备份/迁移/只读 Snapshot Viewer 共同保证历史不被当前版本静默改写。
- **路由/页面**：模块工作台集中在 `src/screens/module-workspace.tsx`，记录页在 `src/screens/records-screen.tsx`，命主页在 `src/screens/profiles-screen.tsx`。

### 4.2 当前计算引擎与许可证边界

| 用途 | 当前来源 | 许可证/使用说明 |
|---|---|---|
| 八字 | `taibu-core@3.4.0/bazi` | 使用 MIT 核心包，不复制 Taibu 应用层代码。 |
| 六爻 | `taibu-core@3.4.0/liuyao+guanxiang-rng-v1` | 使用 MIT 核心包，并记录浏览器兼容的确定性随机种子实现。 |
| 紫微斗数 | `iztro@2.5.8` 浏览器 UMD 构建 | MIT；已作为直接依赖固定版本。 |
| 西方本命盘 | `circular-natal-horoscope-js@1.1.0` | Unlicense；已作为直接依赖固定版本，用于本地星体、相位和宫位计算。 |
| 研究备选 | `lunar-javascript` 等 | 许可证与固定提交记录见 [SOURCE_MANIFEST.md](../../metaphysics-app-research/SOURCE_MANIFEST.md)。 |

安装依赖后会运行 `scripts/patch-iztro.cjs`。该脚本做了两类兼容处理：

1. 修复 `iztro` 的 Metro/UMD 入口兼容问题；
2. 将 `taibu-core` 的随机种子实现替换为浏览器可用的确定性纯 JavaScript 实现，以保证六爻自动起卦可在 Web 运行。

这是当前版本最需要被后续工程负责人持续关注的技术债：补丁会在每次安装后重放，应在升级依赖后重新验证，并长期考虑向上游提交或改用无补丁的浏览器兼容方案。它不改动排盘规则，但会影响由随机种子映射出的自动起卦序列；记录中的引擎版本必须保留，才能解释和复现同一版本的结果。

## 5. 数据、隐私与内容边界

### 已落实

- 首版不配置服务端、分析 SDK、广告 SDK、支付 SDK 或 AI SDK。
- 排盘记录会保留模块、命主引用、创建时间、引擎版本、规则解释版本和完整结构化载荷，便于日后复查。
- 出生时辰缺失不猜测；城市未知不伪装为精确星盘。

### 尚未落实，不能对外承诺

- AsyncStorage 是持久化存储，不是加密保险箱；当前出生资料和记录在本机以未加密键值形式存储。schema version 只解决结构迁移，不等于加密。
- 已有用户可操作的普通 JSON 与密码保护加密备份导出、导入和清除全部本地数据；加密备份的密码不落盘且无法找回，导入冲突、合并/替换和失败回滚已实现；实体 iPhone 的文件流仍需最终签字。
- 没有正式隐私政策、用户协议、注销流程、数据导出流程、服务端审计日志或内容审核规则。
- 当前“登录”只是本地体验层，不能用于真实身份、跨端权益或找回账号。

## 6. 未完成部分与真实进度

下面的百分比按“能安全公开上线”的权重估计，不按页面数量计算。

| 里程碑 | 进度 | 已达到 | 未达到 |
|---|---:|---|---|
| M0：跨端体验骨架 | 100% | 路由、视觉系统、模块入口、本地命主、基础工程检查。 | 无。 |
| M1：确定性排盘核心 | 97% | 四类本地排盘、统一结果协议、输入边界、独立来源 Golden Case；P1-A 设置/证据骨架、P1-B 节气边界、P1-C 午夜/子初日界线、P1-D 真太阳时、P1-E 农历/闰月换算和 P1-F 可回看的完整计算依据已落地。 | 全国地级市完整覆盖、流派设置、夏令时公开样例和更多边界 Golden 回归测试。 |
| M2：本地档案与备份 | 97% | 命主与结果自动归档、记录展开查看、版本字段、快照元数据、Storage Schema Version 与首版迁移；命主/记录编辑删除与清空；带版本普通 JSON 与 scrypt + AES-256-GCM 加密备份导出/导入；收藏筛选、按日事实反馈、搜索/分组/对比、导入冲突预览和事务回滚已可持久化并回归。 | 实体 iPhone / TestFlight 文件流签字、上线前隐私与发布材料。 |
| P2：八字深度结果与证据链 | 100% | P2-A～P2-F 已完成：NormalizedBaziChart、五行/月令/根气/透干证据、Relation Graph、四类强弱证据链、`bazi-rules-v2`、三层 Evidence Explorer、历史深度快照、主动 Diff 与 Interpretation Golden Cases。 | 后续流派/格局扩展必须沿同一分层架构增量开发，并递增解释版本。 |
| P4：四术解释体验与三术深度化 | 100% 代码基线 | P4-A～P4-H 已完成：公共解释协议、四术解释快照、紫微/占星/六爻标准化模型与证据图、Glossary、统一解释 UI、历史快照 Diff、四模块 Golden 与备份 deepEqual；最终 GitHub Actions 已绿色 Success。 | 真实 iPhone/TestFlight 文件流、上线前合规与账号/商业化仍未完成。 |
| P5-A1：四术 Golden Case 合同与现状盘点 | 独立验收 PASS | `golden-case.v1` 合同、完整纯 JSON/runtime validator、全局 ID 门禁、从 `BAZI_GOLDEN_CASES` 映射的 2 条八字技术性交叉验证、8 条 regression-only 清单和 9 项回归测试；两次远端 CI 均 Success 且 Web Export 实际执行。 | 节气/子初/闰月/跨日/未知输入等边界的外部来源或人工复核仍未完成；不代表专业真值。 |
| P5-A2：HKO published-reference Golden | Sol High 独立验收 PASS | 新增 2 条 HKO 公开资料 fixture（立春 `2024-02-04 16:27` 分钟比较、农历正月初一对应 `2024-02-10` 日期比较）、4 项离线测试；registry 12 条，`npm test` 87/87。主管本地复跑 typecheck/lint/npm test/build:web 全部通过；本地 `a9efd1b05d4a2387a8375b7bd5cc913cc136d232`、远端等价 `3ffdda0caa8fd4b7c91aef45f65c63ad22f815bb`，CI run `31869188065` completed/success，Regression tests 与 Web Export 均实际执行并 success。 | HKO 资料不验证应用秒值或八字流派；真太阳时来源标签是 P5-A2 历史风险，已由负责人选择的 P5-A3a 方案 A handoff 处理；整个 P5-A/Phase 5 仍未完成。 |
| P5-A3a：真太阳时版本兼容与 Storage Schema 3 | Sol High 独立验收 PASS | 方案 A：新计算 NOAA v2；旧 v1 仅用于历史复现；legacy-unknown 不伪造证据、不用于实际计算。证据保存 raw/display/applied 修正、舍入规则、来源/版本/NOAA URL；schema2→3、普通/加密旧备份和 schema3 malformed 深字段均只做无计算迁移；99 项统一回归覆盖跨 TZ、数值、边界、unknown、普通/加密 roundtrip、merge/replace 与 settings 一致性。初始 local `51fcd3bd8b7938e54f6604785544574115e34733` / remote `2da65c0928aa23af0ed1fabb36de3008a23ff5d5` / CI `31872612966`；修复 local `4ed5081354747cc4b4a342552436d0263780f0ff` / remote `a3e7193d2a0b1c9c4de7b3d9e859a0eb61983459` / CI `31873458023`。 | P5-A3b 已按主管授权完成实现并验收，P5-A3 子里程碑已完成；整个 P5-A 与 Phase 5 未完成。 |
| P5-A3b：历史真太阳时证据展示与显式当前规则复核 | Sol High 独立验收 PASS | 记录页只读取已保存 payload/snapshotMeta/evidence/interpretation；状态区分 NOAA v2、v1（非 NOAA，仅历史复现）、unknown、未启用；实时依据展示 raw/display/applied、舍入、来源/URL、归一化民用时刻和最终有效计算时刻；显式点击才以内存生成强制 v2 的当前结果与 Diff，不保存、不覆盖历史；设置/证据冲突、缺时辰、缺经度和缺深度快照均有明确语义。新增 5 项回归，统一 `npm test` 104/104，Web Export 8 routes。候选实现 local `30f2db2c164bd1cac709025a340e91f32a3fa147` / remote `baea5f6e53bcc52564fd7b7e375cc4e70463398f` / CI `31875157338`；账本修复 local `1189f5e9d7ed6001ac8ce132e8ee69b79435c052` / remote `c5bc6f04a0b6ddc1f43233d88c061a7efeccebfb` / CI `31876037500`，两次 CI 均 completed/success 且 Regression tests 与 Web Export 实际执行。主管独立审阅纯 helper、UI 接入、records replay 调用链、SavedReading 不变性、最终 `effectiveCalculationTime` 优先级、scope/白名单，并独立重跑 104/104 与 Web Export 8 routes，全部 PASS。 | P5-A3b 已验收；不代表整个 P5-A 或 Phase 5 完成。 |
| P5-A4a：四术边界与输入策略机器可检查审计 | Sol High 独立验收 PASS | 新增纯 JSON `p5-a4a-boundary-input.v1` 合同与 runtime validator，覆盖八字 10、紫微 9、占星 8、六爻 9、跨模块 5，共 41 项；状态为 covered 18、gap 15、decision-required 5、not-applicable 2、routed-p5-b 1，全部 regression-only。新增 8 项回归并接入统一 `npm test`，只盘点/建门禁，不改算法、UI、Storage、备份、依赖或城市数据。已确认占星未知坐标 0,0 会改变行星位置、跨模块无猜测尚未闭环、紫微/占星普通非法公历日期是 P5-A4b gap；error taxonomy/contract 进入 P5-A4b，UI/读屏 copy 进入 P5-C；5 个 contract cases 归并为 4 个 owner decisions（八字日期范围、紫微/占星日期范围、历史 DST、占星缺时辰近似）。实现 local `2cf82d402e2f840ebf7c29bf47ee3b167fab9688` / remote `c7055e8962b3b21dd8b78c8f5c64769e9528daf0`；CI `31879638540` completed/success，Typecheck、Lint、Regression tests 与 Web Export 均实际执行；主管独立复跑 112/112 与 Web Export 8 routes PASS。 | 当前不关闭 P5-A；P5-A4b、P5-B、P5-C 和 owner 决策仍需后续授权。 |
| P5-A4b1：安全输入校验、可识别错误与 resolution overlay | 实现完成，待 Sol High 独立预审 | 新增 `ChartInputError`（`input-validation`、`INVALID_GREGORIAN_DATE`、`INVALID_BIRTH_COORDINATES`）、严格宿主 TZ 无关 Gregorian validator、Astrology 显式坐标 pair/finite/range 校验，以及纯 JSON `p5-a4b-input-resolution.v1` 三项 overlay；Ziwei lunar 不被 Gregorian validator 拦截，两坐标缺失仍保留 A4a 的 unknown-city/`0,0` gap。新增 8 项回归接入统一 `npm test`，A4a registry/41 项统计不变。当前预审：`git diff --check`、typecheck、lint、`npm test` 120/120、`build:web` 8 routes 均 PASS。 | 只关闭三项安全 gap；cross error taxonomy、0,0、日期范围、DST、缺时辰及其余 gap/decision-required 未完成，P5-A/Phase 5 仍未完成。 |
| M3：中国大陆真实账号 | 5% | 三种登录入口的界面与本地流程。 | 短信、Apple、微信认证，手机号绑定，权益同步，账户安全与注销。 |
| M4：商业化和 AI | 0% | 产品边界已确定。 | 支付、订阅、单次付费、服务端权益、AI 成本控制、内容安全。 |
| 正式公开上线准备度 | 约 35% | 可演示、可进行小范围内部体验。 | 账号、隐私合规、数据保护、设备发布、质量基线和运营能力均未闭环。 |

## 7. 已验证的证据

截至本次交接，以下检查已通过：

- `npm run typecheck`
- `npm run lint`
- `npm test`（四模块固定样例、P1-A～P1-F、P2-A～P2-F、P3-A～P3-F、P4-A～P4-H 解释/证据/Golden/历史/备份回归、城市精确匹配、缺失时辰、六爻复现、真实用户写操作写保护、P5-A1/P5-A2/P5-A3a 兼容回归、P5-A3b 复核展示、P5-A4a 边界审计及 P5-A4b1 输入校验回归，共 120 项测试；当前预审 120/120 PASS）
- `npm run build:web`（静态 Web 构建成功，8 条路由；本批 Web Export 实际执行并 PASS）
- P5-A3a 两次 GitHub Actions 均为 `completed/success`；最终 run `31873458023` 的 Regression tests 与 Web export 均实际执行并 success。
- P5-A3b 候选实现本地 `30f2db2c164bd1cac709025a340e91f32a3fa147`、远端等价 `baea5f6e53bcc52564fd7b7e375cc4e70463398f`；[CI run 31875157338](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31875157338) 为 `completed/success`，Regression tests 与 Web Export 均实际执行并成功。账本修复本地 `1189f5e9d7ed6001ac8ce132e8ee69b79435c052`、远端等价 `c5bc6f04a0b6ddc1f43233d88c061a7efeccebfb`；[CI run 31876037500](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31876037500) 同为 `completed/success`，Regression tests 与 Web Export 均实际执行并成功。主管初审及最终独立验收本地 diff check/typecheck/lint/104/104/build 8 routes 均 PASS。
- P5-A4a 实现 local `2cf82d402e2f840ebf7c29bf47ee3b167fab9688`、remote `c7055e8962b3b21dd8b78c8f5c64769e9528daf0`；[CI run 31879638540](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31879638540) 为 `completed/success`，Typecheck、Lint、Regression tests 与 Web Export 均实际执行并 Success。主管独立复跑 `git diff --check`、typecheck、lint、`npm test`（112/112）和 `build:web`（8 routes），全部 PASS。唯一非阻断 warning 是 runner 将 `actions/checkout@v4`、`actions/setup-node@v4` 的 Node 20 action runtime 强制为 Node 24；登记为后续 CI maintenance，本批不修改 workflow。
- P5-A4b1 当前尚未提交/推送；预审已执行 `git diff --check`、`npm run typecheck`、`npm run lint`、`npm test`（120/120）和 `npm run build:web`（8 routes，Web Export 实际执行）。Expo SDK 57 exact docs 已核对，本批没有使用 Expo API。
- GitHub Actions CI：安装依赖后自动执行 typecheck、lint、npm test 和 Web 构建；Web Export 使用 `always()`，不会因测试失败被跳过。
- 浏览器手工走查：首页、八字落柱、六爻起卦、紫微十二宫、星盘精确/近似分支、自动保存及记录展开；文件导出/选择与导入预览的具体签字项见 [DEVICE_ACCEPTANCE.md](DEVICE_ACCEPTANCE.md)。
- 视觉与响应式基线已检查过 375px、手机横屏和 1440px；正式发布前仍必须在实际 iPhone 上做全量回归。

已知依赖审计基线记录在 [SECURITY_NOTES.md](SECURITY_NOTES.md)：2026-08-15 复核 `npm audit --omit=dev` 结果仍为 0 critical、18 high、10 moderate、0 low；当前 findings 主要来自 Expo/Metro/React Native 运行依赖链及其传递依赖。自动修复会建议不兼容的大版本降级，因此未执行强制修复。提交前仍需在兼容的 Expo SDK 57 补丁升级后重新审计。

## 8. 上线前必须完成的工作

### P0：先让“结果可信且可复核”

1. 建立四模块的金标准样例集：包含节气边界、子初、农历闰月、跨日、未知时辰、城市不命中、时区和六爻固定种子。
2. 为 `chart-engine.ts` 写自动化回归测试；每次升级 `taibu-core`、`iztro` 或星盘库都必须跑样例对比。
3. 设计并实现流派选择；子初换日、真太阳时和农历换算已完成第一版，继续补默认策略与更多公开来源样例。
4. 把中国大陆城市坐标扩充为完整、可维护的离线数据源，并注明来源、版本和覆盖规则。

### P0：先补齐本地数据安全与用户控制

1. ~~实现命主与记录的编辑、删除、清空与二次确认。~~ 已完成首版本地控制；收藏与按日事实反馈已补齐，仍待更细的操作审计。
2. 已完成普通 JSON 与密码加密备份的设备迁移冲突策略、导入预览和失败回滚；按 [DEVICE_ACCEPTANCE.md](DEVICE_ACCEPTANCE.md) 完成 Web 手工与 iPhone 真机文件导出、分享、选择和恢复签字。
3. 在首次使用前呈现数据本地保存说明、风险提示和删除入口；准备隐私政策与用户协议。

### P0：首发 Web/iPhone 质量门槛

1. 在真机 iPhone 进行登录、命主、四模块、记录、深色模式、低网/离线、字体缩放和“减少动态效果”测试。
2. 确认 App Store 的正式 Bundle ID、开发者主体、图标、截图、隐私清单和年龄分级；当前 `com.guanxiang.mingpan` 仅是工程配置，不应视为已注册品牌或已可提交的标识。
3. 复跑安全审计，处理所有 high/critical；对第三方许可证做发布前清单和法务/合规复核。

### P1：账号与可选同步

1. 选择中国大陆短信服务商和账户后端。
2. 接入 Apple 登录、微信登录，并要求绑定手机号；权益可跨端同步，命盘和出生资料默认不自动同步。
3. 实现账号注销、数据导出、设备迁移和服务端审计。

### P2：商业化与 AI（在付费能力稳定后）

1. 接入订阅和单次付费接口，免费基础排盘永久保留。
2. 服务端发放和校验权益，避免仅客户端判断订阅状态。
3. 仅把 AI 放到付费服务端能力中，设定单次成本上限、缓存、限流、可解释输入和内容安全规则；不得把出生资料无告知地发送给模型供应商。

## 9. 建议的下一轮执行顺序

1. **P5-0 项目总账本与 Phase 5 启动基线**已完成：以 [PROJECT_MASTER_EXECUTION.md](PROJECT_MASTER_EXECUTION.md) 作为后续批次入口，保留当前 Phase 0～4 代码事实，不回退已完成能力。
2. **P5-A1：四术 Golden Case 统一合同、分类门禁与现状盘点**、**P5-A2：HKO published-reference Golden** 均已实现并通过主管独立验收。城市覆盖属于 P5-B，不在本小批；HKO 两条 fixture 只比较公开精度，不提升流派真值等级。
3. **P5-A3a、P5-A3b 与 P5-A4a 均已经 Sol High 独立验收 PASS**：方案 A 为新计算 NOAA v2、旧 v1 仅历史复现、unknown 不伪造证据；P5-A3b 的记录页显式复核/UI 展示不是新的 owner 决策门，已按主管授权完成实现并验收，P5-A3 子里程碑整体完成；P5-A4a 已完成四术边界与输入策略审计合同、机器门禁和现状事实登记。真实 gap、decision-required 和 P5-B/P5-C 路由已登记，未在本批修算法或 UI。UX/可访问性、性能稳定性、Release Security、隐私合规、Web、iPhone/TestFlight 和 App Store 材料各自保留独立 DoD。只有相关 schema、dataset、rules、interpretation 或 explanation 发生兼容性变化时才评估并递增版本，不能无条件递增。
4. **完成 Phase 5 后进入 OWNER DECISION**：明确公开版本继续本地入口，还是首发前先完成真实账号；该决定不能由执行者默认推断。
5. **若选择首发前真实账号，按独立 Phase 6 推进真实账号与可选权益；若选择公开版本地入口，则 Level A 发布门仍需先完成 Phase 5 证据。** Phase 7 的订阅、单次付费和付费 AI 只在后续条件满足后推进，基础版继续不依赖 AI、广告或支付。

详细的 Phase 5 批次图、DoD、风险和统一验收模板见 [PROJECT_MASTER_EXECUTION.md](PROJECT_MASTER_EXECUTION.md)。

## 10. 日常运行与维护

工程根目录：`D:\RJ\codex\guanxiang-mingpan`

```bash
npm install
npm run web
```

要求 Node.js 22.13 或更高版本。常用质量命令：

```bash
npm run typecheck
npm run lint
npm run build:web
npm audit --omit=dev --json
```

`npm install` 会自动执行兼容补丁。若排盘相关依赖升级、删除 `node_modules` 或更换锁文件，必须先确认补丁运行成功，再跑四模块金标准测试和 Web/iPhone 回归。

## 11. 交接时需要保留的决策

- 名称采用“观象·命盘”，不是“观象”。
- 视觉应保持原创的观象仪语言，不复制参考视频或第三方产品的品牌、布局、文案、素材。
- 免费基础功能不接 AI；后续 AI 只能在用户付费且明确知情的服务端方案中加入。
- 首发不放广告，不接支付；先预留接口和产品结构。
- 首发数据本地优先，用户未来自行选择备份；跨平台未来只共享账号权益，不默认同步命盘资料。
- 出生时辰未知时，最多按日级别或部分盘展示，并明确偏差来源，绝不伪造精确度。

## 12. 相关文件索引

- [README.md](../README.md)：快速启动、当前能力和基础数据边界。
- [ROADMAP.md](ROADMAP.md)：路线图与重大决策门槛。
- [PROJECT_MASTER_EXECUTION.md](PROJECT_MASTER_EXECUTION.md)：Phase 5 总账本、批次图、风险与验收模板。
- [PHASE5_EXECUTION.md](PHASE5_EXECUTION.md)：P5-A1 Golden Case 合同、P5-A2 HKO published-reference、P5-A3 版本兼容/历史复核、P5-A4a 边界审计、P5-A4b1 输入校验和测试证据。
- [P5_A_BOUNDARY_AUDIT.md](P5_A_BOUNDARY_AUDIT.md)：P5-A4a 四术边界与输入策略审计矩阵、P5-A4b1 overlay、gap、决策门和后续路由。
- [SECURITY_NOTES.md](SECURITY_NOTES.md)：依赖审计基线。
- [设计系统主规范](../design-system/guanxiang/MASTER.md)：色彩、字体、动效、无障碍和产品语气。
- [开源方案清单](../../metaphysics-app-research/SOURCE_MANIFEST.md)：固定提交、许可证与采用边界。
- `src/services/chart-engine.ts`：四模块统一计算适配层。
- `src/state/app-context.tsx`：本地数据与会话的当前实现。

---

**交接判断**：当前代码适合继续做“排盘可信度 + 本地档案体验”的开发和内部试用；任何正式发布、真实登录、付费、AI 或将出生数据上云的决策，都应在本文件第 8 节的 P0 项完成并单独评审后执行。
