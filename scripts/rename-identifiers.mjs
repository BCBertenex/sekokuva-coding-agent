#!/usr/bin/env node
/**
 * PR 3: rename Cline identifiers inside sdk/packages/*.
 *
 * Scope: SDK source only. User-facing strings, URLs, and proto field names are
 * handled in later PRs.
 *
 * Rules (applied in order, longest/most-specific first):
 *   1. CLINE_XXX            -> SEKOKUVA_CA_XXX      (env vars, constants)
 *   2. ClineXxx             -> SekoKuvaXxx          (types, classes, interfaces)
 *   3. clineXxx (camelCase) -> sekokuvaCaXxx        (variables, properties)
 *   4. cline_xxx (snake)    -> sekokuva_ca_xxx      (snake_case keys)
 *
 * Deliberately NOT renamed here:
 *   - `cline.bot` / `api.cline.bot` URLs        (PR 9)
 *   - `@cline/...` specifiers                   (PR 2, already done)
 *   - `.cline/` on-disk paths                   (PR 7)
 *   - `cline_mcp_settings`                      (PR 7)
 *   - prose in comments that names the product  (PR 11)
 *
 * Usage:
 *   node scripts/rename-identifiers.mjs --dry
 *   node scripts/rename-identifiers.mjs
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { extname, join, relative } from "node:path"

const DRY = process.argv.includes("--dry")
const ROOT = process.cwd()
const TARGET = join(ROOT, "sdk", "packages")

const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".git", "coverage"])

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
		else if (st.isFile() && [".ts", ".tsx", ".mts"].includes(extname(full))) out.push(full)
	}
	return out
}

/**
 * Strings that must survive untouched. Replaced with placeholders before the
 * rename and restored afterwards.
 */
const PROTECTED = [
	// URLs and domains
	/api\.cline\.bot/g,
	/app\.cline\.bot/g,
	/docs\.cline\.bot/g,
	/cline\.bot/g,
	/github\.com\/cline\/cline/g,
	// npm scope (already renamed in PR 2, but guard against regressions)
	/@sekokuva-ca\//g,
	// On-disk names owned by later PRs
	/\.clineignore/g,
	/\.clinerules/g,
	/cline_mcp_settings/g,
	/\.cline\//g,
	// Chat handles / emails in fixtures
	/@cline\.bot/g,
]

function protect(text) {
	const saved = []
	let out = text
	for (const pattern of PROTECTED) {
		out = out.replace(pattern, (match) => {
			const token = `\u0000P${saved.length}\u0000`
			saved.push(match)
			return token
		})
	}
	return { out, saved }
}

function restore(text, saved) {
	let out = text
	for (let i = 0; i < saved.length; i++) {
		out = out.split(`\u0000P${i}\u0000`).join(saved[i])
	}
	return out
}

function rewrite(text) {
	// 1. Env vars and SCREAMING_SNAKE constants.
	let out = text.replace(/\bCLINE_([A-Z0-9_]+)\b/g, "SEKOKUVA_CA_$1")

	// 2. PascalCase types/classes/interfaces.
	out = out.replace(/\bCline([A-Z][A-Za-z0-9_]*)\b/g, "SekoKuva$1")

	// 3. camelCase variables and properties.
	out = out.replace(/\bcline([A-Z][A-Za-z0-9_]*)\b/g, "sekokuvaCa$1")

	// 4. snake_case keys.
	out = out.replace(/\bcline_([a-z0-9_]+)\b/g, "sekokuva_ca_$1")

	return out
}

const files = walk(TARGET)
const changed = []
let total = 0

for (const file of files) {
	let src
	try {
		src = readFileSync(file, "utf8")
	} catch {
		continue
	}
	if (!/\b[Cc][Ll][Ii][Nn][Ee]/.test(src)) continue

	const { out: protectedText, saved } = protect(src)
	const renamed = rewrite(protectedText)
	const next = restore(renamed, saved)
	if (next === src) continue

	const before = (src.match(/\b[Cc]line/g) ?? []).length
	const after = (next.match(/\b[Cc]line/g) ?? []).length
	total += before - after
	changed.push({ file: relative(ROOT, file), before, after })

	if (!DRY) writeFileSync(file, next, "utf8")
}

changed.sort((a, b) => b.before - a.before)

console.log(`${DRY ? "[dry run] " : ""}files changed: ${changed.length}`)
console.log(`identifiers rewritten: ${total}`)
console.log("")

const remaining = changed.filter((c) => c.after > 0)
if (remaining.length) {
	console.log("Files still containing `cline` (expected: URLs, on-disk names, prose):")
	for (const c of remaining.slice(0, 30)) {
		console.log(`  ${c.after.toString().padStart(3)}  ${c.file}`)
	}
	if (remaining.length > 30) console.log(`  ... and ${remaining.length - 30} more`)
	console.log("")
}

console.log("Top 20 files by identifiers rewritten:")
for (const c of changed.slice(0, 20)) {
	console.log(`  ${(c.before - c.after).toString().padStart(4)}  ${c.file}`)
}

// ---------------------------------------------------------------------------
// File and directory renames
// ---------------------------------------------------------------------------

/**
 * Maps a path segment to its renamed form. Only the basename is touched;
 * parent directories are handled by walking bottom-up.
 */
function renameSegment(name) {
	return name
		.replace(/\bCline/g, "SekoKuva")
		.replace(/\bcline-/g, "sekokuva-ca-")
		.replace(/-cline-/g, "-sekokuva-ca-")
		.replace(/^cline-/, "sekokuva-ca-")
		.replace(/^cline\./, "sekokuva-ca.")
}

function collectPaths(dir, out = []) {
	for (const entry of readdirSync(dir)) {
		if (SKIP_DIRS.has(entry)) continue
		const full = join(dir, entry)
		let st
		try {
			st = statSync(full)
		} catch {
			continue
		}
		if (st.isDirectory()) {
			collectPaths(full, out)
			out.push({ path: full, isDir: true })
		} else {
			out.push({ path: full, isDir: false })
		}
	}
	return out
}

const paths = collectPaths(TARGET)
const renames = []
for (const { path, isDir } of paths) {
	const base = path.split(/[\\/]/).pop()
	const renamed = renameSegment(base)
	if (renamed !== base) {
		renames.push({ from: path, to: join(path.slice(0, -base.length), renamed), isDir })
	}
}

if (renames.length) {
	console.log("")
	console.log(`${DRY ? "[dry run] " : ""}path renames: ${renames.length}`)
	for (const r of renames) {
		console.log(`  ${relative(ROOT, r.from)}`)
		console.log(`    -> ${relative(ROOT, r.to)}`)
	}
	if (!DRY) {
		const { renameSync } = await import("node:fs")
		// Deepest first so parent renames don't invalidate child paths.
		renames.sort((a, b) => b.from.length - a.from.length)
		for (const r of renames) {
			try {
				renameSync(r.from, r.to)
			} catch (error) {
				console.error(`  FAILED ${relative(ROOT, r.from)}: ${error.message}`)
			}
		}
	}
}