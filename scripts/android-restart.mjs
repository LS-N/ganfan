#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"

const adbBinary = resolveAdbBinary()
const args = new Set(process.argv.slice(2))
const dryRun = args.has("--dry-run")
const appId = getArgValue("--app-id") || "com.ganfan.app"
const reversePorts = [8081, 8000]

function resolveAdbBinary() {
  if (process.env.ADB_PATH) return process.env.ADB_PATH

  const localAppData = process.env.LOCALAPPDATA
  if (localAppData) {
    const sdkAdb = path.join(localAppData, "Android", "Sdk", "platform-tools", process.platform === "win32" ? "adb.exe" : "adb")
    if (existsSync(sdkAdb)) return sdkAdb
  }

  return "adb"
}

function getArgValue(name) {
  const prefix = `${name}=`
  for (const arg of args) {
    if (arg.startsWith(prefix)) return arg.slice(prefix.length)
  }
  return undefined
}

function runAdb(label, adbArgs) {
  console.log(`[android-restart] ${label}`)
  if (dryRun) {
    console.log(`[android-restart] dry-run: ${adbBinary} ${adbArgs.join(" ")}`)
    return
  }

  const result = spawnSync(adbBinary, adbArgs, { stdio: "inherit" })
  if (result.error) {
    throw new Error(`${label} failed: ${result.error.message}`)
  }
  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(`${label} exited with code ${result.status}`)
  }
}

try {
  for (const port of reversePorts) {
    runAdb(`reverse tcp:${port}`, ["reverse", `tcp:${port}`, `tcp:${port}`])
  }

  runAdb(`force-stop ${appId}`, ["shell", "am", "force-stop", appId])
  runAdb(`launch ${appId}`, ["shell", "monkey", "-p", appId, "-c", "android.intent.category.LAUNCHER", "1"])
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
