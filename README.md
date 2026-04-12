# supabase-tutorial

ローカルの Supabase に Next.js から接続して認証フローを確認するための最小構成です。
`supabase/` に Supabase CLI 用の設定、`supabase-nextjs/` に接続確認用の Next.js アプリを置いています。

## できること

- Supabase Auth の email/password サインアップとログインを試す
- Server Component / Server Action / Route Handler / Proxy から Supabase SSR を使う
- devcontainer / Docker 内でも browser-side と server-side の Supabase 接続先を分けて設定できる

## ディレクトリ構成

- `.codex/superpowers/`: 開発用スキル群。Git submodule として管理
- `supabase/`: Supabase CLI のローカル開発設定
- `supabase-nextjs/`: 接続確認用の Next.js 16 アプリ
- `.devcontainer/`: 開発コンテナ設定。attach 時に container 内から Supabase を自動起動する

## 前提条件

- host 側で Docker が使えること

このリポジトリの devcontainer は `initializeCommand` で host 側 Docker network を作成し、`postAttachCommand` で container 内から Supabase を起動します。
devcontainer 内には Supabase CLI を同梱しているため、`supabase status` や `bin/init-db.sh` も container 内の `supabase` コマンドで完結します。
`supabase start` の localhost healthcheck は、container 内で `socat` による `127.0.0.1` プロキシを張って通します。
参考:
- Supabase Docs の CLI ガイド: https://supabase.com/docs/guides/cli/getting-started
- Supabase Docs のローカル開発ガイド: https://supabase.com/docs/guides/local-development
- この devcontainer が使っている release asset の配布元: https://github.com/supabase/cli/releases

## Submodule の初期化と更新

clone 後に `.codex/superpowers` を取得するには以下を実行してください。

```bash
git submodule update --init --recursive
```

`.codex/superpowers` を upstream の最新に更新する場合は以下です。

```bash
git submodule update --remote .codex/superpowers
```

更新後は親リポジトリ側で submodule の参照コミット差分をコミットします。

```bash
git add .codex/superpowers
git commit -m "Update superpowers submodule"
```

## 起動手順

### 1. Supabase を起動

devcontainer に attach すると、毎回 container 内で以下相当が自動実行されます。既に起動済みなら no-op です。

```bash
/bin/bash bin/start-supabase.sh
```

手動で再実行したい場合も、devcontainer 内で同じコマンドを使ってください。

主要ポートは以下です。

- API: `54321`
- Postgres: `54322`
- Supabase Studio: `54323`

### 2. DB を初期化（devcontainer 内）

Supabase 起動後に、devcontainer 内で以下を実行します。

```bash
/bin/bash bin/init-db.sh
```

既定では container 内で一時的に `127.0.0.1:54322` へのプロキシを張り、`supabase db reset --local` を実行して全マイグレーションと `seed.sql` を適用します。

未適用マイグレーションだけを反映する場合は以下です。

```bash
/bin/bash bin/init-db.sh up
```

### 3. Next.js アプリの環境変数を作成

```bash
cd supabase-nextjs
cp .env.local.example .env.local
```

このプロジェクトでは devcontainer 内で Next.js を動かすため、server-side だけ host 側ゲートウェイ IP を使います。`NEXT_PUBLIC_SUPABASE_URL` はブラウザから到達できる URL のまま `127.0.0.1` を使ってください。

```bash
ip route | awk '/default/ { print $3 }'
```

host 側ゲートウェイ IP は以下で確認できます。`.env.local` には次のように設定してください。

```env
SUPABASE_SERVER_URL=http://<gateway-ip>:54321
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` には devcontainer 内で `supabase status` を実行したときに表示される publishable key を設定してください。

### 4. Next.js アプリを起動

```bash
cd supabase-nextjs
npm install
npm run dev
```

### 5. ブラウザで確認

- アプリ: `http://localhost:3000`
- Supabase Studio: `http://127.0.0.1:54323`
- Supabase Inbox: `http://127.0.0.1:54324`

トップページを開くと `/login` へリダイレクトし、Supabase Auth のログイン画面が表示されます。
サインアップ後の確認メールは Supabase Inbox を開いて確認できます。メール内のリンクから `/auth/confirm` に遷移すると、確認完了後に `/account` へ進みます。

## 主な画面

- `/login`: email / password の入力、ログイン、サインアップ、確認メール案内メッセージ
- `/account`: ログイン中ユーザーの email 表示、プロフィール編集、サインアウト
