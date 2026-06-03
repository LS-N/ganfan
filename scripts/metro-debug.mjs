#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const adbBinary = resolveAdbBinary()
const args = new Set(process.argv.slice(2))
const dryRun = args.has("--dry-run")
const clear = args.has("--clear")

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

function appendNodeOption(currentValue, option) {
  const parts = (currentValue || "").split(/\s+/).filter(Boolean)
  if (!parts.includes(option)) parts.push(option)
  return parts.join(" ")
}

function reversePort(port) {
  console.log(`[metro-debug] reverse tcp:${port}`)
  const result = spawnSync(adbBinary, ["reverse", `tcp:${port}`, `tcp:${port}`], {
    stdio: "inherit"
  })

  if (result.error) {
    throw new Error(`adb reverse tcp:${port} failed: ${result.error.message}`)
  }

  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(`adb reverse tcp:${port} exited with code ${result.status}`)
  }
}

try {
  for (const port of reversePorts) {
    reversePort(port)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

const expoArgs = ["expo", "start", "--dev-client"]
if (clear) expoArgs.push("--clear")

if (dryRun) {
  console.log(`[metro-debug] dry-run: npx ${expoArgs.join(" ")}`)
  process.exit(0)
}

console.log("[metro-debug] starting Expo dev client")
const child = spawn("npx", expoArgs, {
  cwd: projectRoot,
  env: {
    ...process.env,
    NODE_OPTIONS: appendNodeOption(process.env.NODE_OPTIONS, "--dns-result-order=ipv4first")
  },
  stdio: "inherit",
  shell: true
})

child.on("error", (error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})

child.on("close", (code, signal) => {
  if (signal) {
    process.exit(1)
    return
  }
  process.exit(code ?? 0)
})
