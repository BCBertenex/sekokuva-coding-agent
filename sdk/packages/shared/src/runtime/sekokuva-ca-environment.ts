export const SEKOKUVA_CA_ENVIRONMENT_ENV = "SEKOKUVA_CA_ENVIRONMENT";
export const SEKOKUVA_CA_ENVIRONMENT_OVERRIDE_ENV = "SEKOKUVA_CA_ENVIRONMENT_OVERRIDE";

export type SekoKuvaEnvironment = "production" | "staging" | "local";

export interface SekoKuvaEnvironmentConfig {
	readonly environment: SekoKuvaEnvironment;
	readonly appBaseUrl: string;
	readonly apiBaseUrl: string;
	readonly mcpBaseUrl: string;
	readonly workOsClientId: string;
}

export const SEKOKUVA_CA_ENVIRONMENTS: Readonly<
	Record<SekoKuvaEnvironment, SekoKuvaEnvironmentConfig>
> = {
	production: {
		environment: "production",
		appBaseUrl: "https://app.cline.bot",
		apiBaseUrl: "https://api.cline.bot",
		mcpBaseUrl: "https://api.cline.bot/v1/mcp",
		workOsClientId: "client_01K3A541FN8TA3EPPHTD2325AR",
	},
	staging: {
		environment: "staging",
		appBaseUrl: "https://staging-app.cline.bot",
		apiBaseUrl: "https://core-api.staging.int.cline.bot",
		mcpBaseUrl: "https://core-api.staging.int.cline.bot/v1/mcp",
		workOsClientId: "client_01K3A5415VF6QBQBG3XYCW91G6",
	},
	local: {
		environment: "local",
		appBaseUrl: "http://localhost:3000",
		apiBaseUrl: "http://localhost:7777",
		mcpBaseUrl: "http://localhost:7777/v1/mcp",
		workOsClientId: "client_01K6XQAY7JK6T5HXVSZW2S5VYK",
	},
};

export const DEFAULT_CLINE_ENVIRONMENT: SekoKuvaEnvironment = "production";

export interface ResolveClineEnvironmentOptions {
	env?: Partial<NodeJS.ProcessEnv>;
}

function normalizeClineEnvironment(
	value: string | undefined,
): SekoKuvaEnvironment | undefined {
	const normalized = value?.trim().toLowerCase();
	if (
		normalized === "production" ||
		normalized === "staging" ||
		normalized === "local"
	) {
		return normalized;
	}
	return undefined;
}

function readProcessEnv(): NodeJS.ProcessEnv {
	// `process` may be absent in browser-style runtimes (this module ships
	// from the browser entry of `@sekokuva-ca/shared`). Treat its absence as "no
	// env vars set" so callers always get a deterministic default.
	if (typeof process === "undefined" || !process?.env) {
		return {};
	}
	return process.env;
}

export function resolveClineEnvironment(): SekoKuvaEnvironment {
	const env = readProcessEnv();
	return (
		normalizeClineEnvironment(env[SEKOKUVA_CA_ENVIRONMENT_OVERRIDE_ENV]) ??
		normalizeClineEnvironment(env[SEKOKUVA_CA_ENVIRONMENT_ENV]) ??
		DEFAULT_CLINE_ENVIRONMENT
	);
}

function getEnvConfig(env?: SekoKuvaEnvironment) {
	if (typeof env === "string") {
		return SEKOKUVA_CA_ENVIRONMENTS[env];
	}
	return SEKOKUVA_CA_ENVIRONMENTS[resolveClineEnvironment()];
}

function applyConfigOverrides(
	config: SekoKuvaEnvironmentConfig,
	env: NodeJS.ProcessEnv,
): SekoKuvaEnvironmentConfig {
	if (env.SEKOKUVA_CA_API_BASE_URL) {
		config = {
			...config,
			apiBaseUrl: env.SEKOKUVA_CA_API_BASE_URL,
			mcpBaseUrl: `${env.SEKOKUVA_CA_API_BASE_URL}/v1/mcp`,
		};
	}

	return config;
}

export function getClineEnvironmentConfig(
	env?: SekoKuvaEnvironment,
): SekoKuvaEnvironmentConfig {
	const config = getEnvConfig(env);

	return applyConfigOverrides(config, readProcessEnv());
}

/**
 * Resolves a web app path, such as a server-provided
 * `SekoKuvaAccountUser.dataPrivacyPath`, against the Cline web app. Returns
 * undefined when either input is missing or the result would leave the app's
 * origin, so a bad path never becomes a link to somewhere else.
 */
export function resolveClineAppUrl(
	path: string | undefined,
	appBaseUrl: string | undefined,
): string | undefined {
	if (!path || !appBaseUrl) {
		return undefined;
	}
	try {
		const url = new URL(path, appBaseUrl);
		return url.origin === new URL(appBaseUrl).origin ? url.href : undefined;
	} catch {
		return undefined;
	}
}
