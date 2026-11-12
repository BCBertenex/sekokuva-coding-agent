/**
 * Single source of truth for SekoKuva Coding Agent branding.
 *
 * Every user-visible product name, URL, on-disk path, and brand color must be
 * read from here rather than hardcoded. This module is intentionally
 * dependency-free and browser-safe so it can be imported from the extension
 * host, the webview, the CLI, and the SDK alike.
 *
 * See `assets/branding/README.md` for the visual identity rules that accompany
 * these values.
 */

export const BRAND = {
	/** Full product name, used in titles, marketplace listings, and docs. */
	productName: "SekoKuva Coding Agent",
	/** Short product name, used where space is tight (activity bar, TUI header). */
	shortName: "SekoKuva CA",
	/** Machine-readable slug: package names, artifact names, URL segments. */
	slug: "sekokuva-ca",
	/** Legal entity that publishes the product. */
	company: "BC Bertenex Oy",

	/** VS Code Marketplace publisher ID. Permanent once published. */
	publisher: "sekokuva",
	/** VS Code extension identifier (`publisher.name`). */
	extensionId: "sekokuva.sekokuva-ca",

	/** Marketing site for the coding agent. */
	homepage: "https://ca.sekokuva.fi",
	/** Documentation site for the coding agent. */
	docsUrl: "https://ca.sekokuva.fi/docs",
	/** Production API base URL. */
	apiBaseUrl: "https://api.sekokuva.fi",
	/** MCP endpoint path, appended to the API base URL. */
	mcpPath: "/v1/mcp",

	/** CLI binary name. */
	cliName: "sekokuva-ca",
	/** Per-user configuration directory name, relative to the home directory. */
	configDirName: ".sekokuva-ca",
	/** Workspace rules directory name. */
	rulesDirName: ".sekokuva-ca-rules",
	/** Workspace ignore file name. */
	ignoreFileName: ".sekokuva-ca-ignore",
	/** MCP server settings file name. */
	mcpSettingsFileName: "sekokuva-ca_mcp_settings.json",
	/** Provider identifier used in stored configuration. */
	providerId: "sekokuva-ca",
	/** Prefix for environment variables. */
	envPrefix: "SEKOKUVA_CA_",

	/**
	 * Brand palette, sampled from the SekoKuva logo.
	 *
	 * `primary` is the logo orange and is the only accent color. `ink` is the
	 * logo navy and carries text and dark surfaces. `surface` is the logo's
	 * off-white background.
	 */
	colors: {
		primary: "#ea7131",
		primaryHover: "#ee7b34",
		ink: "#202e3b",
		inkMuted: "#2a3e4d",
		surface: "#f9f9f5",
	},
} as const

export type Brand = typeof BRAND