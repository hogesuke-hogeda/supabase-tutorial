# supabase-nextjs

ローカル Supabase に接続して、Next.js 16 から Supabase Auth の動作を確認するためのアプリです。

## Setup

このアプリは local Supabase 用と cloud Supabase 用で env ファイルを分けています。利用する方をコピーしてください。

```bash
cp .env.supabase.local.example .env.supabase.local
cp .env.supabase.cloud.example .env.supabase.cloud
```

`.env.supabase.local` は devcontainer / Docker 内で動かす local Supabase につなぐ設定です。

```env
SUPABASE_SERVER_URL=http://<gateway-ip>:54321
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local-publishable-key>
```

- `<gateway-ip>`: `ip route | awk '/default/ { print $3 }'` の結果
- `<local-publishable-key>`: `supabase status` に表示される publishable key

`.env.supabase.cloud` は hosted Supabase につなぐ設定です。

```env
SUPABASE_SERVER_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<cloud-publishable-key>
```

- `<project-ref>`: Terraform の `project_ref` 出力
- `<cloud-publishable-key>`: hosted project の publishable key

## Run

```bash
npm install
npm run dev:local
```

hosted Supabase を使う場合は以下です。

```bash
npm run dev:cloud
```

ブラウザで `http://localhost:3000` を開いて確認します。
