# supabase-nextjs

local Supabase と hosted Supabase のどちらにも接続して、Next.js 16 から Supabase Auth の動作を確認するためのアプリです。

## Setup

このアプリは local Supabase 用と cloud Supabase 用で env ファイルを分けています。local 用と cloud 用はそれぞれ別に作成し、必要な方のファイルを `dotenvx` 経由で読み込んで起動します。

signup confirmation の redirect URL は次の優先順位で決まります。

- Vercel 上では `VERCEL_TARGET_ENV` / `VERCEL_ENV` と `VERCEL_URL` / `VERCEL_PROJECT_PRODUCTION_URL`
- local や non-Vercel 実行では `SITE_URL`

そのため、local 実行用の env には `SITE_URL=http://localhost:3000` を入れておきます。Vercel deploy では `SITE_URL` は不要で、Project Settings の `Automatically expose System Environment Variables` を有効にします。

### Local

```bash
cp .env.supabase.local.example .env.supabase.local
```

`.env.supabase.local` は devcontainer / Docker 内で動かす local Supabase につなぐ設定です。`<gateway-ip>` と `supabase status` の publishable key を実際の値に置き換えます。

```env
SITE_URL=http://localhost:3000
SUPABASE_SERVER_URL=http://<gateway-ip>:54321
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local-publishable-key>
```

`<gateway-ip>` は `ip route | awk '/default/ { print $3 }'` の結果です。`<local-publishable-key>` は local Supabase の `supabase status` に表示される publishable key です。
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` にはこの local publishable key を入れます。
`SITE_URL` は local signup confirmation を `http://localhost:3000/auth/confirm` に戻すために使います。

### Cloud

```bash
cp .env.supabase.cloud.example .env.supabase.cloud
```

`.env.supabase.cloud` は hosted Supabase につなぐ設定です。`<project-url>` は Terraform の `preview_project_url` か `production_project_url` 出力で、すでに `https://<project-ref>.supabase.co` の形式です。local で hosted Supabase を確認するときは `SITE_URL` も `http://localhost:3000` にしておきます。

```env
SITE_URL=http://localhost:3000
SUPABASE_SERVER_URL=<project-url>
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<cloud-publishable-key>
```

- `<project-ref>`: Terraform の `preview_project_ref` か `production_project_ref` 出力。`supabase link --project-ref <project_ref>` にも使います
- `<project-url>`: Terraform の `preview_project_url` か `production_project_url` 出力。`.env.supabase.cloud` にそのままコピーします
- `<cloud-publishable-key>`: Terraform の `apply` 後に Supabase Dashboard の Project Connect dialog か `Settings > API Keys` で確認する publishable key
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` にはこの hosted publishable key を入れます。

## Run

```bash
npm install
```

`npm install` で `dotenvx` も入るので、追加のラッパースクリプトは不要です。

実行するのは `npm run dev:local` か `npm run dev:cloud` のどちらか一方です。local Supabase を使う場合は:

```bash
npm run dev:local
```

hosted Supabase を使う場合は:

```bash
npm run dev:cloud
```

どちらのコマンドも、対応する env ファイルを `dotenvx run -f ... -- next dev` で読み込んで起動します。

ブラウザで `http://localhost:3000` を開いて確認します。
