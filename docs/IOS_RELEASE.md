# 观象·命盘 iPhone / TestFlight 交付说明

> 版本：2026-09-03。配置已到签名/上传前；没有 Apple Developer、Bundle ID 注册确认、证书、设备和 TestFlight 权限，不声称已生成可安装包。

## 已准备的仓库配置

- `app.json`：`name=观象·命盘`、`slug=guanxiang-mingpan`、深色、竖屏、`bundleIdentifier=com.guanxiang.mingpan`、`supportsTablet=false`、图标和 splash 资源。
- `eas.json`：提供不带开发工具的 `preview` 内部分发档和 `production` 商店档；不写入账号、项目 ID 或签名凭据，避免把未配置的 EAS 账户误当成已就绪。
- 未声明相机、麦克风、通讯录、持续定位或推送权限；文件选择/分享只在用户主动操作时调用系统界面。
- `SafeAreaView`、`KeyboardAvoidingView`、系统字体缩放和 `AnimatedReveal` 的 reduce-motion 分支在共享 Web/native 组件中实现。
- 普通 JSON 与 scrypt + AES-256-GCM 加密备份共用本地导出/导入合同；密码不上传、不写入备份正文。

## 签名前准备

1. 由发布负责人确认 Apple Developer 团队、正式 Bundle ID、最低 iOS 版本、商标/主体和出口合规申报；不要把 `com.guanxiang.mingpan` 当作已注册事实。
2. 在 macOS/Xcode 或 EAS 已登录环境运行依赖安装、按 `eas.json` 选择 `preview`/`production` profile，必要时再运行 `npx expo prebuild --clean`（仅在确认生成物可回滚时）和 release 构建；提交前保存构建号、签名主体和产物 hash。
3. 使用真实 iPhone 检查冷启动、深色模式、动态文字、减少动态效果、键盘遮挡、安全区、四术流程、失败/只读边界、普通/加密文件流、合并/替换和恢复回滚。
4. 使用 VoiceOver、Safari WebView、系统文件 App 和分享面板完成设备批验收，填写 `docs/DEVICE_ACCEPTANCE.md` 的型号/iOS/构建号/证据/签字字段。

## 当前阻断

签名证书、Provisioning Profile、Apple Developer 权限、真实设备和 TestFlight 审核权限属于外部条件。没有它们只能完成仓库配置和清单，不能写 PASS、不能伪造上传或 TestFlight 链接。
