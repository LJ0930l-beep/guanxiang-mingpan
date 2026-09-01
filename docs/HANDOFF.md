# 观象·命盘 — 项目交接文档

> 文档状态：可作为后续产品、设计、研发和上线协作的单一交接入口  
> 更新日期：2026-09-02
> 当前收口：P5-A final 已由 Sol High/主管最终验收 PASS；`p5-a4a-cross-a11y-copy-route` 保持独立 P5-C deferred/routed disposition，功能尚未实现；`p5-a4a-cross-city-coverage` 继续路由 P5-B；下一批为 P5-B1 合同/来源/许可审计。
> 当前阶段：Phase 4 四术解释体验与三术深度化代码基线已完成；P5-A1 Golden Case 合同与现状盘点、P5-A2 HKO published-reference Golden、P5-A3a 真太阳时版本兼容、P5-A3b 历史真太阳时证据展示与显式当前规则复核、P5-A4a 四术边界与输入策略机器可检查审计、P5-A4b1 安全输入校验/错误合同/resolution overlay、P5-A4b2 六爻 seed/date 输入合同与跨宿主 TZ 复现、P5-A4b3 八字真太阳时跨日/子初边界矩阵与 cumulative overlay、P5-A4b4 紫微农历/闰月输入校验与 cumulative overlay、P5-A4b5 四模块 engine failures 与跨模块失败契约、P5-A5a 统一公开出生日期政策与独立 owner-decision overlay、P5-A5b Astrology 日级近似与缺坐标 fail-closed、P5-A5c 中国大陆 1986–1991 历史 DST 及 P5-A final 均已通过 Sol High/主管独立验收；P5-A3 子里程碑整体完成，P5-A 已完成；P5-C 功能、P5-B 城市覆盖及整个 Phase 5 尚未完成，尚未达到公开上线标准，实体 iPhone/TestFlight 验收仍待执行。

## 1. 一页总览

**观象·命盘**是面向中国大陆年轻用户的本地命盘与复盘工具。它不以“给一句命运结论”为目标，而是把输入条件、排盘依据、动变/宫位/相位、基础观察与历史记录放在同一条可回看的路径里。

首发产品边界已经确定：

- 覆盖八字、六爻、紫微斗数、十二星座（西方本命盘）。
- 基础排盘和规则型基础观察永久免费；首版不接 AI、不放广告、不接支付。
- 数据默认只留在设备本地；设置页支持用户主动选择普通 JSON 或密码保护的加密备份，密码不会上传，也无法由应用找回。
- 首发支持 Web 与 iPhone；界面与文案为简体中文、中国大陆场景。
- 使用“观象仪”作为原创视觉母题：曜石黑、深玉绿、旧铜金，以及克制的同心环动画。

当前结论：**页面不再只是壳子**。四个模块均能在本地生成、解释并保存结构化排盘结果；八字、紫微、占星和六爻现在都有标准化模型/证据图/版本化解释快照，解释层支持术语与原始证据展开，记录页只读展示保存时解释，历史 Diff 只比较已保存快照。P5-A1 已建立 `golden-case.v1` 四术合同、分类门禁和现状 registry；P5-A2 又加入两条 HKO published-reference：立春只按公开分钟比较、农历只按公开日期比较，均不代表四柱流派或专业真值；P5-A3a、P5-A3b、P5-A4a、P5-A4b1、P5-A4b2、P5-A4b3、P5-A4b4、P5-A4b5、P5-A5a、P5-A5b 与 P5-A5c 均已通过 Sol High 独立验收，P5-A3 子里程碑整体完成；P5-A4a 已将四术边界/输入策略整理为 41 项机器可检查审计合同，P5-A4b1 已关闭三项安全输入 gap，P5-A4b2 已关闭六爻 date/seed 两项 gap 并将 overlay 累计到五项，P5-A4b3 已关闭八字真太阳时跨日/子初边界 gap 并将 overlay 累计到六项，P5-A4b4 已关闭紫微农历与闰月输入 gap 并将 overlay 累计到八项，P5-A4b5 已以 v5 overlay 关闭四模块 engine-error/cross-copy gap，P5-A5a 已以 `p5-a5a-owner-decision.v1` 关闭三项公开日期范围决策并统一 1900-01-01..2099-12-31（含端点），P5-A5b 已由 owner-decision v2 新增缺时辰日级近似策略，并由 A4b v6 关闭缺坐标/跨模块 no-guessing gap，P5-A5c 已由 owner-decision v3 关闭中国大陆 1986–1991 历史 DST。日级近似固定 Asia/Shanghai 正午锚点与日首/日末稳定性筛选，输出 `partial`、隐藏角点/宫位/相位和不稳定时间敏感因素；未知城市或无成对坐标 fail-fast，不再传入 `0,0`。P5-A5c 另固定 Asia/Shanghai 官方民用钟表/北京时间假设，春季不存在时刻和秋季重复时刻均 fail-fast，运行时不依赖 OS/process tzdata。P5-A final 已完成最终 supervisor acceptance，既有 A4a/A4b/owner overlay 与统计保持不变；`p5-a4a-cross-a11y-copy-route` 仅为 P5-C deferred/routed，功能尚未实现，`p5-a4a-cross-city-coverage` 继续路由 P5-B。Phase 3 的记录搜索/分组/对比、按日事实反馈、普通/加密备份、导入冲突预览和事务回滚仍保持有效。账号、支付、专业校验、实体设备签字与合规材料尚未完成，因此不应将当前版本作为正式公开产品提交。Phase 2 的批次记录见 [PHASE2_BAZI_EXECUTION.md](PHASE2_BAZI_EXECUTION.md)，Phase 3 的批次记录见 [PHASE3_EXECUTION.md](PHASE3_EXECUTION.md)，Phase 4 的批次记录见 [PHASE4_EXECUTION.md](PHASE4_EXECUTION.md)，P5-A1/P5-A2/P5-A3a/P5-A3b/P5-A4a/P5-A4b1/P5-A4b2/P5-A4b3/P5-A4b4/P5-A4b5/P5-A5a/P5-A5b/P5-A5c 的记录见 [PHASE5_EXECUTION.md](PHASE5_EXECUTION.md)。

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

命主可以保存多位。出生时辰未知时，产品不擅自补一个时辰：八字、紫微等需要精确时辰的模块会阻止生成并说明原因；西方星盘采用固定 Asia/Shanghai 正午锚点的日级近似，先做日首/日末星座稳定性筛选，再只展示能诚实标注为日期级的字段，并隐藏上升、天顶、宫位、角点、相位及不稳定时间敏感因素。城市坐标无法识别且没有显式成对经纬度时，星盘 fail-fast 要求补充城市或坐标。

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
| 西方本命盘 | 已可用 | 十大行星、主要相位、太阳/月亮；精确模式含上升、天顶和宫位；未知时辰为固定锚点的日级近似，只保留全天稳定字段；两种模式都有标准化模型、证据图和解释快照。 | 精确模式需要时辰和有效地点；未知时辰结果为 `partial`，隐藏上升、天顶、宫位、角点、相位与不稳定因素；未知城市且无成对坐标时 fail-fast，不猜测地点。 |

