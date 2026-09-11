<!-- AIGC START -->
# LarderMind — iOS（TestFlight → App Store）上线 Todo

**Created:** 2026-09-09  
**Updated:** 2026-09-09  
**Goal:** iOS 先行；先用 **TestFlight** 给家人用，再视情况公开上架 App Store  
**生产 API：** Nest `backend-node`  
**订阅：** Pro 一起做（StoreKit / App Store IAP）  
**功能范围：** 不冻结  
**Android / Play：** 本轮延后 ⏭  

> 状态约定：`[ ]` 未开始 · `[~]` 进行中 · `[x]` 完成 · `⏭` 本轮可延后

### 已拍板（Phase 0）

| 项 | 决定 |
|----|------|
| 首发平台 | **iOS**（先 TestFlight；公开 App Store 可选下一阶段） |
| 首发模式 | **Pro 订阅一起上**（Apple IAP） |
| 生产 API | **Nest `backend-node`** |
| 功能范围 | **不冻结** — 不主动砍功能；「较低优先级」仅作参考 |
| Android | **延后** |

---

## Phase 0 — 范围确认

- [x] 确认首发平台：**iOS**（TestFlight 优先；App Store 公开后做）
- [x] 确认首发模式：**Pro 订阅一起上**
- [x] 确认生产 API：**Nest `backend-node`**
- [x] 功能范围：**不冻结**
- [x] Android / Play：**本轮不做**

---

## Phase 1 — 生产后端就绪

- [ ] 生产环境部署 Nest（Render / Railway 等），HTTPS 稳定
- [ ] 生产 Postgres 迁移（含 chat-langgraph sessions 相关 SQL）
- [ ] 环境变量齐全：JWT、DB、LLM、Cloudinary、CORS、订阅相关
- [ ] Health check 通过；CORS 只放行正式域名 / App
- [ ] Chat send / stream / history / resume 生产冒烟
- [ ] Subscription status / quota 生产冒烟
- [ ] 确认 mobile EAS 的 `EXPO_PUBLIC_API_BASE_URL` 指向生产 Nest API
- [ ] 备份与基本监控（至少错误日志可查：平台 Logs + `/api/health` 存活探测）

---

## Phase 1.5 — Apple 账号与 EAS（TestFlight 前置）

- [ ] 注册 / 续费 **Apple Developer Program**（约 $99/年）
- [ ] App Store Connect 创建 App（Bundle ID = `com.lardermind.app`）
- [ ] Expo / EAS 绑定 Apple 账号；能打出 **iOS** 签包
- [ ] 老婆（及家人）Apple ID 加入 TestFlight 测试员

---

## Phase 2 — 真机 IAP（StoreKit / App Store）

> TestFlight 若要测真实订阅，需在 App Store Connect 建好订阅商品 + Sandbox / 订阅测试流程。

- [ ] App Store Connect 创建订阅：`com.lardermind.pro.monthly` / `com.lardermind.pro.yearly`
- [ ] 重写 `mobile/src/services/iapService.ts`：接真 `react-native-iap`（iOS StoreKit；去掉 mock）
- [ ] 收据 / 交易走后端 `validate-receipt` / `sync`（platform=`ios`）
- [ ] Restore Purchases 可用且文案合规
- [ ] 试用 / Pro / 免费额度 UI 与后端一致
- [ ] Sandbox / TestFlight 测：购买、续订、取消、恢复
- [ ] 非 Pro 触达 AI 配额上限时有清晰引导升 Pro
- [ ] ⏭ Google Play Console 订阅商品（Android 后做）
- [ ] ⏭ Play Billing 购买流（Android 后做）

---

## Phase 3 — 合规材料

> **先给老婆 TestFlight：** 隐私政策建议尽快有；完整商店截图可稍后。  
> **公开 App Store：** 下列多数变为硬性。

