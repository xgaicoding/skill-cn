<!--
  v1.6.0 登录体系升级 技术方案
  说明：
  - 本文面向落地实现，聚焦“最小闭环 + 可验收”。
  - 保持现有 GitHub OAuth 流程不变，仅新增邮箱登录与重置能力。
  - 本期支持移动端适配，登录弹窗采用 Bottom Sheet 形态。
-->

# v1.6.0 登录体系升级 技术方案 / 实施计划

## 0. 目标与范围
### 0.1 目标
- 在保留 GitHub OAuth 的基础上，新增 Email + Password 登录。
- 提供统一登录弹窗：登录 / 注册 / 忘记密码三视图切换。
- 移动端使用 Bottom Sheet 形态，保持体验一致。
- 支持密码重置闭环，落地 `/auth/reset-password` 页面。
- 新建 `user_profiles` 存储昵称与头像兜底信息。
- 登录后用户菜单显示昵称，邮箱用户显示默认头像。

### 0.2 不在本期范围
- 收藏/投稿/个人主页等用户体系功能（v1.7+）。

---

## 1. 关键依赖与配置
### 1.1 Supabase Dashboard
- 启用 Email Provider；密码最少 8 位；开发阶段关闭邮箱验证。
- 配置重置密码重定向地址（Redirect URLs）包含 `/auth/reset-password`。

### 1.2 客户端 Auth 配置约束
- 浏览器端使用现有 `getSupabaseBrowserClient()`：`flowType=pkce`、`detectSessionInUrl=false`。
- 由于禁用自动解析，需要在重置页**手动交换 code**并恢复 session。
- 重置链接参数需兼容两种格式：`?code=xxx` 或 `#access_token=xxx`（以实际邮件链接为准，需测试确认）。
- 当 code 缺失或交换失败时，提示“链接已失效/过期”，并提供“重新发送”入口。

---

## 2. 认证流程设计（可落地口径）
### 2.1 邮箱登录
- 入口：登录弹窗的“登录”视图。
- 调用：`supabase.auth.signInWithPassword({ email, password })`。
- 成功：关闭弹窗，Header 变为已登录态。
- 失败：展示“邮箱或密码错误”提示。

### 2.2 邮箱注册
- 入口：登录弹窗的“注册”视图。
- 调用：`supabase.auth.signUp({ email, password })`。
- 开发阶段（邮箱验证关闭）：自动登录并关闭弹窗。
- 上线阶段（邮箱验证开启）：提示“请查收验证邮件”并保持弹窗可关闭。

### 2.3 忘记密码
- 入口：登录弹窗“忘记密码”视图。
- 调用：`supabase.auth.resetPasswordForEmail(email, { redirectTo })`。
- `redirectTo` 固定为 `/auth/reset-password`。
- 成功：Toast “重置链接已发送”，切回登录视图。

### 2.4 重置密码回调页
- 路由：`/auth/reset-password`。
- 读取 URL 中的 `code` 或 `hash` token，调用 `supabase.auth.exchangeCodeForSession(...)`。
- 显示“设置新密码”表单，提交时调用 `supabase.auth.updateUser({ password })`。
- 成功：Toast “密码已重置”，跳转首页。
- 失败：提示“链接已失效/过期”，提供重新发送入口（打开弹窗的忘记密码视图）。

### 2.5 Auth 封装约束
- 新增 Email 认证能力统一封装在 `lib/auth.ts`，与 `signInWithGitHub` 保持一致调用方式。
- 组件内不直接调用 Supabase SDK，统一走 `lib/auth.ts` 函数。

---

## 3. 组件与页面拆分
### 3.1 新增组件
- `components/auth/AuthModal.tsx`
  - 负责三视图切换与整体布局。
  - 控制 Loading、错误提示与按钮禁用。

- `components/auth/AuthModalContext.tsx`
  - 全局控制弹窗打开/关闭。
  - 暴露 `openAuthModal(view)`，供 Header 等任意位置调用。

### 3.2 新增页面
- `app/auth/reset-password/page.tsx`
  - 负责 code 交换与新密码提交。
  - 与 `app/auth/callback` 保持相同的 Suspense + Client 组件结构。

### 3.3 现有组件改动
- `components/AuthActions.tsx`
  - 登录按钮改为打开弹窗（不直接跳转 OAuth）。
  - 邮箱用户显示默认头像（昵称首字符）。
  - 用户菜单显示昵称。

---

## 4. 数据层（user_profiles）
### 4.1 字段设计（最小集）
- `nickname`：GitHub 用户取用户名；邮箱用户取邮箱前缀。
- `avatar_url`：GitHub 用户头像；邮箱用户为空。
- `bio`：预留字段，本期不提供编辑入口。

### 4.2 自动创建策略
- `auth.users` 新增记录时自动创建 `user_profiles`。
- 对历史 GitHub 用户执行一次补建迁移。

### 4.3 权限策略（RLS）
- 所有人可读（用于展示昵称/头像）。
- 仅本人可更新。

### 4.4 昵称读取与数据流
- 登录成功后，从 `user_profiles` 拉取昵称与头像信息并缓存在客户端状态（Context/Hook）。
- GitHub 用户也走 Profile 读取，避免只依赖 `user.user_metadata`。

---

## 5. UI / 动效策略
- 弹窗：PC 为居中 Modal，移动端为 Bottom Sheet。
- 动画仅使用 `transform + opacity`，并开启 `translate3d` 以触发 GPU。
- `prefers-reduced-motion: reduce` 时禁用动效。
- 移动端样式覆盖放在 `app/mobile.css`，避免污染桌面布局。

---

## 6. 关键异常与兜底
- 邮箱已注册：提示“该邮箱已注册，请直接登录”。
- 密码错误：提示“邮箱或密码错误”。
- 重置链接过期：提示“链接已失效”，提供重新发送入口。
- Supabase 未配置：提示“服务暂不可用”。

---

## 7. 验收与自测清单
- 登录弹窗三视图可切换，ESC/遮罩关闭。
- 邮箱注册成功后：开发阶段自动登录；开启验证时提示邮件验证。
- 邮箱登录成功后：Header 更新、菜单显示昵称。
- 忘记密码 → 收到邮件 → 重置页可设置新密码。
- 邮箱用户默认头像展示稳定（昵称为空时有兜底字符）。
- GitHub 登录流程与回调页行为保持不变。
- 移动端登录弹窗为 Bottom Sheet 形态。

---

## 8. 实施步骤（建议拆分）
1. user_profiles 表 + 触发器 + 迁移脚本（数据层先就位）。
2. `lib/auth.ts` 新增 Email 认证函数。
3. AuthModalContext + 弹窗 UI（三视图切换，含移动端 Bottom Sheet）。
4. 重置密码回调页与 code/hash 交换逻辑。
5. AuthActions 改造（弹窗触发 + 昵称 + 默认头像）。
6. 动效与细节优化（动画性能 + 失败兜底）。