所有模块的解释均为本地规则型基础观察，不调用 AI，也不输出确定性吉凶、医疗/法律/投资建议；六爻不输出应期承诺，近似星盘不解释角点/宫位。

## 4. 当前技术实现

### 4.1 架构

- **客户端框架**：Expo SDK 57、React Native 0.86、React 19、Expo Router；同一套代码支持 Web 和 iPhone 目标。
- **状态与存储**：`src/state/app-context.tsx` 负责本地会话、命主、当前命主和排盘记录。键名为 `@guanxiang/user`、`@guanxiang/profiles`、`@guanxiang/selected-profile`、`@guanxiang/readings`。
- **排盘适配层**：`src/services/chart-engine.ts` 是稳定的公共 facade；四个独立计算器位于 `src/services/engines/`，将不同开源引擎的输出统一为应用自己的 `ChartPayload`。页面只消费这个统一数据协议，后续替换引擎时应先维护该协议。
- **可复现快照**：`ChartSnapshotMeta`、`snapshotVersion`、`calculationSettings` 和 `inputSnapshot` 会随每个 `ChartPayload` 保存；首版计算业务时区固定为 `Asia/Shanghai`，六爻还会保留 `seed`、`date` 与 `seedScope`，Astrology 新结果还保留 exact/date-level-approximate、锚点/规则版本和 location source/policy。`SavedReading` 同步保存 `snapshotMeta`，便于迁移、导出和复盘；旧快照缺失该政策时只读兼容，不补写或静默重算。
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
- 出生时辰缺失不猜测：Astrology 只提供标明偏差的日级近似；城市未知且无成对坐标时 fail-fast，不伪装为精确星盘或传入 `0,0`。

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
| P5-A4a：四术边界与输入策略机器可检查审计 | Sol High 独立验收 PASS | 新增纯 JSON `p5-a4a-boundary-input.v1` 合同与 runtime validator，覆盖八字 10、紫微 9、占星 8、六爻 9、跨模块 5，共 41 项；状态为 covered 18、gap 15、decision-required 5、not-applicable 2、routed-p5-b 1，全部 regression-only。新增 8 项回归并接入统一 `npm test`，只盘点/建门禁，不改算法、UI、Storage、备份、依赖或城市数据。已确认占星未知坐标 0,0 会改变行星位置、跨模块无猜测尚未闭环、紫微/占星普通非法公历日期是 P5-A4b gap；cross error taxonomy/contract 仍未完成，后续批次另行授权，UI/读屏 copy 进入 P5-C；5 个 contract cases 归并为 4 个 owner decisions（八字日期范围、紫微/占星日期范围、历史 DST、占星缺时辰近似）。实现 local `2cf82d402e2f840ebf7c29bf47ee3b167fab9688` / remote `c7055e8962b3b21dd8b78c8f5c64769e9528daf0`；CI `31879638540` completed/success，Typecheck、Lint、Regression tests 与 Web Export 均实际执行；主管独立复跑 112/112 与 Web Export 8 routes PASS。 | 当前不关闭 P5-A；P5-A4b、P5-B、P5-C 和 owner 决策仍需后续授权。 |
| P5-A4b1：安全输入校验、可识别错误与 resolution overlay | Sol High 独立验收 PASS | 新增 `ChartInputError`（`input-validation`、`INVALID_GREGORIAN_DATE`、`INVALID_BIRTH_COORDINATES`）、严格宿主 TZ 无关 Gregorian validator、Astrology 显式坐标 pair/finite/range 校验，以及纯 JSON `p5-a4b-input-resolution.v1` 三项 overlay；Ziwei lunar 不被 Gregorian validator 拦截，两坐标缺失仍保留 A4a 的 unknown-city/`0,0` gap。新增 8 项回归接入统一 `npm test`，A4a registry/41 项统计不变。实现 local `0d279c677c1c05eb2492f9ae3b779267feb8b165` / remote `8ab5c6981c89590f6f19fabdc688c34ae60650ed`；CI run `31882220415` completed/success，Typecheck、Lint、Regression tests 与 Web Export 均实际执行；主管本地 `git diff --check`、typecheck、lint、`npm test` 120/120、`build:web` 8 routes 均 PASS。 | 只关闭三项安全 gap；cross error taxonomy、0,0、日期范围、DST、缺时辰及其余 gap/decision-required 未完成，P5-A/Phase 5 仍未完成。 |
| P5-A4b2：六爻 seed/date 输入合同与跨宿主 TZ 复现 | Sol High 独立验收 PASS | `ChartInputError` 增加 `INVALID_LIUYAO_DATE`/`INVALID_LIUYAO_SEED`；严格 civil date/offset 校验、原始 Unicode seed 1～256 长度校验和自动 seed 验证；v1 三项 overlay 保持不变，v2 `p5-a4b-input-resolution.v2` 累计五项且纯 JSON/唯一/关联原始 gap 与 `P5-A4b`。新增 8 项回归，统一 `npm test` 128/128；覆盖 local/seconds/millis、Z/`+08:00`/`+0800`、非法 date/seed 矩阵、Unicode payload/inputSnapshot、deepEqual 和 UTC/Asia/Shanghai 宿主一致性。实现 local `0815612cb8e2261325828ccf0d07e51525f34280` / remote `a976b4f07a2d516713db10cb2c0f2b53c98aa51a`；GitHub Actions run `31884436927` completed/success，validate job `95011564415` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功；主管本地独立门禁 128/128、Web Export 8 routes 均 PASS。 | 本批只关闭六爻 date/seed 两项；六爻 engine/cross taxonomy、0,0、日期范围、DST、缺时辰、owner decisions 及其他 gap/decision-required 未完成，P5-A/Phase 5 仍未完成。 |
| P5-A4b3：八字真太阳时跨日/子初边界矩阵与 cumulative overlay | Sol High 独立验收 PASS | 新增 regression-only 135°E / 75°E 标准经线两侧矩阵，覆盖正负修正、民用跨日前后、`midnight` / `ziEarly` 和 UTC/Asia/Shanghai deepEqual；新增 `p5-a4b-input-resolution.v3` 六项并保持 v1/v2 前缀、纯 JSON、唯一 ID、原始 gap/`P5-A4b` 关联。实现 local `53a3c46a1145a10f78f7f193df9b6e01dc12bbeb` / remote `c2daaf5691980da3faa839df4847680331d90b53`；GitHub Actions run `33352537186` completed/success，validate job `99368535197` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功；Luna Max 本地 `npm test` 132/132、Web Export 8 routes，`git diff --check`、typecheck、lint 均通过。 | 本批只关闭八字真太阳时跨日/子初边界 gap；六爻 engine/cross taxonomy、unknown-coordinate `0,0`、公开日期范围、1986–1991 DST、缺时辰、owner decisions 及其余 gap/decision-required 未完成，P5-A/Phase 5 仍未完成。 |
| P5-A4b4：紫微农历/闰月输入校验与 cumulative overlay | Sol High 独立验收 PASS | 只关闭 `p5-a4a-ziwei-lunar-input` 与 `p5-a4a-ziwei-leap-month`；固定 `lunar-javascript@1.7.7` 进行普通农历/有效闰月/无效闰月组合/无效农历日期 fail-fast 校验，农历路径不套用 Gregorian 校验；v4 overlay 累计 v1=3/v2=5/v3=6/v4=8，保留 v1/v2/v3 exports、顺序前缀与 validator，并新增 v4 validator。实现 local `62697525875a6214b19b447c1d08753bfdb18d75` / remote `306fdcdc89090f2c3c018ab8a25c5938b1e74195`，remote parent `e41513d3343c7d081bd17d06521c9410139286ab`；GitHub Actions run `33357809089`、validate job `99383188584` completed/success，Typecheck、Lint、Regression tests 与 Web export 均实际执行，主管本地 `npm test` 139/139、Web Export 8 routes。 | 本批不改算法/公式、UI、Storage/schema、依赖或 CI；A4a `41 / 18 / 15 / 5 / 2 / 1` 与 Astrology `0,0` probe 保持，日期范围、DST、未知时辰、engine/cross taxonomy 和 owner decisions 仍未完成；P5-A/Phase 5 仍未完成。 |
| P5-A5a：统一公开出生日期政策 | Sol High 独立验收 PASS | 负责人确认 `cn-mainland-public-birth-date-range.v1`，八字/紫微/占星公开出生日期统一 inclusive `1900-01-01..2099-12-31`；范围外 fail-fast；独立 `p5-a5a-owner-decision.v1` overlay 关闭 `p5-a4a-bazi-supported-date-range`、`p5-a4a-ziwei-date-range`、`p5-a4a-astrology-date-range`。政策边界进入 `calculationSettings`、`inputSnapshot`、`ChartSnapshotMeta`、`SavedReading` 与 backup roundtrip；旧快照不补写，A4a immutable 统计与 A4b v1-v5 不变。统一测试 155/155，专项 9/9，TZ deepEqual，2099 三模块可计算，Web 8 routes，生产 audit 0 critical/8 high/13 moderate/0 low。 | 仅关闭三项日期决策；DST、Astrology 缺时辰/`0,0` no-guessing 和其余 P5-A/Phase 5 发布门仍未完成。该行保留 P5-A5a 当时的下一批记录。 |
| P5-A5b：Astrology 日级近似与缺坐标 fail-closed | Sol High 独立验收 PASS | 负责人确认未知时辰采用固定 `Asia/Shanghai` 正午 `12:00:00` 锚点，并比较日首/日末稳定性；结果标记 `date-level-approximate`/`partial`，仅保留全天稳定字段，隐藏 Ascendant、Midheaven、houses、angles、aspects、逆行和不稳定快速因素。显式成对坐标优先、城市数据次之；未知城市或无成对坐标返回 `MISSING_BIRTH_COORDINATES`（field `birthCity`），不再传入 `0,0`。`p5-a5a-owner-decision.v2` 累计 4 项，仅新增缺时辰 decision；`p5-a4b-input-resolution.v6` 累计 14 项，关闭缺坐标与跨模块 no-guessing 两个原始 gap。政策 metadata 进入 `calculationSettings`、`inputSnapshot`、`ChartSnapshotMeta`、`SavedReading`、backup/replay；旧快照不补写。专项 7/7、统一测试 162/162、TZ deepEqual、Web 8 routes、生产 audit 0 critical/8 high/13 moderate/0 low 均 PASS。实现 local `7f0caef63a0656ff21a571c7edb9cb7db1828d49` / remote `6d00ad4834f012e61a99431d24d2301f766d7d40`，remote parent `44488581f0853a1be7a8366881f42b6a6f65f581`；Actions run/job `33385531379`/`99467178839` 全部 Success。A4a immutable `41 / 18 / 15 / 5 / 2 / 1` 与历史 `0,0` probe 不变。 | 本批关闭 `p5-a4a-astrology-missing-time`、`p5-a4a-astrology-missing-coordinate`、`p5-a4a-cross-no-guessing`；P5-A5c 历史 DST、城市覆盖、UI/a11y 与其他 P5-A/Phase 5 发布门仍未完成。 |
| P5-A5c：中国大陆 1986–1991 历史 DST | Sol High 独立验收 PASS | 只关闭 `p5-a4a-bazi-historical-dst`；冻结 `tzdata2025b` `Rule PRC`/`Asia/Shanghai` 官方民用钟表规则，专项 8/8，统一 `npm test` 170/170，Web Export 8 routes，生产 audit 0 critical/8 high/13 moderate/0 low。 | P5-A5c 已收口；非官方地区习惯时间、城市覆盖和 P5-C UX/a11y 仍保留独立路由。 |
| M3：中国大陆真实账号 | 5% | 三种登录入口的界面与本地流程。 | 短信、Apple、微信认证，手机号绑定，权益同步，账户安全与注销。 |
| M4：商业化和 AI | 0% | 产品边界已确定。 | 支付、订阅、单次付费、服务端权益、AI 成本控制、内容安全。 |
| 正式公开上线准备度 | 约 35% | 可演示、可进行小范围内部体验。 | 账号、隐私合规、数据保护、设备发布、质量基线和运营能力均未闭环。 |

