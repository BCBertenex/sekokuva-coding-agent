#!/usr/bin/env node
/**
 * PR 2: rename the internal npm scope `@sekokuva-ca/*` to `@sekokuva-ca/*`.
 *
 * Scope-only. Package basenames (e.g. `cline-hub`) and identifiers
 * (`ClineMessage`) are handled in later PRs.
 *
 * Two rules:
 *   1. `@sekokuva-ca/` -> `@sekokuva-ca/`  (unambiguous package specifier)
 *   2. `"@sekokuva-ca"` used as a path segment -> `"@sekokuva-ca"`
 *      (node_modules/@sekokuva-ca directory references in the plugin runtime)
 *
 * Chat handles (`@cline hi`, `<@cline>`) are intentionally left alone; they are
 * product copy, not package specifiers, and belong to a later PR.
 *
 * Usage:
 *   node scripts/rename-scope.mjs --dry
 *   node scripts/rename-scope.mjs
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { extname, join, relative } from "node:path"

const DRY = process.argv.includes("--dry")
const ROOT = process.cwd()

const SKIP_DIRS = new Set([
	"node_modules",
	"dist",
	"build",
	".git",
	".next",
	".turbo",
	"target",
	"coverage",
])

const TEXT_EXT = new Set([
	".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs",
	".json", ".md", ".mdx", ".css", ".yml", ".yaml", ".toml",
	".proto", ".rs", ".html", ".snap",
])

/** Files with no extension that are still text. */
const TEXT_BASENAMES = new Set(["cline", "sekokuva-ca", "LICENSE", "NOTICE"])

function isTextFile(path) {
	const ext = extname(path)
	if (ext) return TEXT_EXT.has(ext)
	return TEXT_BASENAMES.has(path.split(/[\\/]/).pop())
}

function walk(dir, out = []) {
	for (const entry of readdirSync(dir)) {
		if (SKIP_DIRS.has(entry)) continue
		const full = join(dir, entry)
		let st
		try {
			st = statSync(full)
		} catch {
			continue
		}
		if (st.isDirectory()) walk(full, out)
		else if (st.isFile() && isTextFile(full)) out.push(full)
	}
	return out
}

/**
 * Apply the rename rules to a string.
 */
function rewrite(text) {
	// Rule 1: package specifiers.
	let next = text.replaceAll("@sekokuva-ca/", "@sekokuva-ca/")

	// Rule 1b: regex-escaped specifiers, e.g. /^@sekokuva-ca\/core$/.
	next = next.replaceAll("@cline\\/", "@sekokuva-ca\\/")

	// Rule 2: `@sekokuva-ca` as a path segment. Quoted literals only, so chat
	// handles like `@cline hi` are untouched.
	next = next.replaceAll('"@sekokuva-ca"', '"@sekokuva-ca"')
	next = next.replaceAll("'@sekokuva-ca'", "'@sekokuva-ca'")
	next = next.replaceAll("`@sekokuva-ca`", "`@sekokuva-ca`")
	next = next.replaceAll("node_modules/@sekokuva-ca", "node_modules/@sekokuva-ca")

	return next
}

const files = walk(ROOT)
const changed = []
let totalReplacements = 0

for (const file of files) {
	let src
	try {
		src = readFileSync(file, "utf8")
	} catch {
		continue
	}
	if (!src.includes("@sekokuva-ca")) continue

	const next = rewrite(src)
	if (next === src) continue

	const before = (src.match(/@sekokuva-ca/g) ?? []).length
	const after = (next.match(/@sekokuva-ca/g) ?? []).length
	totalReplacements += before - after
	changed.push({ file: relative(ROOT, file), before, after })

	if (!DRY) writeFileSync(file, next, "utf8")
}

changed.sort((a, b) => b.before - a.before)

console.log(`${DRY ? "[dry run] " : ""}files changed: ${changed.length}`)
console.log(`occurrences rewritten: ${totalReplacements}`)
console.log("")

const remaining = changed.filter((c) => c.after > 0)
if (remaining.length) {
	console.log("Files still containing `@sekokuva-ca` after rewrite (expected: chat handles, prose):")
	for (const c of remaining.slice(0, 40)) {
		console.log(`  ${c.after.toString().padStart(3)}  ${c.file}`)
	}
	if (remaining.length > 40) console.log(`  ... and ${remaining.length - 40} more`)
	console.log("")
}

console.log("Top 25 files by occurrences rewritten:")
for (const c of changed.slice(0, 25)) {
	console.log(`  ${(c.before - c.after).toString().padStart(4)}  ${c.file}`)
}