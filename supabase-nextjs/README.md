# supabase-nextjs

local Supabase と hosted Supabase のどちらにも接続して、Next.js 16 から Supabase Auth の動作を確認するためのアプリです。

## Setup

このアプリは local Supabase 用と cloud Supabase 用で env ファイルを分けています。local 用と cloud 用はそれぞれ別にコピーし、必要な方のプレースホルダーを実値に置き換えてから `dev:local` または `dev:cloud` を実行してください。

```bash
cp .env.supabase.local.example .env.supabase.local
```

```bash
cp .env.supabase.cloud.example .env.supabase.cloud
```

`.env.supabase.local` は devcontainer / Docker 内で動かす local Supabase につなぐ設定です。`<gateway-ip>` と `<local-publishable-key>` を実際の値に置き換えます。

```env
SUPABASE_SERVER_URL=http://<gateway-ip>:54321
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local-publishable-key>
```

- `<gateway-ip>`: `ip route | awk '/default/ { print $3 }'` の結果
- `<local-publishable-key>`: `supabase status` に表示される publishable key

`.env.supabase.cloud` は hosted Supabase につなぐ設定です。`<project-url>` は Terraform の `project_url` 出力で、すでに `https://<project-ref>.supabase.co` の形式です。`<project-url>` と hosted publishable key を実際の値に置き換えます。

```env
SUPABASE_SERVER_URL=<project-url>
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<cloud-publishable-key>
```

- `<project-ref>`: Terraform の `project_ref` 出力。`supabase link --project-ref <project_ref>` にも使います
- `<project-url>`: Terraform の `project_url` 出力。`.env.supabase.cloud` にそのままコピーします
- `<cloud-publishable-key>`: Terraform の `apply` 後に Supabase Dashboard の project settings で確認する publishable key

## Run

```bash
npm install
npm run dev:local
```

local Supabase を使う場合は `npm run dev:local`、hosted Supabase を使う場合は `npm run dev:cloud` を実行します。

```bash
npm run dev:cloud
```

ブラウザで `http://localhost:3000` を開いて確認します。
