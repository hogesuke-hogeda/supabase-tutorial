import Link from "next/link";
import { checkPostgresConnection, getConnectionDetails } from "@/lib/postgres";

export const dynamic = "force-dynamic";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </dt>
      <dd className="break-all font-mono text-sm text-zinc-900">{value}</dd>
    </div>
  );
}

export default async function Home() {
  const connectionDetails = getConnectionDetails();
  const connectionResult = await checkPostgresConnection();
  const shouldShowDockerHint =
    !connectionResult.ok &&
    connectionResult.error.includes("ECONNREFUSED 127.0.0.1:54322");
  const checkedAt = new Date().toLocaleString("ja-JP", {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#f8fafc_38%,_#e2e8f0_100%)] px-6 py-10 text-zinc-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <section className="rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
                Supabase Postgres Check
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950">
                Next.js から Supabase Postgres へ接続できるかを確認するだけのページ
              </h1>
              <p className="max-w-2xl text-base leading-7 text-zinc-700">
                サーバー側で <code>select now(), version()</code> を実行し、その結果をそのまま表示します。
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              再読み込み
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Result
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-950">
                  {connectionResult.ok ? "接続成功" : "接続失敗"}
                </h2>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  connectionResult.ok
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {connectionResult.ok ? "OK" : "ERROR"}
              </span>
            </div>

            <dl className="mt-6 grid gap-4">
              <DetailRow label="Checked At" value={checkedAt} />
              <DetailRow
                label="Latency"
                value={
                  connectionResult.durationMs === null
                    ? "not measured"
                    : `${connectionResult.durationMs} ms`
                }
              />
              {connectionResult.ok ? (
                <>
                  <DetailRow
                    label="Database"
                    value={connectionResult.databaseName}
                  />
                  <DetailRow
                    label="Server Time"
                    value={connectionResult.serverTime}
                  />
                  <DetailRow
                    label="Postgres Version"
                    value={connectionResult.version}
                  />
                </>
              ) : (
                <>
                  <DetailRow label="Error" value={connectionResult.error} />
                  {shouldShowDockerHint ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
                      devcontainer や Docker コンテナ内で Next.js を動かしている場合、
                      <code className="mx-1">127.0.0.1</code>
                      ではなくホスト側ゲートウェイ IP を使う必要があります。
                    </div>
                  ) : null}
                </>
              )}
            </dl>
          </article>

          <aside className="rounded-[2rem] border border-black/10 bg-zinc-950 p-8 text-zinc-50 shadow-[0_12px_40px_rgba(15,23,42,0.18)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Connection Target
            </p>
            <div className="mt-5 grid gap-4">
              {connectionDetails ? (
                <>
                  <DetailRow label="Host" value={connectionDetails.host} />
                  <DetailRow label="Port" value={connectionDetails.port} />
                  <DetailRow
                    label="Database"
                    value={connectionDetails.database}
                  />
                  <DetailRow label="User" value={connectionDetails.user} />
                </>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-zinc-200">
                  <p>
                    <code>DATABASE_URL</code> が未設定です。
                  </p>
                  <p className="mt-2">
                    既定のローカル Supabase では
                    <code className="ml-1">
                      postgresql://postgres:postgres@127.0.0.1:54322/postgres
                    </code>
                    を使えます。
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-zinc-200">
              <p className="font-semibold text-white">使い方</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                <li>リポジトリ直下で <code>npx supabase start</code></li>
                <li>
                  <code>supabase-nextjs/.env.local.example</code> を
                  <code className="mx-1">.env.local</code> としてコピー
                </li>
                <li>
                  <code>cd supabase-nextjs && npm run dev</code>
                </li>
              </ol>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="http://127.0.0.1:54323"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:bg-white/10"
                >
                  Supabase Studio
                </a>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