## 7. 已验证的证据

截至本次交接，以下检查已通过：

- `npm run typecheck`
- `npm run lint`
- `npm test`（四模块固定样例、P1-A～P1-F、P2-A～P2-F、P3-A～P3-F、P4-A～P4-H 解释/证据/Golden/历史/备份回归、城市精确匹配、缺失时辰、六爻复现、真实用户写操作写保护、P5-A1/P5-A2/P5-A3a 兼容回归、P5-A3b 复核展示、P5-A4a 边界审计、P5-A4b1 输入校验、P5-A4b2 六爻 seed/date、P5-A4b3 八字真太阳时跨日/子初、P5-A4b4 紫微农历/闰月、P5-A4b5 四模块 engine failure、P5-A5b Astrology 安全、P5-A5c 历史 DST 与 P5-C deferred route 回归，共 174 项测试；主管本地独立门禁 174/174 PASS，P5-A5c 专项 8/8、P5-C deferred route 专项 4/4）
- `npm run build:web`（静态 Web 构建成功，8 条路由；本批 Web Export 实际执行并 PASS）
- P5-A 收口新增独立纯 JSON 合同 `p5-c-deferred-input-route.v1`：`p5-a4a-cross-a11y-copy-route` 的 `status=deferred`、`disposition=routed-to-p5-c`、`implementationStatus=not-implemented`、`targetBatch=P5-C` 均由 validator 和 `tests/p5-deferred-input-route.regression.mjs#cross-a11y-copy-route-deferred` 锁定；该功能明确尚未实现。
- P5-A3a 两次 GitHub Actions 均为 `completed/success`；最终 run `31873458023` 的 Regression tests 与 Web export 均实际执行并 success。
- P5-A3b 候选实现本地 `30f2db2c164bd1cac709025a340e91f32a3fa147`、远端等价 `baea5f6e53bcc52564fd7b7e375cc4e70463398f`；[CI run 31875157338](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31875157338) 为 `completed/success`，Regression tests 与 Web Export 均实际执行并成功。账本修复本地 `1189f5e9d7ed6001ac8ce132e8ee69b79435c052`、远端等价 `c5bc6f04a0b6ddc1f43233d88c061a7efeccebfb`；[CI run 31876037500](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31876037500) 同为 `completed/success`，Regression tests 与 Web Export 均实际执行并成功。主管初审及最终独立验收本地 diff check/typecheck/lint/104/104/build 8 routes 均 PASS。
- P5-A4a 实现 local `2cf82d402e2f840ebf7c29bf47ee3b167fab9688`、remote `c7055e8962b3b21dd8b78c8f5c64769e9528daf0`；[CI run 31879638540](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31879638540) 为 `completed/success`，Typecheck、Lint、Regression tests 与 Web Export 均实际执行并 Success。主管独立复跑 `git diff --check`、typecheck、lint、`npm test`（112/112）和 `build:web`（8 routes），全部 PASS。唯一非阻断 warning 是 runner 将 `actions/checkout@v4`、`actions/setup-node@v4` 的 Node 20 action runtime 强制为 Node 24；登记为后续 CI maintenance，本批不修改 workflow。
- P5-A4b1 实现 local `0d279c677c1c05eb2492f9ae3b779267feb8b165` / remote `8ab5c6981c89590f6f19fabdc688c34ae60650ed`；[CI run 31882220415](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31882220415) 为 `completed/success`，validate job 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功，Web export 未 skip。主管本地独立复跑 `git diff --check`、`npm run typecheck`、`npm run lint`、`npm test`（120/120）和 `npm run build:web`（8 routes），全部 PASS。Expo SDK 57 exact docs 已核对，本批没有使用 Expo API。
- P5-A4b2 实现 local `0815612cb8e2261325828ccf0d07e51525f34280` / remote `a976b4f07a2d516713db10cb2c0f2b53c98aa51a`；GitHub Actions run `31884436927` 为 `completed/success`，validate job `95011564415` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功；主管本地独立门禁 128/128、Web Export 8 routes 均 PASS，Sol High 独立验收结论为 **P5-A4b2 PASS**。Expo SDK 57 exact docs 已核对，本批没有使用 Expo API；六爻 engine/cross taxonomy、0,0、日期范围、DST、缺时辰、owner decisions 及其他 gap/decision-required 仍未完成，P5-A/Phase 5 仍未完成。
- P5-A4b3 实现 local `53a3c46a1145a10f78f7f193df9b6e01dc12bbeb` / remote `c2daaf5691980da3faa839df4847680331d90b53`；GitHub Actions [run 33352537186](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33352537186) 为 `completed/success`，validate job `99368535197` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功；Luna Max 本地独立门禁 132/132、Web Export 8 routes 均 PASS，`git diff --check`、typecheck、lint 均通过（Lint 0 warning），Sol High 独立验收结论为 **P5-A4b3 PASS**。Expo SDK 57 exact docs 已核对，本批没有使用 Expo API；六爻 engine/cross taxonomy、unknown-coordinate `0,0`、公开日期范围、1986–1991 DST、缺时辰、owner decisions 及其余 gap/decision-required 仍未完成，P5-A/Phase 5 仍未完成。
- P5-A4b4 实现 local `62697525875a6214b19b447c1d08753bfdb18d75` / remote `306fdcdc89090f2c3c018ab8a25c5938b1e74195`，remote parent `e41513d3343c7d081bd17d06521c9410139286ab`；GitHub Actions [run 33357809089](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33357809089) 为 `completed/success`，validate job `99383188584` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功；主管本地 `git diff --check`、typecheck、lint（0 warning）、`npm test` 139/139 和 `build:web` 8 routes 均 PASS，Sol High 独立验收结论为 **P5-A4b4 PASS**。本批未改算法/公式、UI、Storage/schema、依赖或 CI；P5-A4a `41 / 18 / 15 / 5 / 2 / 1` 与 Astrology `0,0` probe 不变，下一微批为 P5-A4b5 四模块 engine errors 与跨模块失败契约，owner decision items 继续 pending。
- P5-A5a 统一公开出生日期政策已通过 Sol High 独立验收：统一 `cn-mainland-public-birth-date-range.v1` 为 inclusive `1900-01-01..2099-12-31`；独立 `p5-a5a-owner-decision.v1` overlay 关闭三项 A4a date decision-required，A4a `41 / 18 / 15 / 5 / 2 / 1` 与 A4b v1-v5 不变。专项回归 9/9、统一 `npm test` 155/155、TZ UTC/Asia/Shanghai deepEqual、2099 三模块可计算、快照/replay/backup roundtrip、typecheck、lint 0 warning、Web Export 8 routes 均 PASS；`npm audit --omit=dev` 基线为 0 critical / 8 high / 13 moderate / 0 low。实现远端 `61805e8998ab4ca701e4960d6129e3b7cb381b17`（parent `496902c875072769439c90cf52f130331fa473d3`），CI run/job `33375970276`/`99437414040`；该提交错误新增 `STATUS.md`，cleanup 远端 `5350baa9a857b86e2a02c0c42036d72dfe06a0c4`（parent `61805e8998ab4ca701e4960d6129e3b7cb381b17`）只删除该文件，最终 CI run/job `33376590722`/`99439354459` 全部 Success 且 Web Export 实际执行；当前无 `STATUS.md`。下一批为 P5-A5b Astrology 日级近似 + 缺坐标 fail-closed，DST 仍 pending。
- P5-A5b Astrology 日级近似与缺坐标 fail-closed 已通过 Sol High 独立验收：`p5-a5a-owner-decision.v2` 保留 v1 三项并累计 4 项，仅新增 `p5-a4a-astrology-missing-time`；`p5-a4b-input-resolution.v6` 累计 14 项，关闭 `p5-a4a-astrology-missing-coordinate` 与 `p5-a4a-cross-no-guessing`，v6 仅是 cumulative overlay 版本。未知时辰固定 Asia/Shanghai 正午锚点并检查日首/日末稳定性，结果 `date-level-approximate`/`partial`，隐藏角点、宫位、相位、逆行和不稳定快速因素；未知城市/无成对坐标 fail-fast，`MISSING_BIRTH_COORDINATES` field `birthCity`，不再传入 `0,0`。策略 metadata 进入 `calculationSettings`、`inputSnapshot`、`ChartSnapshotMeta`、`SavedReading`、backup/replay，旧快照不补写；A4a immutable 统计/历史 probe 不变。专项 7/7、统一 `npm test` 162/162、TZ deepEqual、typecheck、lint 0 warning、Web Export 8 routes、生产 audit 0 critical / 8 high / 13 moderate / 0 low 均 PASS；实现 local `7f0caef63a0656ff21a571c7edb9cb7db1828d49` / remote `6d00ad4834f012e61a99431d24d2301f766d7d40`，remote parent `44488581f0853a1be7a8366881f42b6a6f65f581`，Actions run/job `33385531379`/`99467178839` 全部 Success。下一批为 P5-A5c 中国大陆 1986–1991 历史 DST。
- GitHub Actions CI：安装依赖后自动执行 typecheck、lint、npm test 和 Web 构建；Web Export 使用 `always()`，不会因测试失败被跳过。
- 浏览器手工走查：首页、八字落柱、六爻起卦、紫微十二宫、星盘精确/近似分支、自动保存及记录展开；文件导出/选择与导入预览的具体签字项见 [DEVICE_ACCEPTANCE.md](DEVICE_ACCEPTANCE.md)。
- 视觉与响应式基线已检查过 375px、手机横屏和 1440px；正式发布前仍必须在实际 iPhone 上做全量回归。