- [ ] 上线 Privacy Policy 公开 URL
- [ ] 上线 Terms of Service 公开 URL（公开上架前）
- [ ] App 内可打开隐私政策 / 条款（Settings）
- [ ] **账号删除**入口 + 后端删除 / 匿名化（公开上架硬性；TestFlight 也建议有）
- [ ] ⏭ App Privacy 问卷 / 年龄分级 / 商店截图与文案（公开上架时做）
- [ ] ⏭ 客服联系方式、订阅自动续订披露（公开上架时做）

---

## Phase 4 — iOS 构建与质量闸门

- [ ] EAS 打出可安装的 **iOS** 包（preview / production）
- [ ] 去掉 / 关闭 stub 购买等会误导的路径
- [ ] 核心路径真机手测：
  - [ ] 注册 / 登录 / 登出
  - [ ] Chat 空态 → 发消息 → 工具卡片
  - [ ] 库存 CRUD
  - [ ] 购物清单（在线 + 离线再同步）
  - [ ] 菜谱 CRUD
  - [ ] 餐计划增删
  - [ ] Subscription 购买 / 恢复 / Pro 状态（若本轮已接 IAP）
  - [ ] 杀进程重启后登录态与关键数据正常
- [ ] 首发 blocker 级崩溃 / 明显 UI 问题清零
- [ ] 权限文案合理（相册 / 相机若使用须说明用途）
- [ ] 半残入口优先修（不冻结：能修则修）

---

## Phase 5 — TestFlight（本轮主目标）

- [ ] 上传 build 到 App Store Connect
- [ ] 通过 TestFlight Beta 审核（如需要）
- [ ] 邀请老婆（及家人）安装 TestFlight → 安装 LarderMind
- [ ] 收集反馈：闪退、登录、聊天、购买
- [ ] 修完再发新 build 迭代

---

## Phase 6 — 公开 App Store（可选下一阶段）

- [ ] 商店材料齐全（截图、描述、App Privacy、账号删除等）
- [ ] App Store Connect 正式提审
- [ ] 审核备注：测试账号、IAP 路径
- [ ] 通过后上架；盯崩溃 / API / 订阅
- [ ] ⏭ Google Play 公开上架（更后）

---

## 较低优先级（不冻结 — 可穿插）

- [ ] 忘记密码
- [ ] Mobile Google 注册完善
- [ ] Settings 云端持久化
- [ ] Landing waitlist 接真
- [ ] Web 订阅 / Stripe Checkout UI（Web 收费再用；App 内仍走 Apple IAP）
- [ ] Spring 完全下线、只留 Nest
- [ ] 更全自动化测试 / CI 重建
- [ ] Android / Play Billing

---

## 建议里程碑（iOS + TestFlight）

| 里程碑 | 目标日（自 2026-09-09） |
|--------|------------------------|
| Nest 生产 API + 冒烟 | ~09-16 |
| Apple Developer + EAS iOS 签包 | ~09-18 |
| StoreKit / 订阅沙盒打通 | ~09-25 |
| 首个 TestFlight 给老婆用 | ~09-30 |
| TestFlight 稳定迭代 | ~10-07 |
| （可选）正式提审 App Store | 视情况 |

---

## 相关代码 / 配置

| 项 | 位置 |
|----|------|
| Mobile EAS profiles | `mobile/eas.json` |
| Bundle ID | `mobile/app.json` → `com.lardermind.app` |
| IAP stub（待替换） | `mobile/src/services/iapService.ts` |
| Subscription API client | `mobile/src/api/subscription.ts` |
| Nest subscription | `backend-node/src/subscription/` |
| Usage quota | `backend-node/src/usage-quota/` |
| Product IDs | `com.lardermind.pro.monthly` / `com.lardermind.pro.yearly` |

---

## Notes

- 本轮主路径：**Apple Developer → EAS iOS → TestFlight → 老婆安装**。
- App 内解锁 Pro 必须走 **Apple IAP**，不能只用 Stripe 替代。
- Windows 本机无 Xcode；用 **EAS 云端构建**即可。
- 当前 `iapService` 仍是 mock；接真 StoreKit 前，TestFlight 也能先测主功能（订阅页可能仍是 stub）。
- `PROJECT_STATUS.md` 偏旧；以本文件 Phase 0 为准。
<!-- AIGC END -->
