# supabase-tutorial

ローカルの Supabase Postgres に Next.js から接続できるかを確認するための最小構成です。
`supabase/` に Supabase CLI 用の設定、`supabase-nextjs/` に接続確認用の Next.js アプリを置いています。

## できること

- Next.js サーバー側で Postgres に接続する
- `current_database()`, `now()`, `version()` の結果を画面表示する
- 接続先ホスト、ポート、DB 名、ユーザー名を確認する
- devcontainer / Docker 内で `127.0.0.1` を使って失敗しやすいケースに対してヒントを出す

## ディレクトリ構成

- `.codex/superpowers/`: 開発用スキル群。Git submodule として管理
- `supabase/`: Supabase CLI のローカル開発設定
- `supabase-nextjs/`: 接続確認用の Next.js 16 アプリ
- `.devcontainer/`: 開発コンテナ設定。初回起動時に host 側で Supabase を立ち上げる

## 前提条件

- host 側で Docker が使えること
- host 側に Node.js と `npm` / `npx` が入っていること
- 推奨 Node.js は 24 系
  - `v24.14.0` で確認

このリポジトリの devcontainer は `initializeCommand` で host 側から `npx supabase start` を実行します。
そのため、Supabase CLI は devcontainer 内ではなく host 側の Node.js 実行環境で動く前提です。

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

devcontainer を開く場合は、初期化時に以下が host 側で自動実行されます。

```bash
npx supabase start --workdir <repo-root> --network-id br-supabase-tutorial-$USER
```

手動で起動する場合は、リポジトリ直下で実行してください。

```bash
npx supabase start --network-id br-supabase-tutorial-$USER
```

主要ポートは以下です。

- API: `54321`
- Postgres: `54322`
- Supabase Studio: `54323`

### 2. Next.js アプリの環境変数を作成

```bash
cd supabase-nextjs
cp .env.local.example .env.local
```

デフォルトの `DATABASE_URL` は host 上で Next.js を動かす前提です。

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

devcontainer や Docker コンテナ内で Next.js を動かす場合は、`127.0.0.1` ではなくコンテナから見た host 側ゲートウェイ IP に変更してください。

```bash
ip route | awk '/default/ { print $3 }'
```

この workspace では `172.17.0.1` になる想定です。例:

```env
DATABASE_URL=postgresql://postgres:postgres@172.17.0.1:54322/postgres
```

### 3. Next.js アプリを起動

```bash
cd supabase-nextjs
npm install
npm run dev
```

### 4. ブラウザで確認

- アプリ: `http://localhost:3000`
- Supabase Studio: `http://127.0.0.1:54323`

トップページを開くと、Next.js サーバー側で Postgres に問い合わせた結果が表示されます。

## 画面に表示される内容

- 接続成功 / 失敗
- 計測時刻
- 接続レイテンシ
- データベース名
- サーバー時刻
- Postgres バージョン
- 接続先ホスト / ポート / DB 名 / ユーザー名

接続失敗時はエラーメッセージに加え、devcontainer 内から `127.0.0.1:54322` へ接続している典型的なケースでは設定見直しのヒントも表示されます。
