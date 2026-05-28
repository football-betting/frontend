import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DATABASE_URL ?? "../shared/db/database.db";
const resolved = path.resolve(dbPath);

for (const suffix of ["", "-shm", "-wal"]) {
  const file = resolved + suffix;
  if (fs.existsSync(file)) {
    fs.rmSync(file, { force: true });
    console.log(`Removed ${file}`);
  }
}

function run(cmd: string, args: string[]): void {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const pnpm = process.env.npm_execpath ?? "pnpm";
const useNode = pnpm.endsWith(".js") || pnpm.endsWith(".cjs");

if (useNode) {
  run(process.execPath, [pnpm, "db:migrate"]);
  run(process.execPath, [pnpm, "db:seed"]);
} else {
  run(pnpm, ["db:migrate"]);
  run(pnpm, ["db:seed"]);
}
