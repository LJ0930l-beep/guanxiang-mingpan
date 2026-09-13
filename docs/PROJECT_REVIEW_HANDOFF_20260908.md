# 观象 命盘 项目复盘与三术解盘闭环交接

更新时间：2026-09-08。本文是本轮整包修复后的工程交接记录，面向独立验收、后续发布准备和专业内容复核。

## 交接结论

本轮把技术 RC 补到“本地排盘 → 证据 → 解释 → 保存 → 历史查看 → 事实反馈”的可操作闭环。八字、六爻、紫微三术都有保存时的结构化盘面、规则版本和解释快照；基础计算仍在设备本地，未接入广告、支付、云同步、真实手机号/Apple/微信供应商或生产 AI。

本地工程检查已经收口，但正式公开发布仍未完成：真机与签名、主体与商店合规、城市数据许可、传统术数专业复核、生产依赖漏洞处置和 Qwen 离线评测仍保留外部阻塞。本轮没有把这些条件包装成已通过。

## F01–F12 完成矩阵

| 编号 | 状态 | 证据与真实路径 |
|---|---|---|
| F01 | 完成 | `src/state/app-context.tsx` 不再对记录静默 `slice(0, 100)`；`tests/storage-operations.regression.mjs` 覆盖 101 条保存和重载回查。 |
| F02 | 完成 | `transactionalReplace` 先写盘后发布内存；注入 `AsyncStorage.setItem` 失败时磁盘和内存都保持原值，并覆盖多 key 回滚。 |
| F03 | 完成 | 八字、六爻、紫微解释只引用语义相关证据；没有足够证据时明确未覆盖。`tests/feedback-links.regression.mjs` 和解释回归验证无关证据不会被凑入反馈。 |
| F04 | 完成 | 八字 `support + opposition` 不再直接映射 balanced；`conflict`、`待定`、经 `balance-validation` 规则验证的 balanced 分开保存并进入版本化解释。 |
| F05 | 完成 | 四术 payload 保存 `inputFingerprint`；六爻保存业务 `Asia/Shanghai`、`seed`、`date`、`seedScope`、`castingMethod`、`castingRuleVersion` 和手工/交互 6/7/8/9 点事实。 |
| F06 | 部分完成 | 八字保留主题、条件、反证、候选取用、证据链和未知时辰 fail-closed；大运/流年事实引擎仍需专业规则确认，未用模板或 AI 补齐。 |
| F07 | 完成（基础规则） | 六爻支持快捷自动、六次三枚铜钱投掷、手工六爻录入；实现 1:3:3:1 的 6/7/8/9 规则，保存用神、世应、旺衰、动变和变后事实；不承诺确定应期。 |
| F08 | 完成（基础深度） | 紫微真实十二宫、命身定位、主星/亮度、四化、对宫与三方四正节点可回查；占星保留辅助盘和全量相位查看，不扩展为第四套深度解读。 |
| F09 | 完成 | 实时页和历史页复用只读 `ChartRenderer`；旧记录缺数组时安全降级且不重算。反馈默认“待验证/不关联”，用户选择具体解读卡和该卡引用的可读证据，编辑、导入导出后保持关联。 |
| F10 | 部分完成 | 生产 audit、密钥扫描、14 路 Web Export、四模块具体深链和 Service Worker 缓存迁移均有本地证据；真机、证书、主体、城市许可和线上部署仍阻塞。 |
| F11 | 方案完成、评测阻塞 | `docs/QWEN35_9B_OFFLINE_EVAL_PLAN_20260908.md` 只定义本地脱敏评测和规则边界；没有下载权重、购买算力、上传真实档案或接生产链路。 |
| F12 | 完成 | 统一 `npm test` 纳入页面可访问性回归、三枚铜钱、旧档案渲染、反馈关联；测试、类型、lint、Web Export、审计和本交接文件均有证据。 |

## 可操作路径

### 八字

首页 → 命主 → 八字 → 选择性别、日界线、真太阳时 → 排出四柱 → 查看主题判断、条件/反证、候选取用和计算依据 → 保存到记录 → 记录页打开保存时完整盘面、解释和事实反馈。未知时辰不补造时柱，也不把大运/流年缺失事实写成确定结论。

### 六爻

首页 → 六爻 → 输入至少 4 字问题 → 选择父母/官鬼/妻财/子孙/兄弟 → 选择快捷自动、六次投掷或手工录入 → 逐条检查爻位、世应、旺衰、动静、纳甲和 6/7/8/9 点 → 生成解释并保存。保存失败时点击“重试保存原卦”，不会重新随机。

### 紫微

首页 → 紫微 → 生成十二宫 → 点击宫位查看主星、亮度、命身定位、对宫和三方四正 → 展开四化和主题解释 → 记录页查看保存时完整十二宫。命宫文案使用真实干支坐标，不再输出无信息的“命宫落在命宫”。

### 占星与历史

首页 → 星盘 → 生成本命盘 → 查看全部星体、宫位和相位；未知时辰只展示日级稳定落座，不猜测上升、宫位或相位。历史页只读保存时结果；规则更新必须由用户主动运行当前规则复核并生成 Diff，历史快照不会静默改义。

