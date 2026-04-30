# supabase-tutorial

ローカル Supabase と Hosted Supabase の両方を使って、Next.js 16 から Supabase Auth の動作を確認するためのチュートリアルです。

このリポジトリには次の 3 つが含まれます。

- `supabase/`: Supabase CLI で動かす local 開発設定
- `supabase-nextjs/`: 接続確認用の Next.js 16 アプリ
- `terraform/`: Hosted Supabase と Vercel を構成する Terraform

## できること

- email/password のサインアップとログインを試す
- Server Component / Server Action / Route Handler / Proxy から Supabase SSR を使う
- local Supabase と Hosted Supabase を切り替えて同じアプリで動作確認する
- Vercel の Production / Preview で Supabase 接続先を分ける

## ディレクトリ構成

- `.devcontainer/`: devcontainer 設定。attach 時に local Supabase を自動起動する
- `.codex/superpowers/`: 開発用スキル群。Git submodule として管理
- `bin/`: local Supabase の起動と DB 初期化スクリプト
- `supabase/`: local Supabase の設定、migration、email template
- `supabase-nextjs/`: Next.js 16 アプリ
- `terraform/supabase/`: Hosted Supabase の Terraform
- `terraform/vercel/`: Vercel の Terraform

## 前提条件

- Docker が使えること
- devcontainer を使えること
- local workflow では devcontainer 内で作業すること
- Hosted workflow では `SUPABASE_ACCESS_TOKEN` を用意できること
- Vercel workflow では `VERCEL_API_TOKEN` と team slug または ID を用意できること

この devcontainer には Supabase CLI と Terraform CLI が入っています。`initializeCommand` で host 側 Docker network を作成し、`postAttachCommand` で container 内から local Supabase を起動します。

## セットアップ

clone 後に submodule を取得します。

```bash
git submodule update --init --recursive
```

`.codex/superpowers` を更新する場合は以下を使います。

```bash
git submodule update --remote .codex/superpowers
git add .codex/superpowers
git commit -m "Update superpowers submodule"
```

## 最短で試す: Local workflow

local Supabase だけを試すなら、最初はこの手順だけで十分です。Terraform は不要です。

1. devcontainer でこのリポジトリを開く
2. local Supabase を起動する
3. DB を初期化する
4. Next.js 用の local env を作る
5. アプリを起動する

```bash
/bin/bash bin/start-supabase.sh
/bin/bash bin/init-db.sh
cd supabase-nextjs
cp .env.supabase.local.example .env.supabase.local
npm install
npm run dev:local
```

`.env.supabase.local` では次を実値に置き換えます。

- `<gateway-ip>`: `ip route | awk '/default/ { print $3 }'` の結果
- `<local-publishable-key>`: `supabase status` に表示される publishable key

env の詳細は [supabase-nextjs/README.md](supabase-nextjs/README.md) を参照してください。

### Local workflow の補足

- `bin/init-db.sh` は引数なしだと `reset` で全 migration を再適用します
- `bin/init-db.sh up` を使うと未適用 migration だけを反映します
- local の redirect URL は `supabase/config.toml` で管理します
- ブラウザでは `http://localhost:3000` を開きます。トップページは `/login` へリダイレクトします

## Hosted workflow

Hosted Supabase を使う場合は、先に Supabase project を Terraform で作成してから `supabase link` と `supabase db push --linked` を実行します。

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

初回は preview / production project を先に作ってから、最後に通常の `apply` で settings を入れます。project 作成直後は hosted services の起動待ちが必要なため、1 回の apply にまとめない前提です。

Terraform の出力で確認する主な値は次のとおりです。

- `preview_project_ref`
- `preview_project_url`
- `production_project_ref`
- `production_project_url`

続いて接続したい project に link し、migration を反映します。

```bash
supabase login
supabase link --project-ref <project_ref>
supabase db push --linked
```

その後、Next.js 側の cloud env を作って起動します。

```bash
cd supabase-nextjs
cp .env.supabase.cloud.example .env.supabase.cloud
npm install
npm run dev:cloud
```

`.env.supabase.cloud` では、接続先に対応する hosted project の URL と publishable key を設定します。詳細は [supabase-nextjs/README.md](supabase-nextjs/README.md) を参照してください。

### Hosted workflow の注意点

- hosted の redirect 設定と email template は `terraform/supabase/` で管理します
- `terraform/supabase/terraform.tfvars` の placeholder を残したまま apply しないでください
- Hosted Supabase の確認メールは local と送信制約が異なるため、必要に応じて custom SMTP を設定してください
- local で hosted Supabase を試す場合は `.env.supabase.cloud` に `SITE_URL=http://localhost:3000` を入れます

## Vercel workflow

Vercel を使う場合は、Hosted Supabase を作成したあとで Vercel project を Terraform で作成します。

```bash
cp terraform/vercel/terraform.tfvars.example terraform/vercel/terraform.tfvars
export VERCEL_API_TOKEN=<your-vercel-api-token>
terraform -chdir=terraform/vercel init
terraform -chdir=terraform/vercel plan
terraform -chdir=terraform/vercel apply
terraform -chdir=terraform/vercel output
```

`terraform/vercel/terraform.tfvars` には次を設定します。

- `team_id`
- `github_repository`
- `production_supabase_url`
- `production_supabase_publishable_key`
- `preview_supabase_url`
- `preview_supabase_publishable_key`

この stack は `supabase-nextjs` を root directory にした Vercel Project を作成し、Production には production Supabase、Preview には preview Supabase を割り当てます。Vercel 上では system environment variables を使って redirect URL を解決するため、Preview Deployment ごとに正しい確認リンクを返せます。

初回は `main` を 1 回 push して Production Deployment を作っておく運用です。

```bash
git switch main
git pull --ff-only origin main
git commit --allow-empty -m "chore: trigger production deploy"
git push origin main
```

## どこを見ればよいか

- local / cloud env の詳細: [supabase-nextjs/README.md](supabase-nextjs/README.md)
- Vercel 導入時の設計メモ: [docs/plans/2026-04-26-vercel-deployment.md](docs/plans/2026-04-26-vercel-deployment.md)
- local redirect 設定: [supabase/config.toml](supabase/config.toml)

## 参考

- Supabase CLI getting started: https://supabase.com/docs/guides/cli/getting-started
- Supabase local development: https://supabase.com/docs/guides/local-development
- Supabase CLI releases: https://github.com/supabase/cli/releases
- Terraform releases: https://releases.hashicorp.com/terraform/
