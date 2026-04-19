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

`apply` が終わったら出力を確認します。`project_ref` と `project_url` が後続の CLI 作業に必要です。

```bash
terraform -chdir=terraform/supabase output
```

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

### 3. Next.js アプリを起動する

`supabase-nextjs/README.md` の手順に従って、利用するプロファイルに応じた環境変数ファイルを作成してください。

```bash
cd supabase-nextjs
cp .env.supabase.local.example .env.supabase.local
cp .env.supabase.cloud.example .env.supabase.cloud
npm install
npm run dev:local
```

`npm run dev:local` はローカル Supabase 向け、`npm run dev:cloud` は hosted Supabase 向けです。

### 4. ブラウザで確認

- アプリ: `http://localhost:3000`

トップページを開くと `/login` へリダイレクトし、Supabase Auth のログイン画面が表示されます。設定したプロファイルに応じて、local project か hosted project へ接続します。

## 主な画面

- `/login`: email / password の入力、ログイン、サインアップ、確認メール案内メッセージ
- `/account`: ログイン中ユーザーの email 表示、プロフィール編集、サインアウト
