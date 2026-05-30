import { cp, mkdir, rm, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../node_modules/flag-icons/flags/4x3");
const dest = resolve(here, "../public/flags");

try {
  await access(src);
} catch {
  console.error(
    `[copy-flags] source not found: ${src}\nRun "pnpm install" so flag-icons is available.`,
  );
  process.exit(1);
}

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });

console.log(`[copy-flags] copied flag-icons SVGs -> ${dest}`);