已知依赖审计基线记录在 [SECURITY_NOTES.md](SECURITY_NOTES.md)：本次复核 `npm audit --omit=dev` 生产基线为 **0 critical、9 high、16 moderate、0 low（25 total）**；当前 findings 主要来自 Expo/Metro/React Native 运行依赖链及其传递依赖。自动修复会建议不兼容的大版本降级，因此未执行强制修复。该结果是当前基线，不代表风险已接受；提交前仍需在兼容的 Expo SDK 57 补丁升级后重新审计。

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
3. **P5-A3a、P5-A3b、P5-A4a、P5-A4b1、P5-A4b2、P5-A4b3、P5-A4b4、P5-A4b5、P5-A5a、P5-A5b 与 P5-A5c 均已经 Sol High 独立验收 PASS**：方案 A 为新计算 NOAA v2、旧 v1 仅历史复现、unknown 不伪造证据；P5-A3b 的记录页显式复核/UI 展示不是新的 owner 决策门，已按主管授权完成实现并验收，P5-A3 子里程碑整体完成；P5-A4a 已完成四术边界与输入策略审计合同、机器门禁和现状事实登记；P5-A4b1 只关闭三项安全输入 gap；P5-A4b2 只关闭六爻 date/seed 两项，overlay 累计五项；P5-A4b3 只关闭八字真太阳时跨日/子初边界一项，overlay 累计六项；P5-A4b4 只关闭紫微农历/闰月两项，overlay 累计八项；P5-A4b5 只以 v5 overlay 关闭三个模块 engine-error gap 与真实跨模块 copy-failure gap，overlay 累计十二项；P5-A5a 以独立 `p5-a5a-owner-decision.v1` overlay 关闭三项公开日期范围决策，统一范围为 inclusive `1900-01-01..2099-12-31`；P5-A5b 以 owner-decision v2 新增一项缺时辰日级近似决策，并以 A4b v6 关闭缺坐标与跨模块 no-guessing 两个原始 gap；P5-A5c 以 owner-decision v3 关闭中国大陆 1986–1991 历史 DST，固定 Asia/Shanghai 官方民用钟表/北京时间，春季不存在时刻与秋季重复时刻均 fail-fast，运行时不依赖 OS/process timezone。A4a immutable registry、`41 / 18 / 15 / 5 / 2 / 1` 与历史 Astrology `0,0` probe 不变，A4b v1-v6 overlays 保留；日级近似输出 `partial`，明确正午锚点/日首日末稳定性和偏差，未知城市或无成对坐标 fail-fast，不再传入 `0,0`。P5-A final 已完成最终 supervisor acceptance，仅确认既有 additive route 的审计收口；`p5-a4a-cross-a11y-copy-route` 仍为 P5-C deferred/routed 且功能尚未实现，`p5-a4a-cross-city-coverage` 继续保持 P5-B 路由。UX/可访问性、性能稳定性、Release Security、隐私合规、Web、iPhone/TestFlight 和 App Store 材料各自保留独立 DoD。下一步固定为 **P5-B1 合同/来源/许可审计**。只有相关 schema、dataset、rules、interpretation 或 explanation 发生兼容性变化时才评估并递增版本，不能无条件递增。
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
- [PHASE5_EXECUTION.md](PHASE5_EXECUTION.md)：P5-A1 Golden Case 合同、P5-A2 HKO published-reference、P5-A3 版本兼容/历史复核、P5-A4a 边界审计、P5-A4b1/P5-A4b2/P5-A4b3/P5-A4b4/P5-A4b5 输入校验、失败契约和测试证据，以及 P5-A5a/P5-A5b/P5-A5c 日期、精度、地点、历史 DST 与 P5-C deferred route 收口记录。
- [P5_A_BOUNDARY_AUDIT.md](P5_A_BOUNDARY_AUDIT.md)：P5-A4a 四术边界与输入策略审计矩阵、P5-A4b1/v2/v3/v4/v5/v6 overlay、P5-A5a owner-decision v1/v2/v3 overlay、P5-C deferred route、gap、决策门和后续路由。
- [SECURITY_NOTES.md](SECURITY_NOTES.md)：依赖审计基线。
- [设计系统主规范](../design-system/guanxiang/MASTER.md)：色彩、字体、动效、无障碍和产品语气。
- [开源方案清单](../../metaphysics-app-research/SOURCE_MANIFEST.md)：固定提交、许可证与采用边界。
- `src/services/chart-engine.ts`：四模块统一计算适配层。
- `src/state/app-context.tsx`：本地数据与会话的当前实现。

