# supabase-nextjs

local Supabase と Hosted Supabase の両方に接続して、Next.js 16 から Supabase Auth の動作を確認するためのアプリです。

## 役割

- email/password のサインアップとログインを試す
- Server Component / Server Action / Route Handler / Proxy から Supabase SSR を確認する
- local と hosted の接続先を env ファイルで切り替える

## 起動前にやること

このアプリは接続先ごとに env ファイルを分けています。

- local Supabase を使う: `.env.supabase.local`
- Hosted Supabase を使う: `.env.supabase.cloud`

依存関係をまだ入れていない場合は先に実行します。

```bash
npm install
```

`dotenvx` は依存関係として入るので、追加のラッパースクリプトは不要です。

## Redirect URL の決まり方

signup confirmation で使う `emailRedirectTo` は、実行環境に応じて次の順序で解決します。

1. フォームから渡された現在の URL
2. Vercel Production では `VERCEL_PROJECT_PRODUCTION_URL`
3. request headers から組み立てた現在の origin
4. Vercel Preview では `VERCEL_BRANCH_URL`
5. `VERCEL_URL`
6. `SITE_URL`

要点は次のとおりです。

- local 実行では通常 `SITE_URL=http://localhost:3000` を使います
- Vercel Preview では、固定の production URL ではなく preview deployment の URL を優先します
- Vercel 上では system environment variables を有効にしておく前提です

実装は [lib/deployment-url.ts](lib/deployment-url.ts) にあります。

## Local Supabase 用 env

```bash
cp .env.supabase.local.example .env.supabase.local
```

`.env.supabase.local` は devcontainer / Docker 内で動く Next.js から local Supabase へ接続するための設定です。

```env
SITE_URL=http://localhost:3000
SUPABASE_SERVER_URL=http://<gateway-ip>:54321
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local-publishable-key>
```

置き換える値は次の 2 つです。

- `<gateway-ip>`: `ip route | awk '/default/ { print $3 }'` の結果
- `<local-publishable-key>`: `supabase status` に表示される publishable key

変数の意味は次のとおりです。

- `SUPABASE_SERVER_URL`: server-side から到達する local Supabase URL
- `NEXT_PUBLIC_SUPABASE_URL`: browser-side から到達する local Supabase URL
- `SITE_URL`: signup confirmation を `http://localhost:3000/auth/confirm` に戻すための base URL

## Hosted Supabase 用 env

```bash
cp .env.supabase.cloud.example .env.supabase.cloud
```

`.env.supabase.cloud` は Hosted Supabase に接続するための設定です。

```env
SITE_URL=http://localhost:3000
SUPABASE_SERVER_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<cloud-publishable-key>
```

置き換える値は次のとおりです。

- `<project-ref>`: Terraform の `preview_project_ref` または `production_project_ref`
- `<cloud-publishable-key>`: Hosted Supabase の publishable key

補足:

- local で hosted Supabase を試すなら `SITE_URL=http://localhost:3000` を入れます
- Vercel 上では deployment ごとの URL を使うので、`SITE_URL` は必須ではありません
- `supabase link --project-ref <project_ref>` に使うのもこの project ref です

## 起動

local Supabase につなぐ場合:

```bash
npm run dev:local
```

Hosted Supabase につなぐ場合:

```bash
npm run dev:cloud
```

どちらも `dotenvx run -f ... -- next dev` で対応する env を読み込んで起動します。

ブラウザでは `http://localhost:3000` を開きます。

## 関連ドキュメント

- リポジトリ全体の流れ: [../README.md](../README.md)
- local Supabase の設定: [../supabase/config.toml](../supabase/config.toml)
