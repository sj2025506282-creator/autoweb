# AutoWeb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a restaurant website generator platform — automated outreach → demo site generation → review → deploy

**Architecture:** Next.js 15 App Router single app, middleware-based domain routing (admin vs restaurant site). Cloudflare Pages + D1 + R2 + Workers. Resend for email.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, D1 (SQLite), R2, Resend, TypeScript, Wrangler

## Global Constraints

- Responsive: PC + mobile
- Subdomain default `{slug}.autoweb.app`, custom domain support
- Cloudflare free tier limits
- Email only via Resend (100/day free)
- AI image enhancement: interface reserved, not implemented
- Payment: offline, no online payment integration
- Google Maps data source: TBD, interface reserved

---

## File Structure

```
autoweb/
├── src/
│   ├── app/
│   │   ├── (admin)/                  # Admin platform route group
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── login/page.tsx
│   │   │   ├── restaurants/
│   │   │   │   ├── page.tsx          # List
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Edit
│   │   │   │       ├── menu/page.tsx
│   │   │   │       ├── reservations/page.tsx
│   │   │   │       └── analytics/page.tsx
│   │   │   ├── templates/page.tsx
│   │   │   ├── outreach/
│   │   │   │   ├── page.tsx          # Search + generate
│   │   │   │   └── review/page.tsx   # Review demos
│   │   │   └── settings/page.tsx
│   │   ├── (site)/                   # Restaurant site route group
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Home
│   │   │   ├── menu/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── reserve/page.tsx
│   │   │   └── [slug]/              # Dynamic restaurant pages (for sitemap)
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   ├── restaurants/
│   │   │   │   ├── route.ts          # List + Create
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # Get + Update + Delete
│   │   │   │       ├── menu/route.ts
│   │   │   │       └── reservations/route.ts
│   │   │   ├── templates/route.ts
│   │   │   ├── outreach/
│   │   │   │   └── route.ts          # Trigger outreach search
│   │   │   ├── images/
│   │   │   │   └── upload/route.ts   # R2 upload
│   │   │   └── analytics/
│   │   │       └── route.ts
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css
│   ├── middleware.ts                 # Domain routing
│   ├── lib/
│   │   ├── db.ts                     # D1 client + query helpers
│   │   ├── auth.ts                   # Session management + password hashing
│   │   ├── email.ts                  # Resend email sending
│   │   ├── image.ts                  # R2 upload + AI placeholder interface
│   │   ├── outreach.ts              # Google Maps placeholder + site generator
│   │   ├── analytics.ts             # PV/UV tracking
│   │   └── seo.ts                    # Structured data + sitemap generators
│   └── components/
│       ├── admin/
│       │   ├── sidebar.tsx
│       │   ├── header.tsx
│       │   ├── stats-card.tsx
│       │   └── data-table.tsx
│       ├── site/
│       │   ├── navbar.tsx
│       │   ├── footer.tsx
│       │   ├── menu-section.tsx
│       │   ├── reservation-form.tsx
│       │   ├── contact-card.tsx
│       │   └── hero-banner.tsx
│       └── shared/
│           ├── image-upload.tsx
│           ├── image-compare.tsx      # AI vs original comparison
│           └── rich-editor.tsx
├── workers/
│   └── outreach/
│       ├── index.ts                   # Outreach worker entry
│       └── site-generator.ts         # Demo site generation logic
├── migrations/
│   └── 0001_init.sql                # Initial schema
├── public/
│   └── templates/                    # Template thumbnails
├── wrangler.toml
├── next.config.ts
├── tailwind.config.ts
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Phase 1: Foundation

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `wrangler.toml`, `.env.example`, `tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`

**Interface:**
- Produces: Next.js app running on `npm run dev`, ready for route additions

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/sunji/Documents/work/Project/autoweb
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

- [ ] **Step 2: Install additional dependencies**

```bash
npm install wrangler@latest @cloudflare/workers-types iron-session uuid resend
npm install -D @types/uuid
```

- [ ] **Step 3: Create wrangler.toml**

```toml
name = "autoweb"
compatibility_date = "2025-07-28"

[[d1_databases]]
binding = "DB"
database_name = "autoweb-db"
database_id = ""

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "autoweb-images"
```

- [ ] **Step 4: Create .env.example**

```
SESSION_SECRET=change-me-32-chars-min
RESEND_API_KEY=re_xxx
ADMIN_EMAIL=admin@autoweb.app
ADMIN_PASSWORD_HASH=bcrypt-hash-of-admin-password
```

- [ ] **Step 5: Create root layout at src/app/layout.tsx**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoWeb - Restaurant Website Generator",
  description: "Beautiful restaurant websites, automatically generated",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Verify app runs**

```bash
npm run dev
# Visit http://localhost:3000 → should see Next.js default page
```

- [ ] **Step 7: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js project with Cloudflare config"
```

---

### Task 2: Database Schema & Migrations

**Files:**
- Create: `migrations/0001_init.sql`, `src/lib/db.ts`

**Interface:**
- Produces: `getDB()` function returning D1 client, schema deployed via `wrangler d1 execute`

- [ ] **Step 1: Write migration SQL**