## 13. P5-A4b3 当前交接：八字真太阳时跨日/子初边界矩阵

**状态：Sol High 独立验收 PASS**

本小批只关闭 `p5-a4a-bazi-true-solar-cross-day`，新增 regression-only 矩阵覆盖 135°E / 75°E（相对 120°E 标准经线两侧）、正负应用修正、民用时刻向前/向后跨日以及 `midnight` / `ziEarly`；冻结真太阳时民用/有效时刻（含日期）、应用修正和最终八字有效计算时刻。结果只表示当前已验收 NOAA v2 实现的工程回归，不代表专业或独立真值。

新增 cumulative `p5-a4b-input-resolution.v3` 共 6 项（v1 原 3 + v2 追加 2 + 本批八字 1），v1/v2 原 exports、registry、validator、顺序和精确 3/5 计数保持可用；version-aware validator 保持纯 JSON、唯一 resolution/audit ID、原始 `gap` / `P5-A4b` 关联且不写 commit SHA。UTC 与 `Asia/Shanghai` 下同一矩阵整体 deepEqual；A4a `41 / 18 / 15 / 5 / 2 / 1` 与 astrology unknown-city `0,0` probe 保持不变。

本批只改授权的 golden overlay/index、一个 regression 测试、统一测试接入和五份 P5 文档；没有使用 Expo API（已核对 Expo SDK 57 exact docs）。紫微 lunar/闰月、日期范围、1986–1991 DST、缺时辰、`0,0` 语义、六爻 engine/cross taxonomy、其他 gap/owner decisions 以及 P5-B/P5-C 仍未完成。

