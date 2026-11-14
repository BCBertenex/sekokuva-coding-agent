import { spawnSync } from "node:child_process";
import {
	chmodSync,
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceWrapperPath = fileURLToPath(
	new URL("../../bin/cline", import.meta.url),
);

function createWrapperCopy(): string {
	const dir = mkdtempSync(join(tmpdir(), "cline-bin-package-"));
	const binDir = join(dir, "bin");
	mkdirSync(binDir, { recursive: true });
	// The published wrapper package has no `"type": "module"`, so `bin/cline`
	// is CommonJS there. A temp dir under the repo would otherwise inherit
	// `apps/cli/package.json` ("type": "module") and Node would parse the
	// wrapper as ESM, which it is not.
	writeFileSync(join(dir, "package.json"), '{ "name": "wrapper-fixture" }\n');
	const wrapperPath = join(binDir, "cline");
	copyFileSync(sourceWrapperPath, wrapperPath);
	chmodSync(wrapperPath, 0o755);
	return wrapperPath;
}

function createExecutableScript(contents: string): string {
	const dir = mkdtempSync(join(tmpdir(), "cline-bin-wrapper-"));
	// The wrapper spawns the target directly, so the target must be something
	// the OS can execute. On Windows a shebang script is not executable, so
	// emit a `.cmd` shim that forwards to the current Node binary instead.
	if (process.platform === "win32") {
		const scriptPath = join(dir, "child.js");
		writeFileSync(scriptPath, contents);
		const shimPath = join(dir, "child.cmd");
		writeFileSync(
			shimPath,
			`@echo off\r\n"${process.execPath}" "${scriptPath}" %*\r\n`,
		);
		return shimPath;
	}
	const scriptPath = join(dir, "child.js");
	writeFileSync(scriptPath, `#!/usr/bin/env node\n${contents}`);
	chmodSync(scriptPath, 0o755);
	return scriptPath;
}

function runWrapper(target: string, args: string[] = []) {
	const wrapperPath = createWrapperCopy();
	return spawnSync(process.execPath, [wrapperPath, ...args], {
		env: {
			...process.env,
			SEKOKUVA_CA_BIN_PATH: target,
		},
		encoding: "utf8",
	});
}

describe("bin/cline wrapper", () => {
	it("preserves the child process exit status", () => {
		const target = createExecutableScript(`
process.exit(Number(process.argv[2] ?? "0"));
`);

		const result = runWrapper(target, ["7"]);

		expect(result.error).toBeUndefined();
		expect(result.status).toBe(7);
		expect(result.signal).toBeNull();
	});

	it("passes the wrapper path to the compiled binary", () => {
		const target = createExecutableScript(`
console.log(process.env.SEKOKUVA_CA_WRAPPER_PATH ?? "");
`);

		const result = runWrapper(target);

		expect(result.error).toBeUndefined();
		expect(result.status).toBe(0);
		expect(result.stdout.trim()).toMatch(/bin[/\\]cline$/);
	});

	it.skipIf(process.platform === "win32")(
		"propagates child process signal termination on POSIX",
		() => {
			const target = createExecutableScript(`
process.kill(process.pid, "SIGTERM");
setTimeout(() => {}, 1000);
`);

			const result = runWrapper(target);

			expect(result.error).toBeUndefined();
			expect(result.status).toBeNull();
			expect(result.signal).toBe("SIGTERM");
		},
	);
});
