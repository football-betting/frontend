import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import fs from "node:fs";

const dbPath = process.env.DATABASE_URL ?? "../shared/db/database.db";

const resolved = path.resolve(dbPath);
fs.mkdirSync(path.dirname(resolved), { recursive: true });

const sqlite = new Database(resolved);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: "./db/migrations" });

sqlite.close();
console.log(`Migrations applied to ${resolved}`);
