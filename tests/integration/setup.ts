import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// Rebuild a dedicated integration DB from scratch before the suite: drop the
// file, migrate the schema, seed the demo data. Mirrors the E2E global setup
// but targets its own DB (itest.db) so the two suites never collide. Re-running
// this is exactly the "restore to a known state" step — the demo seed wipes and
// re-inserts inside a transaction.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(HERE, "../..");
const REL_DB = "../shared/db/itest.db";
const ABS_DB = path.resolve(FRONTEND_ROOT, REL_DB);

function removeDbFiles(): void {
  for (const suffix of ["", "-shm", "-wal"]) {
    const file = ABS_DB + suffix;
    if (fs.existsSync(file)) fs.rmSync(file, { force: true });
  }
}

function run(cmd: string, args: string[]): void {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: REL_DB },
    shell: false,
    cwd: FRONTEND_ROOT,
  });
  if (result.status !== 0) {
    throw new Error(
      `integration globalSetup: ${cmd} ${args.join(" ")} failed with exit code ${result.status}`,
    );
  }
}

export default function globalSetup(): void {
  // Ensure ../shared/db exists (it is not part of the frontend checkout in CI).
  fs.mkdirSync(path.dirname(ABS_DB), { recursive: true });
  removeDbFiles();
  run("pnpm", ["db:migrate"]);
  // db:seed honours DATABASE_URL (set above) → seeds itest.db, not the real DB.
  run("pnpm", ["db:seed"]);
}