```sql
-- migrations/0001_init.sql
CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  lat REAL DEFAULT 0,
  lng REAL DEFAULT 0,
  opening_hours TEXT DEFAULT '{}',
  cover_image TEXT DEFAULT '',
  description TEXT DEFAULT '',
  template_id TEXT DEFAULT 'template-1',
  domain_custom TEXT DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK(status IN ('active','draft','demo')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menu_categories (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price REAL DEFAULT 0,
  image_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  thumbnail TEXT DEFAULT '',
  config TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  party_size INTEGER DEFAULT 2,
  reservation_time TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT REFERENCES restaurants(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK(role IN ('admin','owner'))
);

CREATE TABLE IF NOT EXISTS image_tasks (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  enhanced_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','done','rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  page TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  referrer TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed templates
INSERT INTO templates (id, name, config) VALUES
  ('template-1', 'Classic Elegance', '{"primaryColor":"#1a1a2e","secondaryColor":"#e94560","fontFamily":"serif","layout":"standard"}'),
  ('template-2', 'Modern Minimal', '{"primaryColor":"#2d3436","secondaryColor":"#0984e3","fontFamily":"sans-serif","layout":"standard"}'),
  ('template-3', 'Warm Rustic', '{"primaryColor":"#8b4513","secondaryColor":"#f4a460","fontFamily":"serif","layout":"hero-first"}'),
  ('template-4', 'Fresh Green', '{"primaryColor":"#2d5016","secondaryColor":"#7ec850","fontFamily":"sans-serif","layout":"split"}'),
  ('template-5', 'Bold Dark', '{"primaryColor":"#0a0a0a","secondaryColor":"#ff6b35","fontFamily":"sans-serif","layout":"full-bleed"}');
```

- [ ] **Step 2: Create D1 database and apply migration**

```bash
npx wrangler d1 create autoweb-db
# Copy the database_id output into wrangler.toml
npx wrangler d1 execute autoweb-db --file=migrations/0001_init.sql --local
```

- [ ] **Step 3: Write D1 client helper — src/lib/db.ts**

```typescript
import { getRequestContext } from "@cloudflare/next-on-pages";

export function getDB() {
  const { env } = getRequestContext();
  return env.DB;
}

export async function queryAll<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = getDB();
  const result = await db.prepare(sql).bind(...params).all();
  return result.results as T[];
}

export async function queryFirst<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const db = getDB();
  const result = await db.prepare(sql).bind(...params).first();
  return (result as T) ?? null;
}

export async function execute(sql: string, params: unknown[] = []): Promise<void> {
  const db = getDB();
  await db.prepare(sql).bind(...params).run();
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add database schema and D1 client"
```

---

### Task 3: Authentication System

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`
- Create: `src/app/(admin)/login/page.tsx`, `src/app/(admin)/layout.tsx`

**Interface:**
- Produces: `getSession()` returning `{ user: { id, email, role, restaurantId? } } | null`, `createSession(user)`, `destroySession()`
- API: `POST /api/auth/login` (body: `{email, password}`), `POST /api/auth/logout`

- [ ] **Step 1: Write auth lib — src/lib/auth.ts**

```typescript
import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionUser {
  id: string;
  email: string;
  role: "admin" | "owner";
  restaurantId?: string;
}

export interface SessionData {
  user?: SessionUser;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || "change-me-32-chars-min-32chars!!",
  cookieName: "autoweb-session",
  cookieOptions: { secure: process.env.NODE_ENV === "production" },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

export async function createSession(user: SessionUser): Promise<void> {
  const session = await getSession();
  session.user = user;
  await session.save();
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}
```

- [ ] **Step 2: Write login API — src/app/api/auth/login/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { queryFirst } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const user = await queryFirst<{ id: string; email: string; password_hash: string; role: string; restaurant_id: string | null }>(
    "SELECT * FROM users WHERE email = ?", [email]
  );
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await createSession({
    id: user.id,
    email: user.email,
    role: user.role as "admin" | "owner",
    restaurantId: user.restaurant_id ?? undefined,
  });
  return NextResponse.json({ success: true, role: user.role });
}
```

- [ ] **Step 3: Write logout API — src/app/api/auth/logout/route.ts**

```typescript
import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Write admin layout — src/app/(admin)/layout.tsx**

```typescript
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) { redirect("/login"); }
  return (
    <div className="flex h-screen">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write login page — src/app/(admin)/login/page.tsx**

```typescript
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) { router.push("/"); router.refresh(); }
    else { const data = await res.json(); setError(data.error); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">AutoWeb Admin</h1>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <input type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded" required />
        <input type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded" required />
        <button type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Sign In
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Verify login flow**

```bash
# Insert admin user into local D1
npx wrangler d1 execute autoweb-db --local --command="INSERT INTO users (id, email, password_hash, role) VALUES ('admin-1', 'admin@autoweb.app', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'admin');"
# The hash above is SHA-256 of 'password'
npm run dev
# Visit http://localhost:3000/login → login with admin@autoweb.app / password → should redirect to dashboard
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add authentication system with iron-session"
```

---

### Task 4: Middleware — Domain Routing

**Files:**
- Create: `src/middleware.ts`

**Interface:**
- Produces: Domain-based routing logic — main domain → admin, subdomain → restaurant site, custom domain → restaurant site

- [ ] **Step 1: Write middleware — src/middleware.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";

const MAIN_DOMAIN = process.env.MAIN_DOMAIN || "autoweb.app";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // Main domain → admin platform (no rewrite needed, handled by route group)
  if (hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}` || hostname === "localhost:3000") {
    return NextResponse.next();
  }

  // Subdomain or custom domain → restaurant site
  // Extract slug from subdomain (e.g., my-restaurant.autoweb.app → my-restaurant)
  // Or look up by custom domain
  url.pathname = `/site${url.pathname}`;
  url.searchParams.set("_host", hostname);

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 2: Verify routing**

