# AutoWeb — 餐馆网站自动生成平台 设计文档

> 2026-07-28 | 状态: 待评审

## 一、项目概要

### 定位

站点生成器 — 每次为一家餐馆生成一个独立站点，部署到独立域名（子域名或自定义域名）。不是 SaaS 多租户平台。

### 核心目标

从获客到上线的全流程自动化：Google Maps 搜餐馆 → 筛无网站商家 → 抓取信息 → 生成精美网站 → 人工审核 → 发邮件给餐馆老板。餐馆老板可登录后台自行管理内容。

### 商业模式

- 定价：$1200/站点
- 触达方式：生成演示站点链接，邮件介绍来意，支付线下处理
- 前期不集成在线支付

---

## 二、技术选型

| 层 | 技术 | 说明 |
|---|------|------|
| 前端 + 后端 | Next.js 15 (App Router) | 一套代码覆盖平台后台 + 餐馆站点 |
| 部署 | Cloudflare Pages | 免费额度：无限站点、无限请求、500次构建/月 |
| API 增强 | Cloudflare Workers | Pages 外独立 Workers 处理获客流水线 |
| 数据库 | Cloudflare D1 | 免费：5GB、500万行读取/月 |
| 文件存储 | Cloudflare R2 | 免费：10GB 存储 |
| DNS + CDN | Cloudflare DNS | 免费 |
| 邮件 | Resend | 免费：100封/天 |
| AI 图片 | 预留接口 | 先不接入，架构留好扩展点 |

### 域名策略

- 默认分配子域名：`{slug}.autoweb.app`
- 支持老板绑定自定义域名（如 `restaurant-name.com`）
- 中间件根据域名查 D1，渲染对应餐馆站点

---

## 三、系统架构

```
┌─────────────────────────────────────────────────┐
│                  Cloudflare                       │
│                                                   │
│  ┌─────────────┐  ┌──────────────┐               │
│  │   Pages     │  │   Workers    │               │
│  │  (Next.js)  │  │  (获客流水线) │               │
│  └──────┬──────┘  └──────┬───────┘               │
│         │                │                        │
│  ┌──────┴────────────────┴───────┐               │
│  │          D1 (SQLite)          │               │
│  └───────────────────────────────┘               │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   R2     │  │  Resend  │  │  AI 图片(预留)│   │
│  │ (图片)   │  │  (邮件)  │  │              │   │
│  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────────────────────────────┘
```

### 域名路由逻辑

```
请求 → Cloudflare Pages
  ├─ 主域名 (autoweb.app) → 管理平台
  ├─ 子域名 (xxx.autoweb.app) → 查 D1 获取餐馆 → 渲染站点
  └─ 自定义域名 (xxx.com) → 查 D1 获取餐馆 → 渲染站点
```

---

## 四、数据模型

### restaurants（餐馆）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (UUID) | 主键 |
| name | TEXT | 店名 |
| slug | TEXT UNIQUE | URL 标识 |
| phone | TEXT | 电话 |
| email | TEXT | 邮箱 |
| address | TEXT | 地址 |
| lat, lng | REAL | 坐标 |
| opening_hours | TEXT (JSON) | 营业时间 |
| template_id | TEXT FK | 当前模板 |
| domain_custom | TEXT | 自定义域名 |
| status | TEXT | active / draft / demo |
| created_at, updated_at | TEXT | 时间戳 |

### menu_categories（菜单分类）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (UUID) | 主键 |
| restaurant_id | TEXT FK | 所属餐馆 |
| name | TEXT | 分类名 |
| sort_order | INTEGER | 排序 |

### menu_items（菜品）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (UUID) | 主键 |
| category_id | TEXT FK | 所属分类 |
| name | TEXT | 名称 |
| description | TEXT | 描述 |
| price | REAL | 价格 |
| image_url | TEXT | 图片 URL |
| sort_order | INTEGER | 排序 |

### templates（模板）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (UUID) | 主键 |
| name | TEXT | 名称 |
| thumbnail | TEXT | 缩略图 |
| config | TEXT (JSON) | 配色/字体/布局配置 |

