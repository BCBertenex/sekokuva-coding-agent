import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	SEKOKUVA_CA_ENVIRONMENT_ENV,
	SEKOKUVA_CA_ENVIRONMENT_OVERRIDE_ENV,
	SEKOKUVA_CA_ENVIRONMENTS,
	DEFAULT_CLINE_ENVIRONMENT,
	getClineEnvironmentConfig,
	resolveClineAppUrl,
	resolveClineEnvironment,
} from "./sekokuva-ca-environment";

const ENV_KEYS = [
	SEKOKUVA_CA_ENVIRONMENT_ENV,
	SEKOKUVA_CA_ENVIRONMENT_OVERRIDE_ENV,
	"SEKOKUVA_CA_API_BASE_URL",
] as const;

const originalEnvValues = Object.fromEntries(
	ENV_KEYS.map((key) => [key, process.env[key]]),
);

beforeEach(() => {
	vi.unstubAllGlobals();
	for (const key of ENV_KEYS) {
		delete process.env[key];
	}
});

afterEach(() => {
	vi.unstubAllGlobals();
	for (const key of ENV_KEYS) {
		const value = originalEnvValues[key];
		if (typeof value === "string") {
			process.env[key] = value;
		} else {
			delete process.env[key];
		}
	}
});

describe("resolveClineEnvironment", () => {
	it("defaults to production when no env var is set", () => {
		expect(resolveClineEnvironment()).toBe(DEFAULT_CLINE_ENVIRONMENT);
	});

	it("reads SEKOKUVA_CA_ENVIRONMENT from process.env", () => {
		process.env[SEKOKUVA_CA_ENVIRONMENT_ENV] = "staging";
		expect(resolveClineEnvironment()).toBe("staging");

		process.env[SEKOKUVA_CA_ENVIRONMENT_ENV] = "local";
		expect(resolveClineEnvironment()).toBe("local");
	});

	it("prefers SEKOKUVA_CA_ENVIRONMENT_OVERRIDE over SEKOKUVA_CA_ENVIRONMENT", () => {
		process.env[SEKOKUVA_CA_ENVIRONMENT_OVERRIDE_ENV] = "local";
		process.env[SEKOKUVA_CA_ENVIRONMENT_ENV] = "staging";

		expect(resolveClineEnvironment()).toBe("local");
	});

	it("normalizes case and surrounding whitespace", () => {
		process.env[SEKOKUVA_CA_ENVIRONMENT_ENV] = "  STAGING  ";

		expect(resolveClineEnvironment()).toBe("staging");
	});

	it("ignores unknown values and falls through to the next source", () => {
		process.env[SEKOKUVA_CA_ENVIRONMENT_OVERRIDE_ENV] = "qa";
		process.env[SEKOKUVA_CA_ENVIRONMENT_ENV] = "staging";
		expect(resolveClineEnvironment()).toBe("staging");

		delete process.env[SEKOKUVA_CA_ENVIRONMENT_OVERRIDE_ENV];
		process.env[SEKOKUVA_CA_ENVIRONMENT_ENV] = "qa";
		expect(resolveClineEnvironment()).toBe(DEFAULT_CLINE_ENVIRONMENT);
	});

	it("defaults to production when process is unavailable", () => {
		vi.stubGlobal("process", undefined);

		expect(resolveClineEnvironment()).toBe(DEFAULT_CLINE_ENVIRONMENT);
	});
});

describe("getClineEnvironmentConfig", () => {
	it("returns the config for an explicit environment", () => {
		expect(getClineEnvironmentConfig("staging")).toBe(
			SEKOKUVA_CA_ENVIRONMENTS.staging,
		);
		expect(getClineEnvironmentConfig("local")).toBe(SEKOKUVA_CA_ENVIRONMENTS.local);
		expect(getClineEnvironmentConfig("production")).toBe(
			SEKOKUVA_CA_ENVIRONMENTS.production,
		);
	});

	it("falls back to production by default", () => {
		expect(getClineEnvironmentConfig()).toBe(SEKOKUVA_CA_ENVIRONMENTS.production);
	});

	it("uses the resolved process.env environment when no explicit environment is provided", () => {
		process.env[SEKOKUVA_CA_ENVIRONMENT_ENV] = "staging";

		expect(getClineEnvironmentConfig()).toBe(SEKOKUVA_CA_ENVIRONMENTS.staging);
	});

	it("applies SEKOKUVA_CA_API_BASE_URL without mutating the catalog config", () => {
		process.env.SEKOKUVA_CA_API_BASE_URL = "http://127.0.0.1:3000";

		expect(getClineEnvironmentConfig("local")).toEqual({
			...SEKOKUVA_CA_ENVIRONMENTS.local,
			apiBaseUrl: "http://127.0.0.1:3000",
			mcpBaseUrl: "http://127.0.0.1:3000/v1/mcp",
		});
		expect(SEKOKUVA_CA_ENVIRONMENTS.local.apiBaseUrl).toBe("http://localhost:7777");
	});

	it("defaults to production when process is unavailable", () => {
		vi.stubGlobal("process", undefined);

		expect(getClineEnvironmentConfig()).toBe(SEKOKUVA_CA_ENVIRONMENTS.production);
	});
});

describe("resolveClineAppUrl", () => {
	const app = "https://app.cline.bot";

	it("resolves a path and its query string on the app", () => {
		expect(resolveClineAppUrl("/dashboard/account?tab=privacy", app)).toBe(
			"https://app.cline.bot/dashboard/account?tab=privacy",
		);
	});

	it("returns undefined for a missing path or app URL", () => {
		expect(resolveClineAppUrl(undefined, app)).toBeUndefined();
		expect(resolveClineAppUrl("", app)).toBeUndefined();
		expect(resolveClineAppUrl("/dashboard", undefined)).toBeUndefined();
		expect(resolveClineAppUrl("/dashboard", "not a url")).toBeUndefined();
	});

	it.each([
		"https://evil.example/dashboard",
		"//evil.example/dashboard",
		"javascript:alert(1)",
		"http://app.cline.bot/dashboard",
	])("rejects %s, which leaves the app's origin", (path) => {
		expect(resolveClineAppUrl(path, app)).toBeUndefined();
	});
});

describe("SEKOKUVA_CA_ENVIRONMENTS catalog", () => {
	it("exposes an environment field that matches its key", () => {
		for (const [key, config] of Object.entries(SEKOKUVA_CA_ENVIRONMENTS)) {
			expect(config.environment).toBe(key);
		}
	});

	it("populates appBaseUrl, apiBaseUrl, and mcpBaseUrl for every environment", () => {
		for (const config of Object.values(SEKOKUVA_CA_ENVIRONMENTS)) {
			expect(config.appBaseUrl).toMatch(/^https?:\/\//);
			expect(config.apiBaseUrl).toMatch(/^https?:\/\//);
			expect(config.mcpBaseUrl).toMatch(/^https?:\/\//);
		}
	});
});