本地质量命令结果：`git diff --check` PASS、`npm run typecheck` PASS、`npm run lint` PASS（0 warning）、`npm test` PASS（132/132）、`npm run build:web` PASS（8 routes，Web Export 实际执行）。实现 local `53a3c46a1145a10f78f7f193df9b6e01dc12bbeb` / remote `c2daaf5691980da3faa839df4847680331d90b53`；GitHub Actions [run 33352537186](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33352537186) 为 `completed/success`，validate job `99368535197` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功。

Sol High 独立验收结论：**P5-A4b3 PASS**。本小批只关闭 `p5-a4a-bazi-true-solar-cross-day`，不表示整个 P5-A、Phase 5 或 Level A 发布门完成。

## 14. P5-A4b4 当前交接：紫微农历/闰月输入校验

**状态：Sol High 独立验收 PASS**

本小批只关闭 `p5-a4a-ziwei-lunar-input` 与 `p5-a4a-ziwei-leap-month`。现有输入解析/边界层对普通农历、有效闰月建立可复现 fail-fast 契约，拒绝不存在的闰月组合和无效农历日期；农历路径不套用 Gregorian 校验，固定使用 `lunar-javascript@1.7.7` 的成熟日历数据能力，不自创历法结论或宣称独立专业真值。

累计 `p5-a4b-input-resolution.v4` 为 v1=3/v2=5/v3=6/v4=8；v1/v2/v3 exports、顺序前缀与 validator 保持不变，并新增 v4 validator。回归覆盖普通农历、有效闰月、无效闰月组合、无效农历日期，及 `TZ=UTC`/`TZ=Asia/Shanghai` deepEqual，且不依赖 OS/process TZ。A4a `41 / 18 / 15 / 5 / 2 / 1` 与 Astrology `0,0` probe 保持不变。

实现 local `62697525875a6214b19b447c1d08753bfdb18d75` / remote `306fdcdc89090f2c3c018ab8a25c5938b1e74195`，remote parent `e41513d3343c7d081bd17d06521c9410139286ab`；GitHub Actions run `33357809089`、validate job `99383188584` 均 `completed/success`，Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功；本地 `git diff --check`、typecheck、lint（0 warning）、`npm test` 139/139、`build:web` 8 routes 和 `npm audit --omit=dev` 生产基线 0 critical/8 high/13 moderate/0 low 均已核对。未修改算法/公式、UI、Storage/schema、依赖或 CI；下一微批为 **P5-A4b5 四模块 engine errors 与跨模块失败契约**，owner decision items 继续 pending，P5-A/Phase 5 仍未完成。

## 15. P5-A4b5 当前交接：四模块 engine failures 与跨模块失败契约

**状态：Sol High 独立验收 PASS（P5-A4b5 PASS）**

本小批只关闭 immutable P5-A4a registry 中仍为 `gap` 的四个真实条目：`p5-a4a-ziwei-engine-error-path`、`p5-a4a-astrology-engine-error-path`、`p5-a4a-liuyao-engine-error-path` 与 `p5-a4a-cross-error-copy-failure-mode`。真实跨模块审计项是最后一个；不存在且未使用 `p5-a4a-cross-error-taxonomy`。八字 engine-error 路径原审计已通过，本批仅加入四模块同形/兼容回归，不虚构新的八字 gap。

四模块统一使用稳定、JSON-safe、fail-closed 的 engine failure contract，公开形状严格为 `{name,category,module,code}`（`ChartEngineError`/`engine-failure`/对应模块/`ENGINE_FAILURE`）；公开 contract 不含 `cause`、`message`、`stack`、PII 或底层库细节。未知底层异常按模块包装，稳定 engine error 不重复包装；`ChartInputError` 完全兼容并原样重抛。引擎失败 fail-closed，不返回部分盘、默认盘或猜测盘；正常成功盘保持不变。局部 seam 异常注入避免全局 monkey patch 和并行污染。

累计纯 JSON `p5-a4b-input-resolution.v5` 为 v1=3/v2=5/v3=6/v4=8/v5=12；v1/v2/v3/v4 exports、顺序前缀与 validators 保持兼容，新增 version-aware v5 validator。回归覆盖四模块成功、输入错误、异常包装、安全序列化、跨模块同形与 overlay 前缀/校验。实现批次实际 changed paths 为 10：`package.json`、`src/domains/golden/boundary-input-resolution.ts`、`src/domains/golden/index.ts`、`src/services/chart-engine.ts`、`src/services/chart-errors.ts`、`src/services/engines/astrology-engine.ts`、`src/services/engines/bazi-engine.ts`、`src/services/engines/liuyao-engine.ts`、`src/services/engines/ziwei-engine.ts`、`tests/p5-engine-errors.regression.mjs`。

本批质量门为 `git diff --check` PASS、`npm run typecheck` PASS、`npm run lint` PASS（0 warning）、`npm test` PASS（146/146）、`npm run build:web` PASS（8 routes，Web Export 实际导出/路由校验通过）；`npm audit --omit=dev` 为 0 critical / 8 high / 13 moderate / 0 low（21 total，未升级依赖）。GitHub Actions [run 33363580174](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33363580174) 的 validate job `99399593743` 为 `completed/success`，四项任务均实际执行并成功。实现基线 local `f6dad29fc72b1c49e296b5300ae19c5a2cd6a5b3`、remote `98a336b8381016d781abc2b5584cc0777cb8bbd5`、remote parent `c7801ddc28522a7fdcfe0b38931443ba559868c2`。

