import { Pool } from "pg";

type PostgresPoolGlobal = typeof globalThis & {
  postgresPool?: Pool;
  postgresPoolConnectionString?: string;
};

type ConnectionDetails = {
  host: string;
  port: string;
  database: string;
  user: string;
};

export type PostgresCheckResult =
  | {
      ok: true;
      durationMs: number;
      databaseName: string;
      serverTime: string;
      version: string;
    }
  | {
      ok: false;
      durationMs: number | null;
      error: string;
    };

function getDatabaseUrl() {
  return process.env.DATABASE_URL;
}

function getPool(connectionString: string) {
  const globalForPostgres = globalThis as PostgresPoolGlobal;

  if (
    !globalForPostgres.postgresPool ||
    globalForPostgres.postgresPoolConnectionString !== connectionString
  ) {
    if (globalForPostgres.postgresPool) {
      void globalForPostgres.postgresPool.end();
    }

    globalForPostgres.postgresPool = new Pool({
      connectionString,
      max: 1,
    });
    globalForPostgres.postgresPoolConnectionString = connectionString;
  }

  return globalForPostgres.postgresPool;
}

export function getConnectionDetails(): ConnectionDetails | null {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    return null;
  }

  try {
    const parsed = new URL(databaseUrl);

    return {
      host: parsed.hostname,
      port: parsed.port || "5432",
      database: parsed.pathname.replace(/^\//, "") || "postgres",
      user: decodeURIComponent(parsed.username) || "postgres",
    };
  } catch {
    return null;
  }
}

export async function checkPostgresConnection(): Promise<PostgresCheckResult> {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    return {
      ok: false,
      durationMs: null,
      error:
        "DATABASE_URL が未設定です。supabase-nextjs/.env.local.example を参考に .env.local を作成してください。",
    };
  }

  const startedAt = Date.now();

  try {
    const pool = getPool(databaseUrl);
    const result = await pool.query<{
      database_name: string;
      server_time: string;
      version: string;
    }>(`
      select
        current_database() as database_name,
        now()::text as server_time,
        version() as version
    `);

    return {
      ok: true,
      durationMs: Date.now() - startedAt,
      databaseName: result.rows[0]?.database_name ?? "unknown",
      serverTime: result.rows[0]?.server_time ?? "unknown",
      version: result.rows[0]?.version ?? "unknown",
    };
  } catch (error) {
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      error:
        error instanceof Error ? error.message : "Unknown postgres error",
    };
  }
}
