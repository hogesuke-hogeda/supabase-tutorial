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
- devcontainer を使えること
- hosted workflow を使う場合は `SUPABASE_ACCESS_TOKEN` を用意できること
- Vercel workflow を使う場合は `VERCEL_API_TOKEN` と Vercel team slug or ID を用意できること

このリポジトリの devcontainer は `initializeCommand` で host 側 Docker network を作成し、`postAttachCommand` で container 内から Supabase を起動します。
devcontainer 内には Supabase CLI を同梱しているため、`supabase status` や `bin/init-db.sh` も container 内の `supabase` コマンドで完結します。
さらに Terraform CLI も同梱しているため、hosted workflow の `terraform` / `supabase` コマンドも devcontainer 内で完結します。
`supabase start` の localhost healthcheck は、container 内で `socat` による `127.0.0.1` プロキシを張って通します。
参考:
- Supabase Docs の CLI ガイド: https://supabase.com/docs/guides/cli/getting-started
- Supabase Docs のローカル開発ガイド: https://supabase.com/docs/guides/local-development
- この devcontainer が使っている release asset の配布元: https://github.com/supabase/cli/releases
- Terraform release 一覧: https://releases.hashicorp.com/terraform/

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

### Local workflow

local Supabase だけを使う場合は、Terraform は不要です。先に local stack を起動して DB を初期化します。

```bash
/bin/bash bin/start-supabase.sh
/bin/bash bin/init-db.sh
```

これらのコマンドは devcontainer 内で実行する前提です。

`/bin/bash bin/init-db.sh up` を使うと、未適用のマイグレーションだけを反映できます。

Next.js の local 用 env を作成し、`supabase-nextjs/README.md` を見ながら `<gateway-ip>` と `supabase status` の publishable key を実値に置き換えます。`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` には local Supabase の publishable key を入れます。

```bash
cd supabase-nextjs
cp .env.supabase.local.example .env.supabase.local
```

`.env.supabase.local` には、`<gateway-ip>` と `<local-publishable-key>` を実際の値に置き換えてから使います。`<local-publishable-key>` は local Supabase の `supabase status` に表示される publishable key です。

```bash
npm install
npm run dev:local
```

### Hosted workflow

hosted Supabase を使う場合も、Terraform と `supabase` CLI は devcontainer 内で実行する前提です。同じリポジトリ checkout を devcontainer で開いた状態で、以下を順に実行します。

まず Supabase の production / preview project を Terraform で作成します。

```bash
cp terraform/supabase/terraform.tfvars.example terraform/supabase/terraform.tfvars
export SUPABASE_ACCESS_TOKEN=<your-access-token>
terraform -chdir=terraform/supabase init
terraform -chdir=terraform/supabase plan
terraform -chdir=terraform/supabase apply -target=supabase_project.preview
terraform -chdir=terraform/supabase apply -target=supabase_project.production
terraform -chdir=terraform/supabase apply
terraform -chdir=terraform/supabase output
```

初めて hosted project を作る場合は、先に `supabase_project.preview` と `supabase_project.production` を target apply で作成し、その後の通常 apply で settings を適用します。Supabase project 作成直後は hosted services が完全に起動するまで時間がかかるため、project 作成と settings 適用を同じ apply にまとめないようにしています。既に project が作成済みの場合は、通常の `terraform -chdir=terraform/supabase apply` だけで差分を反映できます。

Terraform は `production_project_ref`, `production_project_url`, `preview_project_ref`, `preview_project_url` を出力します。`supabase link --project-ref <project_ref>` には利用したい環境の `project_ref` を使い、`.env.supabase.cloud` には利用したい環境の `project_url` をそのまま使います。

Terraform の apply 後に、Supabase Dashboard の project Connect dialog か `Settings > API Keys` で production / preview それぞれの publishable key を取得します。`.env.supabase.cloud` の `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` には接続先に対応した hosted project の publishable key を使います。こちらは local の publishable key とは別です。

Hosted Supabase でこのチュートリアルの email confirmation をそのまま試す場合は、Supabase 側のメール送信設定にも注意してください。既定の hosted SMTP 制限では確認メールの挙動をローカルと同じように再現できないことがあるため、必要に応じて team member 宛てで試すか、custom SMTP を設定してください。

```bash
supabase login
supabase link --project-ref <project_ref>
supabase db push --linked
```

Next.js の cloud 用 env を作成し、`supabase-nextjs/README.md` を見ながら `project_url` と hosted publishable key を実値に置き換えます。

```bash
cd supabase-nextjs
cp .env.supabase.cloud.example .env.supabase.cloud
```

`.env.supabase.cloud` には Terraform の `preview_project_url` か `production_project_url` と hosted publishable key を実際の値に置き換えてから使います。`project_url` はすでに `https://<project-ref>.supabase.co` の形式です。local で hosted Supabase を確認するときは `SITE_URL=http://localhost:3000` も入れておきます。

```bash
npm install
npm run dev:cloud
```

### Vercel workflow

Vercel を使う場合は、Supabase の production / preview project を作成したあとに Vercel project を Terraform で作成します。

```bash
cp terraform/vercel/terraform.tfvars.example terraform/vercel/terraform.tfvars
export VERCEL_API_TOKEN=<your-vercel-api-token>
terraform -chdir=terraform/vercel init
terraform -chdir=terraform/vercel plan
terraform -chdir=terraform/vercel apply
terraform -chdir=terraform/vercel output
```

`terraform/vercel/terraform.tfvars` には以下を入れます。

- `team_id`: Vercel team slug または ID
- `github_repository`: `owner/repo` 形式の GitHub repository
- `production_supabase_url`: Terraform の `production_project_url`
- `preview_supabase_url`: Terraform の `preview_project_url`
- `*_publishable_key`: 各 Supabase project の publishable key

この stack は Vercel Project を作成し、`supabase-nextjs` を root directory に設定します。さらに:

- `Production` env に production Supabase を設定
- `Preview` env に preview Supabase を設定
- `Automatically expose System Environment Variables` を有効化

これで `main` への push が Production Deployments、PR が Preview Deployments になります。Next.js 側は Vercel 上で `VERCEL_URL` / `VERCEL_PROJECT_PRODUCTION_URL` を使って confirmation redirect を解決します。

### ブラウザで確認

- アプリ: `http://localhost:3000`

トップページを開くと `/login` へリダイレクトし、Supabase Auth のログイン画面が表示されます。local workflow は local project に、Hosted workflow は hosted project に接続します。

## 主な画面

- `/login`: email / password の入力、ログイン、サインアップ、確認メール案内メッセージ
- `/account`: ログイン中ユーザーの email 表示、プロフィール編集、サインアウト
