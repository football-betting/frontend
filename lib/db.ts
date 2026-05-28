import Database, { type Database as DatabaseType } from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";

type Schema = typeof schema;
type Db = BetterSQLite3Database<Schema>;

let _sqlite: DatabaseType | null = null;
let _db: Db | null = null;

function open(): Db {
  if (_db) return _db;
  const dbPath = process.env.DATABASE_URL ?? "../shared/db/database.db";
  _sqlite = new Database(dbPath);
  _sqlite.pragma("journal_mode = WAL");
  _sqlite.pragma("foreign_keys = ON");
  _db = drizzle(_sqlite, { schema });
  return _db;
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const instance = open();
    const value = Reflect.get(instance as object, prop, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export default db;
