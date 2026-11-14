// ---------------------------------------------------------------------------
// Environment helpers for test setup.
//
// Usage:
//   test.use({ env: clineEnv("default") });
//   test.use({ env: clineEnv("claude-sonnet-4.6") });
//   test.use({ env: clineEnv("/absolute/path/to/config") });
// ---------------------------------------------------------------------------

import { cpSync, mkdirSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const TEST_SUITE_ROOT = new URL("../", import.meta.url).pathname;

let envCounter = 0;

function createIsolatedClineDir(sourceDir: string): string {
	const tempRoot = mkdtempSync(path.join(os.tmpdir(), "cline-tui-test-"));
	const targetDir = path.join(tempRoot, "cline");
	cpSync(sourceDir, targetDir, {
		recursive: true,
		errorOnExist: false,
		force: true,
	});
	mkdirSync(path.join(targetDir, "home"), { recursive: true });
	return targetDir;
}

function nextHubPort(): string {
	envCounter += 1;
	const basePort = 30_000 + (process.pid % 10_000);
	return String(basePort + (envCounter % 10_000));
}

/**
 * Build the process environment for a cline test.
 *
 * @param configDir - Named config under `configs/`, or an absolute path.
 * @param extra     - Additional env vars to merge in (override defaults).
 */
export function clineEnv(
	configDir: string,
	extra: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv {
	const clinePath = path.isAbsolute(configDir)
		? configDir
		: path.join(TEST_SUITE_ROOT, "configs", configDir);
	const isolatedClinePath = createIsolatedClineDir(clinePath);
	const dataDir = path.join(isolatedClinePath, "data");

	// Determine effective VCR mode: extra overrides > parent env > default "playback"
	const effectiveVcrMode =
		extra.SEKOKUVA_CA_VCR ?? process.env.SEKOKUVA_CA_VCR ?? "playback";

	// During recording, authenticated configs read real OAuth credentials from
	// ~/.cline/data/settings/providers.json while keeping all other settings
	// (model, provider, global state) from the mock config directory.
	const isRecording = effectiveVcrMode === "record";
	const isAuthenticated = configDir !== "unauthenticated";
	const realProvidersFile =
		isRecording && isAuthenticated
			? path.join(os.homedir(), ".cline", "data", "settings", "providers.json")
			: undefined;

	// Remove CI so terminal renderers treat the spawned process as interactive.
	// Remove VITEST so the spawned CLI binary doesn't skip initVcr().
	// cli/src/index.ts guards `initVcr` behind `process.env.VITEST !== "true"`,
	// so if the parent vitest process's VITEST=true leaks into the child, VCR
	// recording/playback is silently skipped.
	const { CI: _ci, VITEST: _vitest, ...cleanEnv } = process.env;
	if (!isAuthenticated) {
		delete cleanEnv.SEKOKUVA_CA_API_KEY;
	}

	// Only enable VCR when a cassette path is provided (via extra or parent env),
	// otherwise tests without cassettes would trigger a spurious
	// "[VCR] No SEKOKUVA_CA_VCR_CASSETTE" warning on every run.
	const hasCassette = !!(
		extra.SEKOKUVA_CA_VCR_CASSETTE ?? process.env.SEKOKUVA_CA_VCR_CASSETTE
	);
	const vcrDefaults = hasCassette
		? { SEKOKUVA_CA_VCR: "playback", SEKOKUVA_CA_VCR_FILTER: "" }
		: {};

	// the order of these env vars matter; later ones override earlier ones
	return {
		...vcrDefaults,
		...cleanEnv,
		...(realProvidersFile
			? { SEKOKUVA_CA_PROVIDER_SETTINGS_PATH: realProvidersFile }
			: {}),
		SEKOKUVA_CA_TELEMETRY_DISABLED: "1",
		HOME: path.join(isolatedClinePath, "home"),
		SEKOKUVA_CA_DIR: isolatedClinePath,
		SEKOKUVA_CA_DATA_DIR: dataDir,
		SEKOKUVA_CA_DB_DATA_DIR: path.join(dataDir, "db"),
		SEKOKUVA_CA_GLOBAL_SETTINGS_PATH: path.join(
			dataDir,
			"settings",
			"global-settings.json",
		),
		SEKOKUVA_CA_HOOKS_LOG_PATH: path.join(dataDir, "logs", "hooks.jsonl"),
		SEKOKUVA_CA_HUB_DISCOVERY_PATH: path.join(
			dataDir,
			"locks",
			"hub",
			"discovery.json",
		),
		SEKOKUVA_CA_HUB_PORT: nextHubPort(),
		SEKOKUVA_CA_MCP_SETTINGS_PATH: path.join(
			dataDir,
			"settings",
			"cline_mcp_settings.json",
		),
		...(realProvidersFile
			? {}
			: {
					SEKOKUVA_CA_PROVIDER_SETTINGS_PATH: path.join(
						dataDir,
						"settings",
						"providers.json",
					),
				}),
		SEKOKUVA_CA_SESSION_DATA_DIR: path.join(dataDir, "sessions"),
		SEKOKUVA_CA_TEAM_DATA_DIR: path.join(dataDir, "teams"),
		SEKOKUVA_CA_DISABLE_CLINE_PASS_NOTICE: "1",
		NO_UPDATE_NOTIFIER: "1",
		SEKOKUVA_CA_NO_AUTO_UPDATE: "1",
		...extra,
	};
}
