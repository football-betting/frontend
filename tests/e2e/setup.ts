import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(HERE, "../..");
const TEST_DB = path.resolve(FRONTEND_ROOT, "../shared/db/test.db");

function removeDbFiles(): void {
  for (const suffix of ["", "-shm", "-wal"]) {
    const file = TEST_DB + suffix;
    if (fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }
}

function run(cmd: string, args: string[]): void {
  const env = {
    ...process.env,
    DATABASE_URL: "../shared/db/test.db",
  };
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env,
    shell: false,
    cwd: FRONTEND_ROOT,
  });
  if (result.status !== 0) {
    throw new Error(
      `globalSetup: ${cmd} ${args.join(" ")} failed with exit code ${result.status}`,
    );
  }
}

export default async function globalSetup(): Promise<void> {
  removeDbFiles();
  run("pnpm", ["db:migrate"]);
  run("pnpm", ["db:seed:test"]);
}