### Future Schema 原始值

设置 → 检测到“记录数据只读”后，使用“导出只读原始值”。导出直接读取原始 AsyncStorage 字符串，不解码、不迁移、不覆盖；升级后再使用正式备份/迁移路径恢复。任何 add/select/save/restore 等可能覆盖 blocked key 的操作都会拒绝。

## 数据迁移与回滚

- 当前 Storage Schema 为 v3。future schema key 进入 blocked 集合；对应数据是只读/不兼容状态。
- 同版本迁移只在读取成功且目标 key 未 blocked 时写回。多 key 写入统一通过 `transactionalReplace` 保存旧值，失败时逐 key 回滚；清除使用 `transactionalRemove`。
- 只有成功落盘后才发布 React 状态和 refs。迁移失败或回滚失败时保留原始 key并报错，不强制清空、不静默重算历史。
- 旧六爻 payload 缺少 `lines`、证据或解释时，迁移保留可用事实，渲染层使用空数组并显示“历史记录未保存”；不会补造爻位或重新计算。回归入口为 `tests/archive-legacy-render.regression.mjs`。

## 测试与构建证据

本轮实际重新执行：

```text
npm test
npm run typecheck
npm run lint
npm run security:scan
npm run security:audit
npm audit --omit=dev
npm run build:web
npm run verify:web
```

| 命令 | 结果 |
|---|---|
| `npm test` | 通过，239/239，0 失败，0 跳过 |
| `npm run typecheck` | 通过 |
| `npm run lint` | 通过 |
| `npm run security:scan` | 通过，7 个配置根目录无密钥命中 |
| `npm run security:audit` | 以当前生产 audit 基线生成报告，数字仍为 0 critical / 9 high / 17 moderate / 0 low |
| `npm audit --omit=dev` | 真实 exit 1，26 项：9 high / 17 moderate / 0 critical / 0 low；不是已清零 |
| `npm run build:web` | 通过，真实导出 14 个静态路由，含 `/module/bazi`、`/module/liuyao`、`/module/ziwei`、`/module/astrology` |
| `npm run verify:web` | 通过，14 routes、公共发布文件、bundle、深链和 SW 迁移/资源回退验证通过 |

生产依赖的高/中漏洞主要来自 Expo、Metro、Router、xcode 等传递工具链。本轮逐项记录可达性和兼容性，没有执行 `npm audit fix --force`，也没有用白名单把漏洞伪装成清零。基线明细见 `docs/PRODUCTION_AUDIT_20260908.md`。

新增关键回归：

- `tests/liuyao-casting.regression.mjs`：8 种三枚投币组合、手工/交互事实一致性、变爻、TZ 复现和规则版本。
- `tests/archive-legacy-render.regression.mjs`：真实旧六爻迁移后进入共享 render model，不因 `lines` 缺失崩溃。
- `tests/feedback-links.regression.mjs`：解释卡选择、相关证据筛选、默认不关联、旧 ID 保留和显式解除。
- `tests/p5-c-page-accessibility.regression.mjs`：已纳入统一 `npm test`，不再单独遗漏。

## Qwen3 5 9B 离线评测边界

设备事实为 AMD Ryzen 5 5600 与 RTX 4060 约 8 GB 显存，但仓库没有模型权重、推理服务或人工评测记录。若继续试验，采用本地脱敏 fixture、受约束 JSON 输出和双轮人工审核；模型只可润色已经审核的规则结果，不能改变排盘、证据、置信度、输入指纹或历史快照。当前状态为 evaluation-not-run。

## 未完成与外部阻塞

- 真机 Web/iPhone 安装、键盘、触控、VoiceOver、性能和签名证书：当前环境没有可验收设备、证书和主体，不能声称已通过。
- 真实手机号验证码、Apple、微信登录：当前只有本地体验边界，不是上线身份系统；接入需要供应商、隐私协议、密钥和服务端。
- 传统规则、流派选择、八字大运/流年、紫微四化和六爻细分规则：需要专业审核与可引用来源；专业审核前不能把工程规则描述成科学准确性。
- 城市数据完整覆盖与再分发许可：未知地点继续 fail-closed，不能把当前部分城市表称为全国可发布数据。
- Qwen3.5-9B：没有安装权重或人工评测；不购买服务、不上传真实出生/账号数据、不接生产链路。
- 发布主体、隐私与商店审核材料、线上部署环境仍需产品负责人提供。

## 版本与发布记录

本轮已生成本地提交，当前尚未推送远端。具体 SHA 以最终 `git rev-parse HEAD` 记录为准。当前不能声称本轮 GitHub Actions 为绿色，也不引用旧 run 作为本轮证据。远端验证条件为：推送本地提交后重新检查该 SHA 对应的 Actions，确认 Web Export 和 Verify Web Export 实际执行并成功。

文件索引：

