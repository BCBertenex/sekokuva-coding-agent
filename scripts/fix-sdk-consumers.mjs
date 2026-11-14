#!/usr/bin/env node
/**
 * PR 3 follow-up: update `apps/*` consumers for the renamed SDK public API.
 *
 * The identifier codemod (scripts/rename-identifiers.mjs) only rewrote
 * `sdk/packages/*`. Every app that imports a renamed symbol from
 * `@sekokuva-ca/*` now fails to compile. This script rewrites only the
 * identifiers the SDK actually exports, so app-local names stay untouched
 * until their own PR.
 *
 * Usage:
 *   node scripts/fix-sdk-consumers.mjs --dry
 *   node scripts/fix-sdk-consumers.mjs
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { extname, join, relative } from "node:path"

const DRY = process.argv.includes("--dry")
const ROOT = process.cwd()
const SDK = join(ROOT, "sdk", "packages")
// Extra roots to rewrite, passed as `--root <path>` (relative to cwd).
const extraRoots = []
for (let i = 0; i < process.argv.length; i++) {
	if (process.argv[i] === "--root" && process.argv[i + 1])
		extraRoots.push(join(ROOT, process.argv[i + 1]))
}
const APPS = [join(ROOT, "apps"), ...extraRoots]

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

// Generated protobuf output is owned by PR 4 (`bun run protos` regenerates it),
// so rewriting it here would just be overwritten.
const SKIP_PATH = /[\\/](generated|shared[\\/]proto)[\\/]/

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
			[".ts", ".tsx", ".mts"].includes(extname(full)) &&
			!SKIP_PATH.test(full)
		)
			out.push(full)
	}
	return out
}

// Same rules as rename-identifiers.mjs, applied to a single token.
function renameToken(name) {
	if (/^CLINE_[A-Z0-9_]+$/.test(name)) return name.replace(/^CLINE_/, "SEKOKUVA_CA_")
	if (/^Cline[A-Z][A-Za-z0-9_]*$/.test(name)) return name.replace(/^Cline/, "SekoKuva")
	if (/^cline[A-Z][A-Za-z0-9_]*$/.test(name)) return name.replace(/^cline/, "sekokuvaCa")
	if (/^cline_[a-z0-9_]+$/.test(name)) return name.replace(/^cline_/, "sekokuva_ca_")
	return null
}

// Collect every identifier the SDK re-exports, then keep the ones our rules
// would have renamed. Those are exactly the names consumers must update.
const sdkFiles = walk(SDK)
const exported = new Set()
for (const file of sdkFiles) {
	const src = readFileSync(file, "utf8")
	for (const m of src.matchAll(
		/export\s+(?:type\s+)?(?:declare\s+)?(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g,
	)) {
		exported.add(m[1])
	}
	for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
		for (const part of m[1].split(",")) {
			const name = part.trim().split(/\s+as\s+/).pop()?.trim()
			if (name) exported.add(name)
		}
	}
}

// Map old name -> new name for every SDK export our rules renamed.
const renames = new Map()
for (const name of exported) {
	const next = renameToken(name)
	if (next && next !== name) renames.set(name, next)
}

// Also cover names that were renamed but are no longer exported under the old
// spelling: derive them from the current exports by reversing the rules.
for (const name of exported) {
	if (/^SEKOKUVA_CA_[A-Z0-9_]+$/.test(name))
		renames.set(name.replace(/^SEKOKUVA_CA_/, "CLINE_"), name)
	else if (/^SekoKuva[A-Z][A-Za-z0-9_]*$/.test(name))
		renames.set(name.replace(/^SekoKuva/, "Cline"), name)
	else if (/^sekokuvaCa[A-Z][A-Za-z0-9_]*$/.test(name))
		renames.set(name.replace(/^sekokuvaCa/, "cline"), name)
	else if (/^sekokuva_ca_[a-z0-9_]+$/.test(name))
		renames.set(name.replace(/^sekokuva_ca_/, "cline_"), name)
}

// Longest first so `ClineCoreStartInput` wins over `ClineCore`.
const ordered = [...renames.entries()].sort((a, b) => b[0].length - a[0].length)
const pattern = new RegExp(`\\b(${ordered.map(([k]) => k).join("|")})\\b`, "g")

const appFiles = APPS.flatMap((root) => walk(root))
const changed = []
let total = 0

for (const file of appFiles) {
	const src = readFileSync(file, "utf8")
	// Only touch files that actually import from the SDK.
	if (!src.includes("@sekokuva-ca/")) continue

	let count = 0
	const next = src.replace(pattern, (match) => {
		const replacement = renames.get(match)
		if (!replacement) return match
		count++
		return replacement
	})
	if (next === src) continue

	total += count
	changed.push({ file: relative(ROOT, file), count })
	if (!DRY) writeFileSync(file, next, "utf8")
}

changed.sort((a, b) => b.count - a.count)
console.log(`${DRY ? "[dry run] " : ""}files changed: ${changed.length}`)
console.log(`identifiers rewritten: ${total}`)
console.log("")
for (const c of changed) console.log(`  ${c.count.toString().padStart(4)}  ${c.file}`)