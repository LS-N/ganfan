import type { SQLiteDatabase } from "expo-sqlite"
import { sqliteSchemaStatements, sqliteSchemaVersion } from "./schema"

let dbPromise: Promise<SQLiteDatabase> | undefined

export async function getDatabase() {
  if (!dbPromise) {
    dbPromise = import("expo-sqlite").then(({ openDatabaseAsync }) => openDatabaseAsync("ganfan_phase1.db")).then(async (db) => {
      await db.execAsync("PRAGMA foreign_keys = ON")
      await migrate(db)
      return db
    })
  }
  return dbPromise
}

export async function resetDatabaseForTests() {
  dbPromise = undefined
}

async function migrate(db: SQLiteDatabase) {
  await db.execAsync(sqliteSchemaStatements.join(";\n"))
  await db.runAsync("INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, ?)", sqliteSchemaVersion, new Date().toISOString())
}

export function encodeJson(value: unknown) {
  return JSON.stringify(value ?? null)
}

export function decodeJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}
