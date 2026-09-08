# Production 依赖审计记录（2026-09-08）

## 结论

`npm audit --omit=dev` 真实结果为 `0 critical / 9 high / 17 moderate / 0 low`，共 26 项，生产依赖树 609 个包。审计命令以非零退出（exit 1）结束，不能把当前工程描述为“无漏洞”。本轮没有执行会破坏 Expo SDK 57 兼容性的 `npm audit fix --force`。

当前直接生产依赖版本锁定在 Expo SDK 57（`expo@57.0.7`、`expo-router@57.0.7`、React Native 0.86），命理依赖为 `taibu-core@3.4.0`、`iztro@2.5.8`、`circular-natal-horoscope-js@1.1.0`。`npm ls --omit=dev --depth=0` 通过。

## 逐项可达性与处理

| 依赖/链路 | 严重度 | 当前处理 | 发布判断 |
|---|---:|---|---|
| `@xmldom/xmldom` ← `plist`/`xcode` ← Expo 配置链 | moderate | 仅由 Expo/原生配置工具链带入；不接受不兼容的强制升级 | 保留，升级 Expo 时复审 |
| `brace-expansion` | high | 传递依赖；未发现运行时业务输入把 brace 模式交给该库 | 保留，升级上游时复审 |
| `browserslist` | high | Web 构建工具链依赖；不是用户数据解析路径 | 保留，升级 Expo/Metro 时复审 |
| `decode-uri-component` ← `query-string` ← `expo-router` | moderate | 修复建议要求 `expo-router` major 变更；当前路由版本与 SDK 57 配套 | 保留，待 Expo 路由兼容升级 |
| `image-size` ← Metro | high | Web/Native 打包工具链；不在业务运行时解析用户图片 | 保留，升级 Metro 时复审 |
| `js-yaml` | high | CLI/配置链传递依赖；不接收用户 YAML | 保留，升级 Expo CLI 时复审 |
| `nanoid` | high | 传递依赖；应用自己的记录 ID 使用本地 `createId`，没有把外部 size 参数暴露给用户 | 保留，升级上游时复审 |
| `postcss` | moderate | Web 构建链；应用不把不可信 `sourceMappingURL` 当构建输入 | 保留，升级 Web 工具链时复审 |
| `uuid` ← `xcode` ← Expo 配置链 | moderate | 修复建议会把 Expo 降到旧 major，不符合 SDK 57 | 保留，待上游兼容修复 |
| `@expo/cli`、`@expo/config*`、`metro*`、`expo`、`expo-sharing`、`expo-splash-screen` 聚合项 | moderate/high | 均为 SDK 57 生态链的兼容聚合报告，不通过 force 方式拆散版本 | 保留，作为发布阻塞审计项 |

## 门禁与复核

- `npm run security:scan`：通过，无密钥扫描命中。
- `npm run security:audit`：通过脚本门禁，但仅表示报告成功生成；数字仍为 `0/9/17`。
- 每次升级 Expo/Metro/Router 后必须重新运行 `npm ci`、`npm audit --omit=dev`、`npm test`、`npm run build:web` 和 `npm run verify:web`。
- 在没有兼容矩阵和新 CI 绿色证据前，禁止使用 `npm audit fix --force`，也不能将 26 项漏洞包装为已清零。

