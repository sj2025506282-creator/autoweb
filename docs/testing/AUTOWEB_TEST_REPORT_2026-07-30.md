# AutoWeb 架构与测试闭环报告

日期：2026-07-30  
状态：全部通过

## 覆盖矩阵

| 功能点 | 用例数 | 结果 |
| --- | ---: | --- |
| Google Places 搜索与无官网识别 | 12 | PASS |
| Demo 导入与数据约束 | 14 | PASS |
| Demo 审核与邮件事务 | 14 | PASS |
| 管理员/餐厅所有者权限边界 | 11 | PASS |
| 公开预约校验与限流 | 13 | PASS |
| 登录、JWT 与密码生命周期 | 16 | PASS |
| 进程内请求限流 | 10 | PASS |
| 合计 | 90 | PASS |

每个功能点均超过“至少 10 个测试用例”的验收线。测试运行于 Cloudflare Workers Vitest Pool，并对独立 D1 测试数据库执行真实迁移与查询。

## 缺陷闭环

| 编号 | 严重度 | 缺陷 | 失败证据 | 修复 | 状态 |
| --- | --- | --- | --- | --- | --- |
| BUG-TINF-001 | P1 | Vitest Pool 配置引用了错误的包导出路径 | 测试进程无法加载配置 | 改用包公开入口 | CLOSED |
| BUG-TINF-002 | P1 | API 包缺少 ESM 声明 | Workers 测试运行时模块加载失败 | 增加 `type: module` | CLOSED |
| BUG-OUT-001 | P0 | `sendEmail` 未传时仍默认发送邮件 | 新增回归用例失败，邮件请求被调用 | 仅在 `sendEmail === true` 时发送 | CLOSED |
| BUG-OUT-002 | P2 | 外联时间写入 ISO 格式，与 SQLite 时间格式不一致 | 回归用例检测到 `T`/`Z` 格式 | 统一由 SQLite `datetime('now')` 写入 | CLOSED |
| BUG-RES-001 | P1 | 当前时间之前不足 60 秒的预约仍可创建 | “过去 30 秒”用例返回 201 | 直接与当前毫秒时间比较 | CLOSED |
| BUG-PLACES-001 | P1 | 非法 `websiteUri` 被误判为已有官网 | 非法 URL 的 `hasWebsite` 为 true | 仅接受可解析的 HTTP/HTTPS URL | CLOSED |
| BUG-AUTH-001 | P1 | JWT 签名有效时未校验载荷字段和角色枚举 | 签名正确但角色非法的 token 可被解析 | 严格校验 subject、email、role、restaurantId | CLOSED |
| BUG-OUT-003 | P1 | 并发审核可能重复发送外联邮件 | 两个请求均可通过先查后改窗口 | 数据库原子认领审核权，并发请求返回 409 | CLOSED |
| BUG-OUT-004 | P1 | 并发导入相同 Google Place 时应用层查重存在竞态 | 并发请求可同时通过预检查 | 保留数据库唯一索引并将唯一约束冲突映射为 409 | CLOSED |
| BUG-AUTH-002 | P1 | Cloudflare 生产运行时拒绝超过 100,000 次的 PBKDF2 | 线上修改密码返回 500，Worker 日志报告迭代数超限 | 使用平台支持上限 100,000 次并保留独立向量和篡改测试 | CLOSED |

## 验证命令

```bash
pnpm test
pnpm check:size
pnpm lint
pnpm --filter @autoweb/api exec tsc --noEmit
pnpm --filter @autoweb/api build
API_BASE_URL=https://api.example.invalid pnpm --filter @autoweb/web build
```

持续集成已加入全量测试步骤；根目录 `pnpm check` 也会先执行源码行数检查和测试，再执行 lint 与构建。