P5-A4a immutable audit 本体、`41 / 18 / 15 / 5 / 2 / 1` 与 Astrology `0,0` probe 原样不动；本节形成时 Astrology `0,0`/no-guessing、日期范围、DST、未知时辰与其他负责人决策项仍 pending，随后 P5-A5a 已通过独立 overlay 关闭三项公开日期范围决策。以上为 P5-A4b5 当时的历史下一步记录，P5-A5b 已在第 17 节收口，P5-A/Phase 5 仍未完成。

## 16. P5-A5a 当前交接：统一公开出生日期政策

**状态：Sol High 独立验收 PASS（P5-A5a PASS）**

负责人确认中国大陆首发公开出生日期统一为 **1900-01-01 至 2099-12-31（含端点）**。版本化政策合同为 `cn-mainland-public-birth-date-range.v1`：八字、紫微、占星范围外统一 fail-fast，稳定返回 `ChartInputError` code/field/安全中文文案；八字/紫微农历先做真实农历/闰月校验，再按农历输入年月日范围判断，不把 lunar 当 Gregorian，也不把第三方库计算能力当产品支持范围。六爻不受该政策影响。

独立 owner-decision resolution overlay 为 `p5-a5a-owner-decision.v1`，精确关闭 `p5-a4a-bazi-supported-date-range`、`p5-a4a-ziwei-date-range`、`p5-a4a-astrology-date-range` 三项 decision-required；不写入 A4b v1-v5，不修改 A4a immutable registry 及 `41 / 18 / 15 / 5 / 2 / 1` 统计。政策版本和起止边界进入 `calculationSettings`，并在 `inputSnapshot`、`ChartSnapshotMeta`、`SavedReading`、普通/加密 backup roundtrip 中保留；旧快照不补写，Storage Schema 不做破坏性迁移。

专项回归 9/9、统一 `npm test` 155/155；覆盖 Bazi solar/lunar、Ziwei solar/lunar/闰月、Astrology solar 端点/范围外拒绝、既有非法 Gregorian/lunar error code、Liuyao 2100 不误拦、TZ UTC/Asia/Shanghai deepEqual 和快照/replay/backup JSON roundtrip。八字、紫微、占星 2099 端点均可计算；typecheck、lint（0 warning）、Web Export 8 routes 和生产 audit（0 critical / 8 high / 13 moderate / 0 low）均 PASS。

实现远端 `61805e8998ab4ca701e4960d6129e3b7cb381b17`（parent `496902c875072769439c90cf52f130331fa473d3`），CI run/job `33375970276`/`99437414040`；该提交错误新增根目录 `STATUS.md`。cleanup 远端 `5350baa9a857b86e2a02c0c42036d72dfe06a0c4`（parent `61805e8998ab4ca701e4960d6129e3b7cb381b17`）仅删除 `STATUS.md`；当前仓库无该文件。最终 CI run/job `33376590722`/`99439354459` 全部 Success，Web Export 实际执行。

P5-A5a 已完成并经 Sol High 验收；P5-A 与 Phase 5 仍未完成。以上为 P5-A5a 当时的下一批记录；P5-A5b 的最新交接见下一节。

## 17. P5-A5b 当前交接：Astrology 日级近似与缺坐标 fail-closed

**状态：Sol High 独立验收 PASS（P5-A5b PASS）**

本批落实负责人决策：出生时辰未知时不补造时辰，Astrology 使用固定 `Asia/Shanghai` 当地正午 `12:00:00` 作为内部锚点，并比较日首 `00:00:00`、锚点和日末 `23:59:59` 的星座稳定性。只保留全天稳定的天体星座及锚点度数；Moon 等可能跨星座的快速因素、逆行等瞬时字段隐藏，不输出 Ascendant、Midheaven、houses、angles 或 aspects。结果明确为 `calculationMode=approximate`、`precision=date-level-approximate`、`completeness=partial`，caveats/focus 明示锚点、检查窗口和偏差。

地点解析遵循显式成对坐标优先、城市数据次之。缺少、单边、非有限或越界显式坐标返回既有 `INVALID_BIRTH_COORDINATES`；空城市或未知城市且无有效成对坐标返回 `MISSING_BIRTH_COORDINATES`，`field=birthCity`，文案为“无法识别出生城市，请补充城市或成对的纬度和经度。”，不再把 `0,0` 传给 Horoscope。已知时辰加有效坐标/可识别城市仍走 exact，成功盘保持深度兼容，仅增加 additive policy/location metadata。

版本化 contract 为 `astrology-calculation-policy.v1`、`astrology-precision-policy.v1`、`astrology-location-policy.v1`、`astrology-date-level-approximation.v1` 与 `astrology-date-level-policy.v1`。策略在 `calculationSettings`、`inputSnapshot`、`ChartSnapshotMeta`、`SavedReading`、普通/加密 backup/replay 中保存；旧快照缺失该政策时保持可读，不补写、不静默重算。

Owner decision overlay 为 `p5-a5a-owner-decision.v2`，保留 v1 三项并累计 4 项，仅新增 `p5-a4a-astrology-missing-time`；A4b input-resolution 为 `p5-a4b-input-resolution.v6`，累计 14 项，新增并关闭 `p5-a4a-astrology-missing-coordinate` 与 `p5-a4a-cross-no-guessing` 两个原始 gap。v6 只是 cumulative overlay 版本，不新增 A4b 批次。A4a immutable registry、`41 / 18 / 15 / 5 / 2 / 1` 统计与历史 `0,0` probe/currentBehavior/evidence 文本保持不变。

专项 `tests/p5-astrology-safety.regression.mjs` **7/7**，统一 `npm test` **162/162**；`npm run typecheck`、`npm run lint`（0 warning）、`npm run build:web`（8 routes，Web Export 实际执行）、`git diff --check` 均 PASS；`npm audit --omit=dev` 为 0 critical / 8 high / 13 moderate / 0 low，未升级依赖。回归覆盖 exact 显式坐标/城市命中、日级隐藏字段与偏差文案、缺地点/空城市/单边/越界坐标 fail-fast、局部 seam 的 `0,0` 防回归、旧快照、SavedReading/backup/replay、TZ UTC/Asia/Shanghai deepEqual、overlay v1/v2/v6 validator 和 exact fixture 兼容。

实现 local `7f0caef63a0656ff21a571c7edb9cb7db1828d49` / remote `6d00ad4834f012e61a99431d24d2301f766d7d40`，remote parent `44488581f0853a1be7a8366881f42b6a6f65f581`，实际变更 21 paths；GitHub Actions run/job `33385531379`/`99467178839` 全部 Success。Sol High 独立验收结论：**P5-A5b PASS**。以上为 P5-A5b 的历史交接记录；P5-A5c 已在下一节收口，P5-A 与 Phase 5 仍未完成。