```bash
npm run dev
# http://localhost:3000 → admin login
# http://localhost:3000 (with Host header set to test.autoweb.app) → restaurant site
```

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add domain-based routing middleware"
```

---

## Phase 2: Admin Platform

### Task 5: Admin Layout Components

**Files:**
- Create: `src/components/admin/sidebar.tsx`, `src/components/admin/header.tsx`, `src/components/admin/stats-card.tsx`, `src/components/admin/data-table.tsx`
- Create: `src/app/(admin)/page.tsx` (Dashboard)

**Interface:**
- Consumes: `getCurrentUser()` from `@/lib/auth`
- Produces: Admin shell with sidebar navigation, header, dashboard stats cards

- [ ] **Step 1: Write Sidebar — src/components/admin/sidebar.tsx**

```typescript
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";

const links = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/restaurants", label: "Restaurants", icon: "🍽️" },
  { href: "/templates", label: "Templates", icon: "🎨" },
  { href: "/outreach", label: "Outreach", icon: "🔍" },
  { href: "/outreach/review", label: "Review Demos", icon: "✅" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold">AutoWeb</h2>
        <p className="text-xs text-gray-400">{user.email}</p>
      </div>
      <nav className="flex-1 p-4">
        {links.map((link) => (
          <Link key={link.href} href={link.href}
            className={`flex items-center gap-2 px-3 py-2 rounded mb-1 text-sm ${
              pathname === link.href ? "bg-blue-600" : "hover:bg-gray-800"
            }`}>
            <span>{link.icon}</span> {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Write Header — src/components/admin/header.tsx**

```typescript
"use client";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";

export function Header({ user }: { user: SessionUser }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6">
      <h1 className="font-semibold text-gray-700">Dashboard</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{user.role}</span>
        <button onClick={logout}
          className="text-sm text-red-600 hover:underline">Logout</button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Write StatsCard — src/components/admin/stats-card.tsx**

```typescript
export function StatsCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write DataTable — src/components/admin/data-table.tsx**

```typescript
interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, unknown>>({
  columns, data, onRowClick
}: {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((item, i) => (
            <tr key={i} onClick={() => onRowClick?.(item)}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm">
                  {col.render ? col.render(item) : String(item[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Write Dashboard page — src/app/(admin)/page.tsx**

```typescript
import { getCurrentUser } from "@/lib/auth";
import { queryFirst } from "@/lib/db";
import { StatsCard } from "@/components/admin/stats-card";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const stats = await queryFirst<{ total: number; active: number; demo: number }>(
    "SELECT COUNT(*) as total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active, SUM(CASE WHEN status='demo' THEN 1 ELSE 0 END) as demo FROM restaurants"
  );
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Total Restaurants" value={stats?.total ?? 0} icon="🍽️" />
        <StatsCard title="Active Sites" value={stats?.active ?? 0} icon="🟢" />
        <StatsCard title="Demo Sites" value={stats?.demo ?? 0} icon="🔶" />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add admin layout, sidebar, header, dashboard"
```

---

### Task 6: Restaurant CRUD

**Files:**
- Create: `src/app/api/restaurants/route.ts`, `src/app/api/restaurants/[id]/route.ts`
- Create: `src/app/(admin)/restaurants/page.tsx`, `src/app/(admin)/restaurants/new/page.tsx`, `src/app/(admin)/restaurants/[id]/page.tsx`

**Interface:**
- Consumes: `getDB()` from `@/lib/db`, `getCurrentUser()` from `@/lib/auth`
- Produces: CRUD API + admin pages for restaurant management
- API: `GET/POST /api/restaurants`, `GET/PUT/DELETE /api/restaurants/[id]`

- [ ] **Step 1: Write restaurants API list/create — src/app/api/restaurants/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const db = getDB();
  const result = await db.prepare("SELECT * FROM restaurants ORDER BY created_at DESC").all();
  return NextResponse.json(result.results);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDB();
  const id = uuid();
  const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  await db.prepare(
    `INSERT INTO restaurants (id, name, slug, phone, email, address, lat, lng, opening_hours, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.name, slug, body.phone || "", body.email || "", body.address || "",
    body.lat || 0, body.lng || 0, JSON.stringify(body.opening_hours || {}),
    body.description || "", body.status || "draft").run();
  return NextResponse.json({ id, slug }, { status: 201 });
}
```

- [ ] **Step 2: Write single restaurant API — src/app/api/restaurants/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDB();
  const restaurant = await db.prepare("SELECT * FROM restaurants WHERE id = ?").bind(id).first();
  if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(restaurant);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const db = getDB();
  await db.prepare(
    `UPDATE restaurants SET name=?, phone=?, email=?, address=?, lat=?, lng=?,
     opening_hours=?, description=?, template_id=?, status=?, updated_at=datetime('now')
     WHERE id=?`
  ).bind(body.name, body.phone || "", body.email || "", body.address || "",
    body.lat || 0, body.lng || 0, JSON.stringify(body.opening_hours || {}),
    body.description || "", body.template_id || "template-1", body.status || "draft", id).run();
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDB();
  await db.prepare("DELETE FROM restaurants WHERE id = ?").bind(id).run();
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Write restaurant list page — src/app/(admin)/restaurants/page.tsx**

```typescript
import Link from "next/link";
import { queryAll } from "@/lib/db";
import { DataTable } from "@/components/admin/data-table";

interface Restaurant { id: string; name: string; slug: string; status: string; created_at: string; }

export default async function RestaurantsPage() {
  const restaurants = await queryAll<Restaurant>("SELECT * FROM restaurants ORDER BY created_at DESC");
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Restaurants</h2>
        <Link href="/restaurants/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ New</Link>
      </div>
      <DataTable
        columns={[
          { key: "name", header: "Name" },
          { key: "slug", header: "Slug" },
          { key: "status", header: "Status",
            render: (r: Restaurant) => (
              <span className={`px-2 py-1 text-xs rounded ${
                r.status === "active" ? "bg-green-100 text-green-800" :
                r.status === "demo" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
              }`}>{r.status}</span>) },
        ]}
        data={restaurants}
        onRowClick={(r) => { /* navigate to edit */ }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Write new/edit restaurant pages — src/app/(admin)/restaurants/new/page.tsx and src/app/(admin)/restaurants/[id]/page.tsx** (similar pattern — form with name, phone, email, address, description, status, template_id fields, POST/PUT to API)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add restaurant CRUD API and admin pages"
```

---

### Task 7: Template Management

**Files:**
- Create: `src/app/api/templates/route.ts`
- Create: `src/app/(admin)/templates/page.tsx`

**Interface:**
- Consumes: `getDB()` from `@/lib/db`
- Produces: Template list + preview API, admin template browser page
- API: `GET /api/templates`

- [ ] **Step 1: Write templates API — src/app/api/templates/route.ts**

```typescript
import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET() {
  const db = getDB();
  const result = await db.prepare("SELECT * FROM templates").all();
  return NextResponse.json(result.results);
}
```

- [ ] **Step 2: Write templates page — src/app/(admin)/templates/page.tsx**

```typescript
import { queryAll } from "@/lib/db";

interface Template { id: string; name: string; config: string; }

export default async function TemplatesPage() {
  const templates = await queryAll<Template>("SELECT * FROM templates");
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Templates</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((t) => {
          const config = JSON.parse(t.config);
          return (
            <div key={t.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
              <div style={{ backgroundColor: config.primaryColor, height: 120 }}
                className="flex items-center justify-center">
                <span style={{ color: config.secondaryColor }}
                  className="text-3xl font-bold">{t.name.charAt(0)}</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{t.name}</h3>
                <div className="flex gap-2 mt-2">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: config.secondaryColor }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add template management page and API"
```

---

### Task 8: Menu Management

**Files:**
- Create: `src/app/api/restaurants/[id]/menu/route.ts`
- Create: `src/app/(admin)/restaurants/[id]/menu/page.tsx`

**Interface:**
- Consumes: `getDB()` from `@/lib/db`
- Produces: Menu CRUD API + admin page for managing categories & items
- API: `GET/POST /api/restaurants/[id]/menu`, `DELETE /api/restaurants/[id]/menu?categoryId=X&itemId=Y`

- [ ] **Step 1: Write menu API — src/app/api/restaurants/[id]/menu/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDB();
  const categories = await db.prepare(
    "SELECT * FROM menu_categories WHERE restaurant_id = ? ORDER BY sort_order"
  ).bind(id).all();
  const items = await db.prepare(
    `SELECT mi.* FROM menu_items mi
     JOIN menu_categories mc ON mi.category_id = mc.id
     WHERE mc.restaurant_id = ? ORDER BY mi.sort_order`
  ).bind(id).all();
  return NextResponse.json({ categories: categories.results, items: items.results });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const db = getDB();
  if (body.type === "category") {
    const categoryId = uuid();
    await db.prepare(
      "INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES (?, ?, ?, ?)"
    ).bind(categoryId, id, body.name, body.sort_order || 0).run();
    return NextResponse.json({ id: categoryId }, { status: 201 });
  }
  if (body.type === "item") {
    const itemId = uuid();
    await db.prepare(
      "INSERT INTO menu_items (id, category_id, name, description, price, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(itemId, body.category_id, body.name, body.description || "", body.price || 0, body.sort_order || 0).run();
    return NextResponse.json({ id: itemId }, { status: 201 });
  }
  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const categoryId = searchParams.get("categoryId");
  const itemId = searchParams.get("itemId");
  const db = getDB();
  if (itemId) {
    await db.prepare("DELETE FROM menu_items WHERE id = ?").bind(itemId).run();
  } else if (categoryId) {
    await db.prepare("DELETE FROM menu_categories WHERE id = ? AND restaurant_id = ?").bind(categoryId, id).run();
  }
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Write menu admin page — src/app/(admin)/restaurants/[id]/menu/page.tsx**

Interactive page with: list categories → click to expand → show items → add/edit/delete category and item forms. Uses the API from Step 1.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add menu management API and admin page"
```

---

### Task 9: Reservation Management (Admin Side)

**Files:**
- Create: `src/app/api/restaurants/[id]/reservations/route.ts`
- Create: `src/app/(admin)/restaurants/[id]/reservations/page.tsx`

**Interface:**
- Consumes: `getDB()` from `@/lib/db`
- Produces: Reservation list API + admin page with date filter and CSV export
- API: `GET /api/restaurants/[id]/reservations?date=2026-07-28`

- [ ] **Step 1: Write reservations API — src/app/api/restaurants/[id]/reservations/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const db = getDB();
  let sql = "SELECT * FROM reservations WHERE restaurant_id = ?";
  const binds: unknown[] = [id];
  if (date) { sql += " AND date(reservation_time) = ?"; binds.push(date); }
  sql += " ORDER BY reservation_time DESC";
  const result = await db.prepare(sql).bind(...binds).all();
  return NextResponse.json(result.results);
}
```

- [ ] **Step 2: Write reservations admin page with table + date filter + CSV export button**

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add reservation management for admin"
```

---

## Phase 3: Restaurant Public Site

### Task 10: Restaurant Site Pages

**Files:**
- Create: `src/app/(site)/layout.tsx`, `src/app/(site)/page.tsx`, `src/app/(site)/menu/page.tsx`, `src/app/(site)/contact/page.tsx`, `src/app/(site)/reserve/page.tsx`
- Create: `src/components/site/navbar.tsx`, `src/components/site/footer.tsx`, `src/components/site/hero-banner.tsx`, `src/components/site/menu-section.tsx`, `src/components/site/reservation-form.tsx`, `src/components/site/contact-card.tsx`

**Interface:**
- Consumes: `getDB()` from `@/lib/db`
- Produces: Public restaurant website pages — home, menu, contact, reserve

- [ ] **Step 1: Write site layout — src/app/(site)/layout.tsx**

```typescript
import { headers } from "next/headers";
import { queryFirst } from "@/lib/db";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

async function getRestaurant() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const slug = host.endsWith(".autoweb.app") ? host.replace(".autoweb.app", "") : null;
  if (slug) {
    return queryFirst<{ id: string; name: string; template_id: string }>(
      "SELECT * FROM restaurants WHERE slug = ? AND status IN ('active','demo')", [slug]
    );
  }
  return queryFirst<{ id: string; name: string; template_id: string }>(
    "SELECT * FROM restaurants WHERE domain_custom = ? AND status IN ('active','demo')", [host]
  );
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const restaurant = await getRestaurant();
  if (!restaurant) return <div className="p-8 text-center">Site not found</div>;
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar restaurantName={restaurant.name} />
      <main className="flex-1">{children}</main>
      <Footer restaurantName={restaurant.name} />
    </div>
  );
}
```

- [ ] **Step 2: Write site components**

**Navbar:** Restaurant name + nav links (Home, Menu, Contact, Reserve), mobile hamburger menu
**Footer:** Restaurant name, copyright, address snippet
**HeroBanner:** Cover image + restaurant name + description + CTA button
**MenuSection:** Category groups → items with name, description, price, image
**ReservationForm:** Name, phone, email, date/time, party size, note → POST to API → success/error message
**ContactCard:** Address (with static map embed), phone (tel: link), email (mailto: link), opening hours table

- [ ] **Step 3: Write home page — src/app/(site)/page.tsx**

```typescript
import { headers } from "next/headers";
import { queryFirst } from "@/lib/db";
import { HeroBanner } from "@/components/site/hero-banner";
import { MenuSection } from "@/components/site/menu-section";
import Link from "next/link";

export default async function SiteHomePage() {
  const restaurant = await getRestaurantFromHost();
  if (!restaurant) return null;
  const featuredItems = await queryAll(
    "SELECT mi.*, mc.name as category_name FROM menu_items mi JOIN menu_categories mc ON mi.category_id = mc.id WHERE mc.restaurant_id = ? ORDER BY mi.sort_order LIMIT 6",
    [restaurant.id]
  );
  return (
    <>
      <HeroBanner restaurant={restaurant} />
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Our Menu</h2>
        <MenuSection items={featuredItems} />
        <div className="text-center mt-8">
          <Link href="/menu" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            View Full Menu
          </Link>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Write menu, contact, reserve pages (same pattern)**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add restaurant public site pages and components"
```

---

### Task 11: Reservation Form & Email Notification

**Files:**
- Create: `src/app/api/reserve/route.ts`
- Modify: `src/components/site/reservation-form.tsx`
- Modify: `src/lib/email.ts`

**Interface:**
- Consumes: `getDB()` from `@/lib/db`, `sendEmail()` from `@/lib/email`
- Produces: Public reservation form → API → save to DB + send email to restaurant owner
- API: `POST /api/reserve` (body: `{restaurantId, customerName, phone, email, partySize, reservationTime, note}`)

- [ ] **Step 1: Write email lib — src/lib/email.ts**

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to, subject, html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return resend.emails.send({
    from: "AutoWeb <noreply@autoweb.app>",
    to,
    subject,
    html,
  });
}

export function reservationEmailTemplate(data: {
  restaurantName: string;
  customerName: string;
  phone: string;
  email: string;
  partySize: number;
  time: string;
  note: string;
}) {
  return `
    <h2>New Reservation at ${data.restaurantName}</h2>
    <table>
      <tr><td><strong>Customer:</strong></td><td>${data.customerName}</td></tr>
      <tr><td><strong>Phone:</strong></td><td>${data.phone}</td></tr>
      <tr><td><strong>Email:</strong></td><td>${data.email}</td></tr>
      <tr><td><strong>Party Size:</strong></td><td>${data.partySize}</td></tr>
      <tr><td><strong>Time:</strong></td><td>${data.time}</td></tr>
      <tr><td><strong>Note:</strong></td><td>${data.note || "—"}</td></tr>
    </table>
  `;
}
```

- [ ] **Step 2: Write reserve API — src/app/api/reserve/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { v4 as uuid } from "uuid";
import { sendEmail, reservationEmailTemplate } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDB();
  const restaurant = await db.prepare(
    "SELECT id, name, email FROM restaurants WHERE id = ?"
  ).bind(body.restaurantId).first<{ id: string; name: string; email: string }>();

  if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

  const id = uuid();
  await db.prepare(
    `INSERT INTO reservations (id, restaurant_id, customer_name, phone, email, party_size, reservation_time, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.restaurantId, body.customerName, body.phone, body.email,
    body.partySize, body.reservationTime, body.note || "").run();

  if (restaurant.email) {
    await sendEmail({
      to: restaurant.email,
      subject: `New Reservation — ${body.customerName}`,
      html: reservationEmailTemplate({
        restaurantName: restaurant.name,
        customerName: body.customerName,
        phone: body.phone,
        email: body.email,
        partySize: body.partySize,
        time: body.reservationTime,
        note: body.note || "",
      }),
    });
  }

  return NextResponse.json({ success: true, id }, { status: 201 });
}
```

- [ ] **Step 3: Wire reservation form component to API, add success/error states**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add reservation form with email notification"
```

---

### Task 12: SEO & Sitemap

**Files:**
- Create: `src/lib/seo.ts`
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`
- Modify: `src/app/(site)/layout.tsx` (add metadata)

**Interface:**
- Consumes: `getDB()` from `@/lib/db`
- Produces: Dynamic sitemap, robots.txt, per-page SEO metadata with Restaurant schema

- [ ] **Step 1: Write SEO lib — src/lib/seo.ts**

```typescript
export function generateRestaurantSchema(restaurant: {
  name: string; phone: string; email: string; address: string;
  openingHours: Record<string, string>; menuUrl: string; imageUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    telephone: restaurant.phone,
    email: restaurant.email,
    address: { "@type": "PostalAddress", streetAddress: restaurant.address },
    servesCuisine: "Various",
    menu: restaurant.menuUrl,
    image: restaurant.imageUrl,
    openingHoursSpecification: Object.entries(restaurant.openingHours).map(([day, hours]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: day,
      opens: hours.split("-")[0]?.trim() || "",
      closes: hours.split("-")[1]?.trim() || "",
    })),
  };
}

export function generateMetadata(restaurant: { name: string; description: string }) {
  return {
    title: `${restaurant.name} — Restaurant`,
    description: restaurant.description || `${restaurant.name} — Fresh food, great ambiance. Visit us today!`,
    openGraph: {
      title: restaurant.name,
      description: restaurant.description,
      type: "website" as const,
    },
  };
}
```

- [ ] **Step 2: Write sitemap.ts — src/app/sitemap.ts**

```typescript
import { queryAll } from "@/lib/db";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const restaurants = await queryAll<{ slug: string; updated_at: string }>(
    "SELECT slug, updated_at FROM restaurants WHERE status = 'active'"
  );
  const baseUrl = `https://autoweb.app`;
  return restaurants.map((r) => ({
    url: `${baseUrl}/${r.slug}`,
    lastModified: r.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}
```

- [ ] **Step 3: Write robots.ts — src/app/robots.ts**

```typescript
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://autoweb.app/sitemap.xml",
  };
}
```

- [ ] **Step 4: Add SEO metadata + schema JSON-LD to site layout**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add SEO metadata, sitemap, robots.txt, Restaurant schema"
```

---

## Phase 4: Infrastructure & Features

### Task 13: Image Upload & R2 Storage

**Files:**
- Create: `src/lib/image.ts`
- Create: `src/app/api/images/upload/route.ts`
- Create: `src/components/shared/image-upload.tsx`

**Interface:**
- Consumes: R2 binding from Cloudflare env
- Produces: Image upload to R2, `uploadImage(file)` → `url`, `ImageUpload` component
- API: `POST /api/images/upload` (multipart form)

- [ ] **Step 1: Write image lib — src/lib/image.ts**

```typescript
import { getRequestContext } from "@cloudflare/next-on-pages";
import { v4 as uuid } from "uuid";

export async function uploadImage(file: File, restaurantId: string): Promise<string> {
  const { env } = getRequestContext();
  const key = `restaurants/${restaurantId}/${uuid()}-${file.name}`;
  await env.IMAGES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });
  return `${process.env.R2_PUBLIC_URL || ""}/${key}`;
}

export async function deleteImage(url: string): Promise<void> {
  const { env } = getRequestContext();
  const key = url.split("/").slice(-2).join("/");
  await env.IMAGES.delete(key);
}

// AI image enhancement placeholder — implement later
export interface ImageEnhancementRequest {
  originalUrl: string;
  restaurantId: string;
}

export async function requestEnhancement(_req: ImageEnhancementRequest): Promise<{ taskId: string }> {
  throw new Error("AI image enhancement not yet implemented");
}
```

- [ ] **Step 2: Write upload API — src/app/api/images/upload/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/image";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const restaurantId = formData.get("restaurantId") as string;
  if (!file || !restaurantId) {
    return NextResponse.json({ error: "File and restaurantId required" }, { status: 400 });
  }
  const url = await uploadImage(file, restaurantId);
  return NextResponse.json({ url }, { status: 201 });
}
```

- [ ] **Step 3: Write ImageUpload component — drag/drop, preview, upload progress**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add image upload to R2 with AI placeholder interface"
```

---

### Task 14: Outreach Engine (Cloudflare Worker)

**Files:**
- Create: `workers/outreach/index.ts`, `workers/outreach/site-generator.ts`
- Create: `src/lib/outreach.ts` (admin-side client)
- Create: `src/app/api/outreach/route.ts`
- Create: `src/app/(admin)/outreach/page.tsx`, `src/app/(admin)/outreach/review/page.tsx`

**Interface:**
- Consumes: D1 database, R2 bucket
- Produces: Outreach search → generate demo site → review queue → approve/send email
- Worker trigger: called from admin outreach API

- [ ] **Step 1: Write site generator — workers/outreach/site-generator.ts**

```typescript
// Creates a demo restaurant record in D1 with scraped/API data
export async function generateDemoSite(env: Env, data: {
  name: string; phone: string; email: string; address: string;
  lat: number; lng: number; menuItems: Array<{name: string; price?: number}>;
  imageUrls: string[];
}) {
  const id = crypto.randomUUID();
  const slug = data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  await env.DB.prepare(
    `INSERT INTO restaurants (id, name, slug, phone, email, address, lat, lng, status, cover_image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'demo', ?)`
  ).bind(id, data.name, slug, data.phone, data.email, data.address,
    data.lat, data.lng, data.imageUrls[0] || "").run();

  if (data.menuItems.length > 0) {
    const catId = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES (?, ?, 'Menu', 0)"
    ).bind(catId, id).run();
    for (let i = 0; i < data.menuItems.length; i++) {
      await env.DB.prepare(
        "INSERT INTO menu_items (id, category_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)"
      ).bind(crypto.randomUUID(), catId, data.menuItems[i].name, data.menuItems[i].price || 0, i).run();
    }
  }
  return { id, slug };
}
```

- [ ] **Step 2: Write outreach worker — workers/outreach/index.ts**

```typescript
export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // POST /search — search Google Maps (placeholder: manual input)
    // POST /generate — generate demo site from restaurant data
    if (url.pathname === "/generate" && request.method === "POST") {
      const data = await request.json() as any;
      const { generateDemoSite } = await import("./site-generator");
      const result = await generateDemoSite(env, data);
      return Response.json(result, { status: 201 });
    }
    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
```

- [ ] **Step 3: Write outreach API proxy — src/app/api/outreach/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET() {
  // Return pending review demos
  const db = getDB();
  const demos = await db.prepare(
    "SELECT * FROM restaurants WHERE status = 'demo' ORDER BY created_at DESC"
  ).all();
  return NextResponse.json(demos.results);
}

export async function POST(request: NextRequest) {
  // Trigger demo generation — either via Worker or inline
  const body = await request.json();
  const db = getDB();
  const id = crypto.randomUUID();
  const slug = body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  await db.prepare(
    `INSERT INTO restaurants (id, name, slug, phone, email, address, lat, lng, status, cover_image, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'demo', ?, ?)`
  ).bind(id, body.name, slug, body.phone || "", body.email || "", body.address || "",
    body.lat || 0, body.lng || 0, body.imageUrls?.[0] || "", body.description || "").run();

  if (body.menuItems?.length) {
    const catId = crypto.randomUUID();
    await db.prepare(
      "INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES (?, ?, 'Menu', 0)"
    ).bind(catId, id).run();
    for (let i = 0; i < body.menuItems.length; i++) {
      await db.prepare(
        "INSERT INTO menu_items (id, category_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)"
      ).bind(crypto.randomUUID(), catId, body.menuItems[i].name, body.menuItems[i].price || 0, i).run();
    }
  }
  return NextResponse.json({ id, slug }, { status: 201 });
}
```

- [ ] **Step 4: Write outreach + review admin pages**

Outreach page: form to input restaurant data (placeholder for Google Maps integration) → "Generate Demo" button → redirect to review
Review page: list demo sites → "Preview" link → "Approve & Send Email" button → change status to active + send outreach email

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add outreach engine with demo site generation and review flow"
```

---

### Task 15: Analytics Tracking

**Files:**
- Create: `src/lib/analytics.ts`
- Create: `src/app/api/analytics/route.ts` (tracking endpoint)
- Create: `src/app/(admin)/restaurants/[id]/analytics/page.tsx`

**Interface:**
- Consumes: D1 `analytics_events` table
- Produces: Page view tracking, per-restaurant analytics dashboard with basic PV/UV stats

- [ ] **Step 1: Write analytics lib — src/lib/analytics.ts**

```typescript
import { v4 as uuid } from "uuid";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";

async function getVisitorId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get("visitor_id");
  if (existing) return existing.value;
  const id = uuid();
  cookieStore.set("visitor_id", id, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  return id;
}

export async function trackPageView(restaurantId: string, page: string, referrer: string = "") {
  const db = getDB();
  const visitorId = await getVisitorId();
  await db.prepare(
    "INSERT INTO analytics_events (id, restaurant_id, page, visitor_id, referrer) VALUES (?, ?, ?, ?, ?)"
  ).bind(uuid(), restaurantId, page, visitorId, referrer).run();
}

export async function getStats(restaurantId: string) {
  const db = getDB();
  const pv = await db.prepare(
    "SELECT COUNT(*) as count FROM analytics_events WHERE restaurant_id = ?"
  ).bind(restaurantId).first<{ count: number }>();
  const uv = await db.prepare(
    "SELECT COUNT(DISTINCT visitor_id) as count FROM analytics_events WHERE restaurant_id = ?"
  ).bind(restaurantId).first<{ count: number }>();
  const byDay = await db.prepare(
    "SELECT date(created_at) as day, COUNT(*) as views FROM analytics_events WHERE restaurant_id = ? GROUP BY day ORDER BY day DESC LIMIT 30"
  ).bind(restaurantId).all();
  return { pv: pv?.count ?? 0, uv: uv?.count ?? 0, byDay: byDay.results };
}
```

- [ ] **Step 2: Write analytics tracking API — src/app/api/analytics/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { trackPageView } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  const { restaurantId, page, referrer } = await request.json();
  if (!restaurantId || !page) {
    return NextResponse.json({ error: "restaurantId and page required" }, { status: 400 });
  }
  await trackPageView(restaurantId, page, referrer || "");
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Add tracking script to site layout — src/app/(site)/layout.tsx**

Add a client component that fires POST /api/analytics on page load with restaurantId and current path.

- [ ] **Step 4: Write analytics admin page — src/app/(admin)/restaurants/[id]/analytics/page.tsx**

Display PV, UV, 30-day chart (simple bar chart with Tailwind), top pages, referrers.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add page view analytics tracking and dashboard"
```

---

### Task 16: CI/CD & Cloudflare Setup

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `wrangler.toml` (finalize)

**Interface:**
- Produces: Automatic deployment on git push to main, Cloudflare Pages + D1 migration

- [ ] **Step 1: Write GitHub Actions workflow — .github/workflows/deploy.yml**

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci
      - run: npx wrangler d1 execute autoweb-db --file=migrations/0001_init.sql
        env: { CLOUDFLARE_API_TOKEN: "${{ secrets.CF_API_TOKEN }}" }
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: "${{ secrets.CF_API_TOKEN }}"
          accountId: "${{ secrets.CF_ACCOUNT_ID }}"
          projectName: autoweb
          directory: .next
          wranglerVersion: "3"
```

- [ ] **Step 2: Install @cloudflare/next-on-pages and configure build**

```bash
npm install @cloudflare/next-on-pages
```

Update next.config.ts:
```typescript
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

const nextConfig = { /* existing config */ };

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

export default nextConfig;
```

- [ ] **Step 3: Finalize wrangler.toml with real database_id**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add CI/CD pipeline for Cloudflare Pages deployment"
```

---

### Task 17: Seed Admin User & Final Integration Test

**Files:**
- Modify: `migrations/0001_init.sql` (add admin seed)

- [ ] **Step 1: Add admin seed to migration**

```sql
-- Add to end of migrations/0001_init.sql
INSERT OR IGNORE INTO users (id, email, password_hash, role)
VALUES ('admin-001', 'admin@autoweb.app', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'admin');
-- Default password: 'password' — change on first login
```

- [ ] **Step 2: Run full integration test**

```bash
npm run dev
```
Test checklist:
- [ ] Login at /login with admin credentials
- [ ] Create a restaurant → verify it appears in list
- [ ] Add menu categories + items
- [ ] Switch templates
- [ ] Visit restaurant site via subdomain (or localhost with slug param)
- [ ] Submit reservation → verify email sends (check Resend dashboard)
- [ ] Check analytics page
- [ ] Create demo via outreach → review → approve
- [ ] Mobile responsive check

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add admin seed and complete integration testing"
```