### reservations（预定）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (UUID) | 主键 |
| restaurant_id | TEXT FK | 餐馆 |
| customer_name | TEXT | 姓名 |
| phone | TEXT | 电话 |
| email | TEXT | 邮箱 |
| party_size | INTEGER | 人数 |
| reservation_time | TEXT | 预定时间 |
| note | TEXT | 备注 |
| created_at | TEXT | 创建时间 |

### users（管理员）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (UUID) | 主键 |
| restaurant_id | TEXT FK | 所属餐馆 |
| email | TEXT | 登录邮箱 |
| password_hash | TEXT | 密码哈希 |
| role | TEXT | admin / owner |

### image_tasks（图片增强，预留）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (UUID) | 主键 |
| restaurant_id | TEXT FK | 餐馆 |
| original_url | TEXT | 原图 |
| enhanced_url | TEXT | 增强图 |
| status | TEXT | pending / processing / done / rejected |
| created_at | TEXT | 创建时间 |

---

## 五、功能模块

### 模块一：管理平台（主域名 autoweb.app）

| 功能 | 说明 |
|------|------|
| 仪表盘 | 餐馆总数、demo 站点数、待审核数 |
| 餐馆管理 | CRUD 餐馆基本信息 |
| 模板管理 | 3-5 套模板，预览/切换 |
| 内容管理 | 编辑菜单（分类+菜品+价格）、联系方式、地址、营业时间 |
| 预定管理 | 查看预定列表，按日期筛选，导出 CSV |
| 访问统计 | 基础 PV/UV，按餐馆维度 |
| 获客面板 | Google Maps 搜索 → 筛选 → 预览 → 一键生成 demo |
| 审核面板 | 审核 demo 站点，确认后发邮件给餐馆 |
| 图片审核 | 查看 AI 增强对比，选择保留原图或增强图（预留） |

### 模块二：餐馆站点（子域名/自定义域名）

| 功能 | 说明 |
|------|------|
| 首页 | 封面图 + 店名 + 简介 |
| 菜单页 | 分类展示，图片 + 名称 + 价格 |
| 联系方式 | 地址 + 地图 + 电话 + 营业时间 |
| 预定表单 | 姓名/电话/邮箱/时间/人数 → 邮件通知老板 |
| SEO | title/description、结构化数据(Restaurant schema)、sitemap、OG 标签 |
| 响应式 | PC + 移动端适配 |

### 模块三：获客引擎

```
Google Maps API 搜索餐馆
  → 检查是否已有网站
  → 抓取餐馆信息（名称/地址/电话/菜单/图片）
  → 自动选模板 + 生成 demo 站点
  → AI 图片增强（预留接口）
  → 运营者审核 demo
  → 发送演示链接邮件给餐馆老板
  → 餐馆老板确认 → 站点上线
```

---

## 六、SEO 策略

- 每个餐馆站点独立 `<title>` / `<meta description>` / `<meta keywords>`
- Schema.org Restaurant 结构化数据（店名、地址、电话、菜单、营业时间）
- Open Graph 标签（分享时的卡片预览）
- 自动生成 `sitemap.xml` 和 `robots.txt`
- 图片 alt 标签 + 压缩
- 页面性能优化（Core Web Vitals）

---

## 七、CI/CD 自动化

- GitHub 仓库 + Cloudflare Pages 自动部署（Git push → 自动构建部署）
- 开发/生产环境分离
- D1 数据库迁移自动化

---

## 八、待定 / 后续迭代

| 项目 | 状态 |
|------|------|
| Google Maps 数据源方案 | 待确定（Places API / 爬虫 / 其他） |
| AI 图片增强 | 接口预留，后续接入 OpenAI API |
| WhatsApp 通知 | 暂不做，仅邮件 |
| 在线支付 | 暂不做，线下处理 |
| 统计详细分析 | 后期扩展 |

---

## 九、约束与假设

- 前期仅运营者一人使用管理平台
- 餐馆老板只登录自己站点的后台
- Cloudflare 免费额度足够前期使用（预计数百个站点内不超限）
- 邮件通知依赖 Resend，100封/天免费额度
- 主域名 autoweb.app 假设已注册
