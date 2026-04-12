# supabase-nextjs

ローカル Supabase に接続して、Next.js 16 から Supabase Auth の動作を確認するためのアプリです。

## Setup

```bash
cp .env.local.example .env.local
```

`.env.local` は次の値に合わせて更新してください。

```env
SUPABASE_SERVER_URL=http://<gateway-ip>:54321
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

- `<gateway-ip>`: `ip route | awk '/default/ { print $3 }'` の結果
- `<your-publishable-key>`: `npx supabase status` に表示される publishable key

## Run

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開いて確認します。
