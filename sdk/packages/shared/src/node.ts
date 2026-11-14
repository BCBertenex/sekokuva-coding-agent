import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { stripUtf8Bom } from "./parse/string";

type ReadFileSyncPath = Parameters<typeof readFileSync>[0];
type ReadFilePath = Parameters<typeof readFile>[0];

/** Read a UTF-8 text file and remove its optional leading byte order mark. */
export function readFileSyncStrippingUtf8Bom(path: ReadFileSyncPath): string {
	return stripUtf8Bom(readFileSync(path, "utf8"));
}

/** Read a UTF-8 text file and remove its optional leading byte order mark. */
export async function readFileStrippingUtf8Bom(
	path: ReadFilePath,
): Promise<string> {
	return stripUtf8Bom(await readFile(path, "utf8"));
}

/**
 * Options for spawning a child process that may be a Windows shim.
 *
 * On Windows, `spawn` cannot execute a `.cmd`/`.bat` shim (npm, npx, yarn,
 * pnpm, uvx) directly — it fails with `EINVAL`. Those need `shell: true`.
 *
 * But `shell: true` routes the command through `cmd.exe`, which re-parses the
 * command line and splits on spaces. A real executable at
 * `C:\Program Files\nodejs\node.exe` then fails with
 * `'C:\Program' is not recognized`. So the shell must be used *only* when the
 * command actually needs it.
 *
 * Returns the spawn options plus the command to pass, which is quoted when the
 * shell will re-parse a path containing spaces.
 */
export function resolveWindowsSpawnOptions(command: string): {
	command: string;
	options: { windowsHide: boolean; shell?: boolean };
} {
	if (process.platform !== "win32") {
		return { command, options: { windowsHide: false } };
	}

	const extension = extname(command).toLowerCase();
	const isShim = extension === ".cmd" || extension === ".bat";
	// A bare name (`npx`, `node`) is resolved by the shell's PATH lookup; an
	// absolute path that exists is a real executable and must not go through
	// the shell.
	const needsShell = isShim || !existsSync(command);
	if (!needsShell) {
		return { command, options: { windowsHide: true } };
	}

	const quoted =
		/\s/.test(command) && !command.startsWith('"') ? `"${command}"` : command;
	return { command: quoted, options: { windowsHide: true, shell: true } };
}
