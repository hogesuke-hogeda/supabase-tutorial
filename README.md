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

### 1. Hosted Supabase を Terraform で用意する

まず `terraform/supabase/terraform.tfvars.example` をコピーして、プロジェクト情報を埋めた `terraform/supabase/terraform.tfvars` を作成します。

```bash
cp terraform/supabase/terraform.tfvars.example terraform/supabase/terraform.tfvars
```

Terraform の管理用トークンを環境変数で設定します。

```bash
export SUPABASE_ACCESS_TOKEN=<your-access-token>
```

その後、Hosted Supabase を作成・更新します。

```bash
terraform -chdir=terraform/supabase init
terraform -chdir=terraform/supabase plan
terraform -chdir=terraform/supabase apply
```

`apply` が終わったら出力を確認します。`project_ref` はこのあと `supabase link` に使い、`project_url` は `.env.supabase.cloud` に使います。

```bash
terraform -chdir=terraform/supabase output
```

Terraform の apply 後に、Supabase Dashboard の project settings から hosted project の publishable key も確認してください。`.env.supabase.cloud` の `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` に使います。

### 2. Supabase CLI を hosted project にリンクする

CLI にまだログインしていない場合は先に認証します。

```bash
supabase login
```

Terraform の `project_ref` を使って hosted project にリンクします。

```bash
supabase link --project-ref <project_ref>
```

ローカルのマイグレーションを hosted project に反映します。

```bash
supabase db push --linked
```

### 3. ローカル Supabase を起動して初期化する

local flow を使う場合は、devcontainer 内で Supabase を起動して DB を初期化します。

```bash
/bin/bash bin/start-supabase.sh
/bin/bash bin/init-db.sh
```

`/bin/bash bin/init-db.sh up` を使うと、未適用のマイグレーションだけを反映できます。

### 4. Next.js アプリの env を用意する

`supabase-nextjs/README.md` では `dev:local` と `dev:cloud` の両方を使えるように、2 つの env ファイルを用意します。必要なら片方だけでも構いませんが、このリポジトリでは両方コピーして実行時に切り替える前提で説明します。

```bash
cd supabase-nextjs
cp .env.supabase.local.example .env.supabase.local
cp .env.supabase.cloud.example .env.supabase.cloud
```

`.env.supabase.local` は devcontainer / Docker 内で動かす local Supabase 用、`.env.supabase.cloud` は Terraform で作成した hosted Supabase 用です。

### 5. Next.js アプリを起動する

```bash
npm install
npm run dev:local
```

local Supabase を使うときは `npm run dev:local`、hosted Supabase を使うときは `npm run dev:cloud` を実行します。

### 6. ブラウザで確認

- アプリ: `http://localhost:3000`

トップページを開くと `/login` へリダイレクトし、Supabase Auth のログイン画面が表示されます。設定したプロファイルに応じて、local project か hosted project へ接続します。

## 主な画面

- `/login`: email / password の入力、ログイン、サインアップ、確認メール案内メッセージ
- `/account`: ログイン中ユーザーの email 表示、プロフィール編集、サインアウト
