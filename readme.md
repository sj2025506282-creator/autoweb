## 目的

这是一个做网站的项目，目前是帮餐馆做网站

## 兼容性

pc端和移动端

## 网站内容

- 餐馆的菜单、价钱、联系方式、地址展示（从接口获取）
- 预定功能
- 后台管理功能
- 有好几种布局样式可以选择

##  seo
搜索店名的时候能搜索到这个商店

## Cloudflare 部署

当前架构包含两个 Worker：

- `autoweb-api`：Hono API，绑定 D1 和 R2
- `autoweb-web`：Next.js 16 经 OpenNext 适配后的 SSR Worker

生产环境不能直接上传 `.next` 目录。项目已经配置
`@opennextjs/cloudflare`，GitHub Actions 会先执行质量检查和数据库迁移，
再依次部署 API 与 Web。

GitHub 仓库需要配置：

- Secrets：`CF_API_TOKEN`、`CF_ACCOUNT_ID`、`API_BASE_URL`
- Variable：`MAIN_DOMAIN`

Cloudflare API Worker 需要配置：

```bash
cd apps/api
pnpm wrangler secret put JWT_SECRET
pnpm wrangler secret put RESEND_API_KEY
pnpm wrangler secret put GOOGLE_PLACES_API_KEY
pnpm wrangler d1 migrations apply autoweb-db --remote
```

数据库迁移不会创建默认管理员或共享密码。部署后必须通过受控的运维流程
显式创建管理员；后续密码使用 PBKDF2-SHA256，旧哈希仅保留登录兼容。


## 自动化流水线

自动化工作流做

### Google Maps 获客搜索

后台 `/outreach` 已接入 Google Places API (New) Text Search：

- 按“餐馆类型 + 城市”搜索餐馆
- 默认筛选 Google 商家资料中没有官网的候选
- 查看评分、电话、地址和 Google Maps 来源
- 一键填充餐馆资料并生成待审核 Demo
- 使用 Google Place ID 防止重复生成同一家餐馆

本地开发时在环境中配置：

```bash
GOOGLE_PLACES_API_KEY=your_server_side_google_places_key
```

生产环境通过 Worker secret 配置，密钥不能放入 `NEXT_PUBLIC_*`：

```bash
cd apps/api
pnpm wrangler secret put GOOGLE_PLACES_API_KEY
pnpm wrangler d1 migrations apply autoweb-db --remote
```

Google Cloud 项目需要启用 Places API (New) 和结算。搜索会请求
`websiteUri` 来判断商家是否有官网，该字段属于 Google Places 的付费字段；
上线前应设置 API 配额和预算告警。

菜单图片在本地通过 Google Cloud ADC 和 Vertex Gemini 生成草稿，不需要
`GEMINI_API_KEY`，也不会把本机凭据部署到 Cloudflare。先按 Veo 相同方式完成
`gcloud auth application-default login`，然后运行：

```bash
pnpm menu:extract -- --image /path/menu-1.jpg --image /path/menu-2.jpg \
  --source-url 'https://maps.google.com/...' --out /tmp/menu.json
```

将输出 JSON 粘贴到后台 Outreach 的导入框。模型只负责 OCR/结构化草稿；
管理员仍需逐项检查菜名、分类、描述和价格，导入不会自动标记为已核验。

## 本地验收

```bash
pnpm check:size
pnpm test
pnpm lint
pnpm --filter @autoweb/api exec tsc --noEmit
pnpm --filter @autoweb/api exec tsc -p test/tsconfig.json --noEmit
pnpm --filter @autoweb/api build
API_BASE_URL=https://api.example.com \
  pnpm --filter @autoweb/web exec opennextjs-cloudflare build
```

`pnpm check:size` 会扫描源码和迁移文件，任何文件超过 800 行都会失败。
API 自动化测试运行在 Cloudflare Workers Vitest Pool 中，并使用真实 D1
迁移；当前 8 个功能点共 108 条用例，每个功能点至少 10 条。完整缺陷闭环见
[`docs/testing/AUTOWEB_TEST_REPORT_2026-07-30.md`](docs/testing/AUTOWEB_TEST_REPORT_2026-07-30.md)。

## 当前外部依赖

- Google Places 搜索必须有有效 API Key 和已启用的结算账户
- 邮件发送必须完成 Resend 域名验证并配置 API Key
- Cloudflare 生产部署必须提供真实数据库 ID、账户 ID 和部署 Token
- Google 商家资料必须在触达前人工复核；不要把 Google Places 内容与非
  Google 地图组合展示

## 获客

通过 google map查找对应的商家是否已经含有网站，如果没有调取接口获取获取这家餐馆的信息，做成一个精美的网站发给他，并说明我们的来意，定价 1200 美金，获取这个信息后，要做一个筛选是否要用 gpt对他图片进行重新生图，使其更加精美
