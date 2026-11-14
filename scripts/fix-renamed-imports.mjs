#!/usr/bin/env node
/**
 * PR 3, step 2: rewrite import specifiers that point at renamed files.
 *
 * The identifier codemod renames files but cannot know which import strings
 * refer to them, so this pass fixes module specifiers only.
 *
 * Usage:
 *   node scripts/fix-renamed-imports.mjs --dry
 *   node scripts/fix-renamed-imports.mjs
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
 * Module-specifier rewrites. Each entry is [pattern, replacement] applied to
 * the quoted specifier only, so prose and identifiers are untouched.
 */
const SPECIFIER_RULES = [
	// Directory: cline-core -> sekokuva-ca-core
	[/\/cline-core\//g, "/sekokuva-ca-core/"],
	[/^\.\/cline-core\//g, "./sekokuva-ca-core/"],
	[/^\.\.\/cline-core\//g, "../sekokuva-ca-core/"],
	// Files
	[/\/cline-account-service"/g, "/sekokuva-ca-account-service\""],
	[/\/cline-account-feature-flags"/g, "/sekokuva-ca-account-feature-flags\""],
	[/\/cline-recommended-models"/g, "/sekokuva-ca-recommended-models\""],
	[/\/cline-recommended\.generated"/g, "/sekokuva-ca-recommended.generated\""],
	[/\/catalog-cline-recommended"/g, "/catalog-sekokuva-ca-recommended\""],
	[/\/cline-client-headers"/g, "/sekokuva-ca-client-headers\""],
	[/\/cline-environment"/g, "/sekokuva-ca-environment\""],
	[/\/cline-client-identity"/g, "/sekokuva-ca-client-identity\""],
	[/\/ClineCore"/g, "/SekoKuvaCore\""],
	// Bare relative file imports (./cline, ../cline)
	[/from "\.\/cline"/g, 'from "./sekokuva-ca"'],
	[/from "\.\.\/cline"/g, 'from "../sekokuva-ca"'],
	[/from "\.\/cline\.test"/g, 'from "./sekokuva-ca.test"'],
	// prompt/cline
	[/\/prompt\/cline"/g, "/prompt/sekokuva-ca\""],
]

const files = walk(TARGET)
const changed = []

for (const file of files) {
	let src
	try {
		src = readFileSync(file, "utf8")
	} catch {
		continue
	}
	let next = src
	for (const [pattern, replacement] of SPECIFIER_RULES) {
		next = next.replace(pattern, replacement)
	}
	if (next === src) continue
	changed.push(relative(ROOT, file))
	if (!DRY) writeFileSync(file, next, "utf8")
}

console.log(`${DRY ? "[dry run] " : ""}import specifiers fixed in ${changed.length} files`)
for (const f of changed.slice(0, 40)) console.log(`  ${f}`)
if (changed.length > 40) console.log(`  ... and ${changed.length - 40} more`)