## 15. P5-A5c 当前交接：中国大陆 1986–1991 历史 DST

**状态：Sol High 独立验收 PASS（P5-A5c PASS）**

本小批只关闭 `p5-a4a-bazi-historical-dst`，输入假设为 **Asia/Shanghai 官方民用钟表/北京时间**；非官方地区习惯时间不在 v1 承诺范围内。规则来源冻结为 IANA `tzdata2025b` 的 `asia`/`Rule PRC`：[release archive](https://data.iana.org/time-zones/releases/tzdata2025b.tar.gz)，源码提交 [7e1145bfdb9630c127841dc8ce808a937a300938](https://github.com/eggert/tz/commit/7e1145bfdb9630c127841dc8ce808a937a300938)。运行时使用仓库静态 transition table，不依赖 OS/process timezone 或设备 tzdata。

六年当地民用转换为：1986 `05-04` / `09-14`、1987 `04-12` / `09-13`、1988 `04-17` / `09-11`、1989 `04-16` / `09-17`、1990 `04-15` / `09-16`、1991 `04-14` / `09-15`；每次转换时间为 `02:00:00`。春季 `02:00–02:59` 为不存在时刻、秋季 `01:00–01:59` 为重复时刻，均 fail-fast，不猜测；夏令时期间固定调整 **-60 分钟**，冬季为 0。计算顺序固定为 **calendar validation + 1900–2099 range → lunar-to-solar → DST → true solar → day boundary → engine**；农历先转公历参加 DST 比较，但保留原始农历标签和民用日期时间。

policy/resolution/settings/input/evidence/meta 以及 `ChartSnapshotMeta`、`SavedReading`、普通/加密 backup/replay 均保存来源、版本、时区、原始民用时间、解析结果和有效计算时刻；旧快照保持可读，不补写历史 DST、不静默重算；future-schema 只读/写保护保持不回归。Owner overlay 为 `p5-a5a-owner-decision.v3`，v1=3、v2=4 前缀保持，v3=5 仅新增历史 DST；A4a immutable `41 / 18 / 15 / 5 / 2 / 1` 与 A4b v1–v6 不变。

专项回归 **8/8**，统一 `npm test` **170/170**；typecheck、lint（0 warning）、`git diff --check`、Web Export 8 routes 均 PASS，Web Export 实际执行；`npm audit --omit=dev` 生产基线为 0 critical / 8 high / 13 moderate / 0 low，未升级依赖。回归覆盖六年边界、冬季/季中、spring gap、autumn overlap、solar+lunar、跨日、true-solar on/off、`midnight`/`ziEarly`、settings/input/evidence/meta/SavedReading/plain+encrypted backup、legacy、overlay v1–v3，以及 `TZ=UTC`/`Asia/Shanghai`/第三时区 deepEqual。

实现 local `886aec930564c5399e8e67d4878ff8aee135fa28`（parent `72287ce7698a673b098badcb0a0f0e2a196e3f29`），remote `43def88793c189313c20c959f9a23712cd2fd811`（parent `fa40f8a389f64b214d672e6f3dc45c3f6341ee54`），共 16 paths；GitHub Actions [run 33401047517](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33401047517) / job `99517136945` 为 `completed/success`，Typecheck、Lint、Regression tests 与 Web Export 均实际执行并成功。

P5-A5c 已完成并经 Sol High 验收。（历史记录：当时下一步为 P5-A final acceptance/audit closure。）P5-A final 随后已完成最终总验收与审计收口；P5-B 城市覆盖、P5-C～P5-I 发布门及非官方地区时间习惯风险仍保留。

## 20. P5-A final supervisor acceptance：P5-C deferred route

本次 P5-A 最小收口只新增一份独立、可执行的 deferred/routed disposition，不修改 A4a immutable 41 项 registry、历史统计、既有 evidence、A4b v1–v6 或 owner-decision v1–v3。合同为 `p5-c-deferred-input-route.v1`，对应关系如下：

| 字段 | 值 |
|---|---|
| 原始审计项 | `p5-a4a-cross-a11y-copy-route`（仍保持原始 `gap` / `targetBatch=P5-C`） |
| route ID | `p5-c-deferred-cross-a11y-copy-route` |
| status / disposition | `deferred` / `routed-to-p5-c` |
| implementationStatus | `not-implemented` |
| targetBatch | `P5-C` |
| 可执行 testRef | `tests/p5-deferred-input-route.regression.mjs#cross-a11y-copy-route-deferred` |

summary 明确写为“路由到 P5-C，功能尚未实现”；P5-C 后续仍必须完成键盘、读屏、字体缩放、减少动态效果、对比度、触控目标和错误文案矩阵，不能把本次 route 当作功能完成。`p5-a4a-cross-city-coverage` 继续保持原有 `routed-p5-b` / `P5-B` 路由。专项 route 回归为 **4/4**，并检查 route ID、原始 gap、P5-C target、deferred/not-implemented 语义、非空 testRef 与累计 overlay 不变。

### 20.1 Final supervisor acceptance evidence

基于已确认的远端实现 `f1ec6cd40a3c265941cac95e246cbc92d8aac202`（parent `92b7f31aca256c62532d1cc718a725f1a46f6785`），Sol High/主管最终验收 **PASS**。GitHub Actions run `33538870655` / job `99959852381` 为全绿 `Success`；Typecheck、Lint、Regression tests 与 Web Export 均实际执行，Web Export 非 skip。

- `npm test`：174/174；P5-A final deferred route 专项：4/4。
- Web Export：8 routes，实际执行并成功。
- `npm audit --omit=dev`：0 critical / 9 high / 16 moderate / 0 low（25 total）；该基线不表示 P5-E 已关闭。
- A4a immutable 41 项 registry、历史统计 `41 / 18 / 15 / 5 / 2 / 1`、既有 evidence、A4b v1–v6 与 owner-decision v1–v3 均保持不变。
- `p5-a4a-cross-a11y-copy-route` 仅为正式 additive deferred/routed 到 P5-C，`implementationStatus=not-implemented`；`p5-a4a-cross-city-coverage` 继续保持 `routed-p5-b` / P5-B。

**P5-A 已完成。下一批唯一授权入口为 P5-B1：城市数据合同、来源与许可审计；P5-C 功能本身仍未实现，整个 Phase 5 和 Level A 发布门仍未完成。**

---

**交接判断**：当前代码适合继续做“排盘可信度 + 本地档案体验”的开发和内部试用；任何正式发布、真实登录、付费、AI 或将出生数据上云的决策，都应在本文件第 8 节的 P0 项完成并单独评审后执行。