- 工程交接：`docs/PROJECT_REVIEW_HANDOFF_20260908.md`
- Word 交接：`docs/PROJECT_REVIEW_HANDOFF_20260908.docx`
- 生产依赖审计：`docs/PRODUCTION_AUDIT_20260908.md`
- Qwen 离线方案：`docs/QWEN35_9B_OFFLINE_EVAL_PLAN_20260908.md`

## 补充批次交付（2026-09-14）

本轮按开发执行书任务包顺序完成 R04 收尾、R08 收尾与 R10 证据链收口，均为本地确定性工程，不接入 AI、支付或真实账号。

### 执行顺序与证据

1. **R10 证据链第一步**：积压提交 `16c56e9`（上一轮三术复盘修复）已推送远端，GitHub Actions run `34773175393` 为 `completed/success`，Web Export 实际执行。上一轮交接中"尚未推送远端"的缺口已关闭。
2. **R04-1 八字基础大运与流年对照**（`bazi-dayun-v1`）：新增 `src/domains/bazi/dayun.ts`。起运方向为阳年男/阴年女顺行、阴年男/阳年女逆行；起运折算采用通行三日折一年口径（1 天=4 月、1 时辰=10 日折算到日），起运算法、方向、年龄口径、锚定节气与边界全部写入 payload `timeLayer` 元数据。流年对照支持用户选定 1900-2099 年份，按立春精确取干支（lunar-javascript `getYearInGanZhiExact`），输出流年干支、流年干十神（显式十神映射表）与流年支对原局的六合/六冲事实，并标注覆盖的大运。出生日期超出节气数据覆盖范围时显式降级并提示，不中断排盘。解释快照八块合同不变；`liunianYear` 进入设置、输入快照与指纹。回归：`tests/bazi-dayun.regression.mjs`（6 项，含 TZ deepEqual）。
3. **R04-2 未知时辰八字部分盘**（`bazi-partial-chart-policy.v1`）：按执行书第 7 节授权改变旧版阻止策略并记录产品决策（`src/domains/policy/bazi-partial-chart.ts`）。未知时辰不再阻断八字，而是提供年、月、日三柱部分盘：00:00/12:00/23:59 三个民用锚点各跑完整修正管线（历法、历史夏令时、真太阳时、午夜日界线），正午锚点为展示基准，跨锚点移动的柱输出为显式候选范围（节气当日产生年/月候选，历史夏令时远西经度产生日柱候选）。时柱不补造，正午仅为计算锚点；`normalizeBaziChart` 以 `includePillars` 裁剪缺失柱及其关联关系；强弱证据链与八块解释在三柱上继续成立并标注"资料不足"。紫微仍维持 `requireExactBirth` 阻止策略；部分盘不提供大运对照。策略、锚点与日界线进入设置、输入快照与指纹。回归：`tests/bazi-partial-chart.regression.mjs`（6 项，含 TZ deepEqual），并按授权更新 `tests/chart-engine.regression.mjs` 的缺失时辰断言。
4. **R08-1 依赖漏洞处置闭环**：先执行非强制 `npm audit fix --omit=dev`（仅锁文件内 semver 兼容升级，未用 `--force`），生产公告从 10 high / 17 moderate 降至 **0 critical / 4 high / 15 moderate**；剩余 high 全部为 Metro 构建期工具链（metro、metro-config、metro-transform-worker 及其传递依赖 image-size），不进入生产交付物。新增 `docs/security-advisory-dispositions.json` 处置账本（v1 合同）与 `scripts/production-audit.mjs` 门禁升级：任何 high/critical 公告缺少带责任人、决策与复核期限的登记即失败，当前 4/4 已登记。
5. **R08-2 记录分页**：`paginateArchiveReadings` + `ARCHIVE_PAGE_SIZE`（30）落地展示层分页，记录页新增无障碍"显示更多"控件；搜索与筛选始终作用于全量记录，存储层不裁剪（F01 保持）。回归：`tests/archive-query.regression.mjs` 新增 1000 条分页用例。

### 本轮质量门（本地实测）

- `npm test`：**252/252**，0 失败 0 跳过（239 基线 + 大运 6 + 部分盘 6 + 分页 1）
- `npm run typecheck`、`npm run lint`：PASS
- `npm run security:scan`：PASS（7 个配置根目录无密钥命中）
- `npm run security:audit`：PASS，`0 critical / 4 high / 15 moderate`，处置账本 4/4 已登记
- `npm run build:web`：PASS（14 routes）；`npm run verify:web`：PASS（深链 + SW 迁移）

### 仍然未完成（与执行书一致）

- 专业复核：每术至少 30 个带来源/许可样例、非专业用户可用性测试、流派选择——需要外部专业与负责人输入。
- 大运/流年的解释含义（而非结构事实）在专业复核前保持工程基线标注，不输出运势结论。
- Qwen3.5-9B 离线评测仍未执行（evaluation-not-run，方案见 `docs/QWEN35_9B_OFFLINE_EVAL_PLAN_20260908.md`）。
- 真机/TestFlight、签名、法律主体、城市数据全国覆盖、生产托管与真实账号等外部条件不变，详见 `docs/OWNER_DECISIONS_PENDING.md`。
