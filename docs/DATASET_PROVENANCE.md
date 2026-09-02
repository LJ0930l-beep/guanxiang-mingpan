# 观象离线城市数据说明

## P5-B1 审计状态（2026-09-02）

P5-B1 已由主管基于本地/远端提交和质量证据独立验收 **PASS**：远端实现 `89b2d6d4a991f08f075408cbe2b82cfe476bdcfb`（parent `4f660e1fdc29b63a63711f4a96aa7b3ff04788ee`），Actions run `33629823749` / job `100246237118` 全部 Success，Web Export 实际执行且非 skip；专项 8/8、统一 `npm test` 182/182、生产依赖审计 0 critical / 9 high / 16 moderate / 0 low。该 PASS 只确认合同/审计/发布阻断门落地，不代表全国覆盖或离线再分发许可已完成。

当前生产 resolver 仍使用 `china-cities-p1f-mainland-v1`，包含 35 条人工编排的中国大陆城市记录：直辖市、省会/自治区首府，以及原型已经使用的少量常见地级市。现有 35 个 `locationId` 唯一，共 101 个 canonical name/alias token。P5-B1 新增的独立审计合同为 `p5-b1-city-dataset-audit.v1`，审计快照与 registry 位于 `src/data/city-dataset-contract.ts`。

快照的 `status=partial`，每条当前记录标记为 `status=prototype`，`releaseEligibility=blocked`。这是对当前事实的审计，不是全国覆盖声明，也不代表现有 resolver 已经获得新的来源或许可。当前快照明确记录以下阻断：

- 尚未覆盖中国大陆全部地级行政区（地级市、地区、自治州、盟）。`p5-a4a-cross-city-coverage` 仍正式路由到 P5-B，不在 P5-B1 中关闭。
- 35 条记录均没有已核验的 `adminCode` 和行政层级逐行证据；未来行政代码必须作为独立字段，不能替换稳定的 app `locationId`。
- 35 条记录的坐标和别名都没有逐行来源、版本和取数时间证据；坐标只表示城市中心近似值，不能描述精确出生地或真太阳时精确坐标。
- 离线商业再分发所需的逐条许可证、许可证 URL 和归因尚未确认，当前 `licenseStatus=unknown`；不把“人工编排”写成第三方许可，不作法律结论。

P5-B1 只建立审计/发布资格门禁，不改写 `src/data/china-cities.ts` 的生产记录、`resolveCityCoordinates` 行为、Storage Schema、历史快照或依赖。深圳精确命中、未知城市未命中和历史 `locationId`、坐标、`datasetVersion` 均由回归测试锁定。

## 合同字段与安全规则

`p5-b1-city-dataset-audit.v1` 是 additive、纯 JSON 合同，允许未来 B2/B3 逐条补证据而不改变现有 `CityCoordinate` 形状。每个审计记录包含：

- 稳定 app `locationId` 与可空的未来 `adminCode`（两者永不互换）；`canonicalName`、`aliases`、省/市标签；行政层级和覆盖范围。
- `timezone`（首发固定 `Asia/Shanghai`）、`latitude`、`longitude`、`centerType=city-center-approximate`。
- `source`、`sourceUrl`、`sourceVersion`、`retrievedAt`，以及坐标、别名、行政信息、许可证四类 `rowEvidence`。
- `licenseStatus`、`licenseUrl`、`attribution`；未知、受限或阻断许可不能进入 release-ready。
- `validFrom`/`validTo`、`supersedes`/`replacedBy`、`identityChange`。行政变更使用新记录和显式历史映射；任何替换都必须说明被替代或替代谁，不允许静默身份迁移。
- 行级 `blockers`。数据集层同时保存 `datasetVersion`、覆盖统计、发布资格和阻断列表。

runtime validator 会 fail closed 检查：重复 `locationId`/`adminCode`、canonical name 冲突、跨记录 alias 冲突、非法/非有限经纬度、非 `Asia/Shanghai`、缺逐行 provenance/license、release-ready 仍有 unknown/restricted/blocked license 或缺字段、`locationId` 被替换为 `adminCode`，以及没有 `supersedes`/`replacedBy` 的身份替换。当前 prototype/partial 审计可以被读取，但只能保持 blocked。

别名解析策略仍是精确规范化匹配。冲突别名必须补省份限定或要求用户从候选中选择；不能用包含关系、相邻城市或默认中心点猜测出生地。

## 当前来源与许可审计

