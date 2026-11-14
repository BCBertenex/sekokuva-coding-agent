import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	buildKanbanSpawnOptions,
	forwardSignalToKanbanProcess,
	isCommandAvailable,
	launchKanban,
	resolveKanbanInstallCommand,
	shouldDetachKanbanProcess,
} from "./kanban";

const tempDirs: string[] = [];
const originalPath = process.env.PATH;

function createTempDir(): string {
	const dir = mkdtempSync(join(tmpdir(), "cline-kanban-test-"));
	tempDirs.push(dir);
	return dir;
}

function writeExecutable(
	dir: string,
	name: string,
	platform: NodeJS.Platform = process.platform,
): void {
	writeExecutableScript(dir, name, "#!/bin/sh\necho ok\n", platform);
}

/**
 * Writes a runnable stub onto a fake PATH.
 *
 * On Windows the product resolves `kanban.cmd` (see `resolveKanbanBinary`), and
 * a POSIX `sh` script is not executable there, so the stub is emitted as a
 * `.cmd` that exits with the requested status. Tests that pass an explicit
 * `platform` to the resolver must build the stub for that same platform.
 */
function writeExecutableScript(
	dir: string,
	name: string,
	content: string,
	platform: NodeJS.Platform = process.platform,
): void {
	if (platform === "win32") {
		const exitCode = /exit\s+(\d+)/.exec(content)?.[1] ?? "0";
		const filePath = join(dir, `${name}.cmd`);
		writeFileSync(filePath, `@echo off\r\nexit /b ${exitCode}\r\n`, "utf8");
		return;
	}
	const filePath = join(dir, name);
	writeFileSync(filePath, content, "utf8");
	chmodSync(filePath, 0o755);
}

