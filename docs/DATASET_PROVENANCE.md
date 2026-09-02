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