现有生产表没有复制第三方数据库文件；`source` 仍为“观象首发大陆城市表（人工整理的城市中心近似坐标）”，`sourceVersion` 保留原 `china-cities-p1f-mainland-v1`，`retrievedAt` 未记录。P5-B1 不凭空补来源或许可证。下面是后续 B2/B3 的候选来源，状态是审计判断，不是已取得授权：

| 候选来源 | 可支持的字段/用途 | 许可/合规状态 | 当前处理 |
|---|---|---|---|
| [中国·国家地名信息库行政区划版本发布入口](https://dmfw.mca.gov.cn/XzqhVersionPublish.html) | 官方行政区划名称、代码、版本和变更核对 | 可作为权威核对入口；未确认可把数据离线复制到商业 App 的书面再分发许可 | `UNKNOWN`；B2 先做版本与变更审计，不直接导入生产 |
| [GeoNames About](https://www.geonames.org/about.html) / [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | WGS84 坐标、地名和 alternate names 候选 | 页面声明数据可在 Creative Commons Attribution 许可下下载，需归因；非中国官方行政权威，具体导出/衍生使用仍需逐项记录 | `CANDIDATE`；可作为坐标候选，不能单独证明行政层级 |
| [OpenStreetMap copyright/licence](https://www.openstreetmap.org/copyright) / [ODbL 说明](https://wiki.openstreetmap.org/wiki/Open_Database_License) | 地名、边界、地点坐标候选 | ODbL 归因、数据库/衍生数据库义务和数据组合兼容性较复杂；不能在未做合规设计前打包进离线商业数据 | `BLOCKED_PENDING_REVIEW` |
| [Natural Earth Terms of Use](https://www.naturalearthdata.com/about/terms-of-use/) | 小比例尺地图/区域示意候选 | 页面声明站内 raster/vector 数据为 public domain，但不保证中国地级行政区完整性或坐标适用性 | `CANDIDATE_FOR_MAP_ONLY`；不作为城市行政数据主源 |
| [天地图](https://www.tianditu.gov.cn/) | 中国地图/地理信息服务候选 | 当前未取得适用于离线商业再分发的书面许可和数据包条款 | `BLOCKED` |
| [国家基础地理信息公共服务平台](https://www.webmap.cn/) | 国家基础地理数据候选 | 当前未取得适用于本 App 离线复制、打包和商业分发的书面许可 | `BLOCKED` |

以上链接和许可页面已于 2026-09-02 复核作为候选入口；无法确认的内容保留 `UNKNOWN`/`BLOCKED`，不从网页可访问性推导授权。GeoNames、OSM 和 Natural Earth 只能支持各自公开页面明确的范围；它们不是本批生产数据的既成来源。

## 发布门与下一批

只有当每条记录的行政身份、名称/别名、坐标、版本、取数时间、归因、许可证和变更链均有可回查证据，且覆盖目标、冲突处理和离线分发条款通过独立审查，才可以把数据集标记为 `status=complete`、`releaseEligibility=release-ready`。validator 对任何缺字段、unknown/restricted/blocked license 或残留 blocker 都拒绝 release-ready。

下一批固定为 **P5-B2 行政区划名称/代码与历史变更审计**：先核对官方版本、地级行政层级与 `adminCode` 映射，继续保持新记录 + 显式 `supersedes`/`replacedBy`，在完成来源/许可决策前不扩充生产城市表。坐标候选筛选、别名补全和全国覆盖仍需独立批次，不得由本批快照推断已完成。

## P5-B2 来源决策审计（2026-09-02）

P5-B2 已完成一手网页/GitHub 证据收敛，但没有证明任何单一来源同时满足“中国大陆地级行政区权威名称、六位代码、坐标、别名、历史变更”和“合法商业离线再分发”。因此本批采取 **fail-closed**：新增 `src/data/city-source-decision.ts` 中的纯 JSON `p5-b2-city-source-decision.v1` 快照和 runtime validator，`releaseDecision=BLOCKED`；不导入生产城市表，不关闭 `p5-a4a-cross-city-coverage`。

审计快照 `china-cities-p5-b2-source-audit-2026-09-02` 的每条证据固定 `URL`、`sourceVersion`、`sha256` 内容哈希和 `retrievedAt=2026-09-02T21:36:30.1129972+08:00`。证据哈希是本次只读响应的记录，不代表上游授予许可；遗留行政沿革页面以 `http-legacy` 显式标记。

### 来源矩阵

矩阵顺序为 `authority / completeness / freshness / stableCodes / coordinates / aliases / history / licenseClarity / redistributionFit / operationalCost`；`strong`、`partial`、`weak`、`unknown`、`blocked` 的逐项事实、URL、版本、哈希位于 source-decision 合同，表格只给决策摘要。

| 来源 | 覆盖层级/版本与上游 | 维度摘要（按上述顺序） | 坐标/别名/历史 | 数据文件许可与商业离线再分发 | 决策 |
|---|---|---|---|---|---|
| [民政部行政区划版本页](https://dmfw.mca.gov.cn/XzqhVersionPublish.html) / [只读 API](https://dmfw.mca.gov.cn/xzqh/getList?code=0&trimCode=true&maxLevel=3) / [年度变更入口](http://xzqh.mca.gov.cn/description?dcpid=1) | 省/地/县/乡四级；`Xzqh20251231`，数据截止 2025-12-31；上游为民政部 | strong / partial / strong / strong / blocked / unknown / strong / unknown / unknown / partial | 当前树可作名称/代码核验；未提供已许可逐行坐标/别名文件；年度页 2021–2026 可人工核验沿革 | 页面/API/规章未见商业离线复制条款；无明确数据文件 license/ShareAlike 条款 | `UNKNOWN`；只人工核验 |
| [GB/T 2260-2007](https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=C9C488FD717AFDCD52157F41C3302C6D) | 国家标准代码形态参考；发布 2007-11-14、实施 2008-02-01；上游为国家标准平台 | strong / weak / weak / strong / blocked / blocked / blocked / unknown / unknown / partial | 仅代码标准/文本，不是当前城市数据，不含坐标、别名、历史 | 标准平台有版权声明，未证明标准表格可商业离线复制 | `UNKNOWN`；仅内部参考 |
| [GeoNames Export](https://www.geonames.org/export/index.html) / [Readme](https://download.geonames.org/export/dump/readme.txt) | 全球地名；daily extract；上游为 GeoNames 聚合来源 | weak / partial / strong / weak / strong / strong / partial / strong / partial / partial | WGS84 经纬度；`alternateNamesV2` 有语言/首选/历史及 from/to；不提供中国官方六位码 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 明确允许商业使用/分享，需归因和修改说明；聚合第三方权利仍待逐行审查；无 ShareAlike | `CANDIDATE`；仅坐标/别名候选 |
| [modood 仓库](https://github.com/modood/Administrative-divisions-of-China) / [README](https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/README.md) | 省/市/区县/乡镇/村五级；NBS 统计代码截止 2023-06-30；仓库最新 commit `c49d495`（2025-12-27） | partial / partial / blocked / partial / blocked / blocked / blocked / weak / blocked / weak | 名称/统计码与 SQLite；无坐标、别名、历史映射 | [WTFPL](https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/LICENSE) 仅是仓库许可，不能推断 NBS 数据文件权利 | `BLOCKED` |
| [kk-418/cn-division](https://github.com/kk-418/cn-division) / [MIT](https://raw.githubusercontent.com/kk-418/cn-division/main/LICENSE) | README 标注 2026.0.0/342 地级城市，大陆范围；上游自述为民政部 REST；commit `cc9c0c4`（2026-04-26） | partial / strong / strong / strong / blocked / blocked / blocked / weak / unknown / partial | 代码层级/六位形态候选；无坐标、别名、历史；README `/9095` 接口观测与当前根路径存在差异 | MIT 只覆盖仓库作品；未证明 MCA API 响应/衍生数据授权 | `UNKNOWN`；待书面授权 |
| [adyliu/china_area](https://github.com/adyliu/china_area) / [GPL-3.0](https://raw.githubusercontent.com/adyliu/china_area/master/LICENSE) | 五级、多年 2010–2024 快照；源为 NBS 2023 统计代码；最新 commit `eea7df7`（2023-12-23） | partial / strong / blocked / partial / blocked / blocked / partial / weak / blocked / weak | 历史快照可比较；无坐标/逐行别名/法定沿革语义 | GPL-3.0 数据库传播风险与 NBS 上游权利不明叠加，不能用于首发商业包 | `BLOCKED` |
| [OpenStreetMap copyright](https://www.openstreetmap.org/copyright) / [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) | 全球地图/地点；持续更新；上游为 contributors/OSMF | weak / partial / strong / weak / strong / partial / partial / strong / blocked / weak | 可提供地图坐标/标签/编辑历史，但不等于中国行政代码沿革 | ODbL 允许有条件商业利用但有归因、通知、衍生数据库 ShareAlike；组合传播边界未设计 | `BLOCKED`；不混入首发包 |
| [Natural Earth Terms](https://www.naturalearthdata.com/about/terms-of-use/) | 全球制图底图；项目条款版本由页面确定；上游为 Natural Earth | weak / partial / unknown / blocked / partial / weak / blocked / strong / strong / partial | 地图几何可视化；不提供六位代码、逐行别名或沿革 | 项目 raster/vector 数据声明 public domain、可商业电子传播；第三方例外须分离核查 | `CANDIDATE`；仅地图层 |

### 已确认事实、unknown 与授权清单

- 已确认：民政部版本页声明全国省、地、县、乡四级行政区划代码，当前数据截止 2025-12-31；行政区划代码管理办法（[司法部页面](https://www.moj.gov.cn/pub/sfbgw/flfggz/flfggzbmgz/202512/t20251204_528920.html)）规定代码唯一、撤销不复用、年度发布和变更赋码；GB/T 2260 可作代码形态参考。
- 已确认：GeoNames 官方导出/Readme/CC BY 4.0 明确商业使用、归因、WGS84、alternate names 和历史日期字段；OSM 官方页面/ODbL 明确数据库传播与 ShareAlike 义务；Natural Earth 条款对项目数据给出 public-domain 口径。
- 已确认：modood README 明确 2023 截止且不再更新；kk-418 README 提供较新 MCA 候选但仓库 MIT 不覆盖已证明的上游数据权利；adyliu 有历史快照但 GPL-3.0 且陈旧。
- Unknown：民政部页面/API、GB/T 表格和两个 GitHub 仓库中的上游数据，是否允许本 App 复制、打包、离线商业再分发；民政部名称/代码与 GeoNames/OSM 坐标别名逐行对应关系；历史代码废止/换码与稳定 `locationId` 的完整映射；第三方聚合数据的权利链和商标/人格权例外。

首发前必须取得或留档：

1. 民政部/权利人书面确认名称、六位代码、年度历史变更页面/API 响应可被复制进离线商业 App，并允许保存版本、哈希和归因；或者法务书面结论明确许可依据和边界。
2. 每个坐标/别名记录的来源、版本、哈希、取数时间、精度（仅 `city-center-approximate`）、归因和许可；冲突别名不首条猜测。
3. GeoNames 需要随包 CC BY 链接、来源/修改说明和第三方来源审查；OSM 需要单独 ODbL 兼容数据库/通知方案；GPL 候选不得混入未审计的首发数据库。
4. 法务确认数据库组合是否触发 ODbL ShareAlike、GPL 传播、标准文本版权或其他上游限制；确认应用稳定 `locationId` 与 `adminCode` 分离、历史 `supersedes/replacedBy` 不会构成绕过许可。

### 组合方案与下一最小实现批

推荐组合为“官方页面仅人工核验 + 明确许可的数据包 + app 稳定 `locationId`”：民政部只用于人工确认当前名称/代码/公告，GeoNames 只能在 CC BY 归因和逐行核验后作为坐标/别名候选，`locationId` 永不被 `adminCode` 静默替换。当前没有合法再分发证明，主管决策应为 **fail closed**。

下一最小实现批只允许 source-decision/audit tooling：固定 manifest 的 URL/version/hash/retrievedAt/license/attribution，校验逐行血缘、代码/坐标/别名/历史链和数据库许可证风险；不导入未获授权数据。来源许可充分后，另立 pilot import 批，必须先定义 source/version/hash/schema/test/DoD、审查归因和回滚，再允许生产路径；当前 P5-C 可独立继续，不能将本快照误标为城市覆盖完成。

本批质量与远端证据：本地 commit `a58ca0b`（完整 SHA 由 Git 固定，parent `6fe3f81`）；远端等价 commit `57d87c706ca8e9501cefe0c5f11c9dd618ccd692`，parent 为指定基线 `65b6bb7e6fcc94d1e324f86918263fcd2b100f9c`。`git diff --check`、`npm run typecheck`、`npm run lint`、专项 `tests/p5-city-source-decision.regression.mjs` **8/8**、统一 `npm test` **190/190** 和 `npm run build:web` **8 routes** 均 PASS；`npm audit --omit=dev` 保持 **0 critical / 9 high / 16 moderate / 0 low（25 total）**，未执行破坏性升级。GitHub Actions [run 33639738697](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33639738697) / [validate job 100279504893](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33639738697/job/100279504893) 为 `completed/success`，Typecheck、Lint、Regression tests 与 Web Export 均实际执行且 Web Export 非 skip。