describe("kanban command helpers", () => {
	afterEach(() => {
		if (originalPath === undefined) {
			delete process.env.PATH;
		} else {
			process.env.PATH = originalPath;
		}
		for (const dir of tempDirs.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("detects commands in PATH", () => {
		const dir = createTempDir();
		writeExecutable(dir, "kanban", "linux");

		expect(isCommandAvailable("kanban", { PATH: dir }, "linux")).toBe(true);
		expect(isCommandAvailable("missing", { PATH: dir }, "linux")).toBe(false);
	});

	it("detaches kanban into a process group on unix-like platforms", () => {
		expect(shouldDetachKanbanProcess("darwin")).toBe(true);
		expect(shouldDetachKanbanProcess("linux")).toBe(true);
		expect(buildKanbanSpawnOptions({}, "darwin")).toMatchObject({
			stdio: "inherit",
			detached: true,
		});
	});

	it("keeps kanban attached on windows", () => {
		expect(shouldDetachKanbanProcess("win32")).toBe(false);
		expect(buildKanbanSpawnOptions({}, "win32")).toMatchObject({
			stdio: "inherit",
			detached: false,
			shell: true,
		});
	});

	it("prefers npm for kanban installs", () => {
		const dir = createTempDir();
		writeExecutable(dir, "npm", "linux");
		writeExecutable(dir, "pnpm", "linux");
		writeExecutable(dir, "bun", "linux");

		expect(resolveKanbanInstallCommand({ PATH: dir }, "linux")).toEqual({
			packageManager: "npm",
			command: "npm",
			args: ["install", "-g", "kanban@latest"],
			displayCommand: "npm install -g kanban@latest",
		});
	});

	it("uses the preferred package manager when available", () => {
		const dir = createTempDir();
		writeExecutable(dir, "npm", "linux");
		writeExecutable(dir, "pnpm", "linux");
		writeExecutable(dir, "bun", "linux");

		expect(resolveKanbanInstallCommand({ PATH: dir }, "linux", "pnpm")).toEqual(
			{
				packageManager: "pnpm",
				command: "pnpm",
				args: ["add", "-g", "kanban@latest"],
				displayCommand: "pnpm add -g kanban@latest",
			},
		);
		expect(resolveKanbanInstallCommand({ PATH: dir }, "linux", "bun")).toEqual({
			packageManager: "bun",
			command: "bun",
			args: ["add", "-g", "kanban@latest"],
			displayCommand: "bun add -g kanban@latest",
		});
	});

	it("falls back when the preferred package manager is unavailable", () => {
		const dir = createTempDir();
		writeExecutable(dir, "npm", "linux");

		expect(resolveKanbanInstallCommand({ PATH: dir }, "linux", "pnpm")).toEqual(
			{
				packageManager: "npm",
				command: "npm",
				args: ["install", "-g", "kanban@latest"],
				displayCommand: "npm install -g kanban@latest",
			},
		);
	});

	it("falls back to pnpm and bun for kanban installs", () => {
		const pnpmDir = createTempDir();
		writeExecutable(pnpmDir, "pnpm", "linux");
		expect(
			resolveKanbanInstallCommand({ PATH: pnpmDir }, "linux")?.displayCommand,
		).toBe("pnpm add -g kanban@latest");

		const bunDir = createTempDir();
		writeExecutable(bunDir, "bun", "linux");
		expect(
			resolveKanbanInstallCommand({ PATH: bunDir }, "linux")?.displayCommand,
		).toBe("bun add -g kanban@latest");
	});

	it("fails when kanban is missing and no installer is available", async () => {
		process.env.PATH = "";

		await expect(launchKanban()).resolves.toBe(1);
	});

	it("returns the kanban process exit code", async () => {
		const dir = createTempDir();
		writeExecutableScript(dir, "kanban", "#!/bin/sh\nexit 7\n");
		process.env.PATH = dir;

		await expect(launchKanban()).resolves.toBe(7);
	});

	it("installs kanban before launch when missing", async () => {
		const dir = createTempDir();
			if (process.platform === "win32") {
				// The stub "installer" must create the file the product looks for on
				// this platform: `kanban.cmd`. The `exit /b 6` line is written with
				// `>>` escaped so cmd does not treat `6>>` as a redirect.
				const kanbanCmd = join(dir, "kanban.cmd");
				writeFileSync(
					join(dir, "npm.cmd"),
					[
						"@echo off",
						`> "${kanbanCmd}" echo @echo off`,
						`>> "${kanbanCmd}" echo exit /b 6`,
						"exit /b 0",
						"",
					].join("\r\n"),
					"utf8",
				);
			} else {
				writeExecutableScript(
					dir,
					"npm",
					`#!/bin/sh
/bin/cat > "${dir}/kanban" <<'EOF'
#!/bin/sh
exit 6
EOF
/bin/chmod +x "${dir}/kanban"
exit 0
`,
				);
			}
		process.env.PATH = dir;

		const stdoutWrite = vi
			.spyOn(process.stdout, "write")
			.mockImplementation(() => true);
		try {
			await expect(launchKanban()).resolves.toBe(6);
		} finally {
			stdoutWrite.mockRestore();
		}
	});

	it("signals the detached kanban process group on unix-like platforms", () => {
		const killProcess = vi.fn();
		const child = {
			pid: 4321,
			kill: vi.fn(),
		};

		forwardSignalToKanbanProcess({
			child,
			signal: "SIGINT",
			platform: "darwin",
			killProcess,
		});

		expect(killProcess).toHaveBeenCalledWith(-4321, "SIGINT");
		expect(child.kill).not.toHaveBeenCalled();
	});

	it("signals the child process directly on windows", () => {
		const killProcess = vi.fn();
		const child = {
			pid: 4321,
			kill: vi.fn(),
		};

		forwardSignalToKanbanProcess({
			child,
			signal: "SIGTERM",
			platform: "win32",
			killProcess,
		});

		expect(killProcess).not.toHaveBeenCalled();
		expect(child.kill).toHaveBeenCalledWith("SIGTERM");
	});
});
