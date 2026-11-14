#!/usr/bin/env node
/**
 * PR 3 follow-up: rename `CLINE_*` environment variables in `apps/*`.
 *
 * The SDK now reads `SEKOKUVA_CA_*` (see scripts/rename-identifiers.mjs). Env
 * vars are a cross-process contract, so every app that sets or reads one must
 * use the same spelling or the two halves silently stop talking to each other.
 *
 * Only the env-var rule is applied here. App-local type/class names keep their
 * current spelling until their own PR, so this stays reviewable.
 *
 * Usage:
 *   node scripts/rename-app-env-vars.mjs --dry
 *   node scripts/rename-app-env-vars.mjs
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { extname, join, relative } from "node:path"

const DRY = process.argv.includes("--dry")
const ROOT = process.cwd()

const SKIP_DIRS = new Set([
	"node_modules",
	"dist",
	"build",
	"out",
	".git",
	"coverage",
	".next",
	"target",
])

// Generated protobuf output is owned by PR 4.
const SKIP_PATH = /[\\/](generated|shared[\\/]proto|dist-standalone)[\\/]/

function walk(dir, out = []) {
	let entries
	try {
		entries = readdirSync(dir)
	} catch {
		return out
	}
	for (const entry of entries) {
		if (SKIP_DIRS.has(entry)) continue
		const full = join(dir, entry)
		let st
		try {
			st = statSync(full)
		} catch {
			continue
		}
		if (st.isDirectory()) walk(full, out)
		else if (
			st.isFile() &&
			[".ts", ".tsx", ".mts", ".mjs", ".js", ".json"].includes(extname(full)) &&
			!SKIP_PATH.test(full)
		)
			out.push(full)
	}
	return out
}

// `CLINE_` followed by an uppercase segment. The trailing `\b` keeps
// `CLINE_DATA_DIR` from matching inside a longer identifier.
const PATTERN = /\bCLINE_([A-Z][A-Z0-9_]*)\b/g

const files = walk(join(ROOT, "apps"))
const changed = []
let total = 0

for (const file of files) {
	const src = readFileSync(file, "utf8")
	if (!src.includes("CLINE_")) continue

	let count = 0
	const next = src.replace(PATTERN, (_match, rest) => {
		count++
		return `SEKOKUVA_CA_${rest}`
	})
	if (next === src) continue

	total += count
	changed.push({ file: relative(ROOT, file), count })
	if (!DRY) writeFileSync(file, next, "utf8")
}

changed.sort((a, b) => b.count - a.count)
console.log(`${DRY ? "[dry run] " : ""}files changed: ${changed.length}`)
console.log(`env vars rewritten: ${total}`)
console.log("")
for (const c of changed.slice(0, 40))
	console.log(`  ${c.count.toString().padStart(4)}  ${c.file}`)
if (changed.length > 40) console.log(`  ... and ${changed.length - 40} more`)