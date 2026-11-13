import {
	type BuiltinToolAvailabilityContext,
	getCoreBuiltinToolCatalog,
	resolveDisabledToolNames,
	resolveModelToolSettings,
	type ToolCatalogEntry,
} from "@sekokuva-ca/core";

export type { ToolCatalogEntry } from "@sekokuva-ca/core";

export function getToolCatalog(
	availabilityContext?: BuiltinToolAvailabilityContext,
): ToolCatalogEntry[] {
	const modelToolSettings = resolveModelToolSettings();
	return getCoreBuiltinToolCatalog({
		clientType: "cli",
		disabledToolIds: resolveDisabledToolNames(),
		enabledModelToolIds: new Set(
			Object.entries(modelToolSettings)
				.filter(([, setting]) => setting?.enabled === true)
				.map(([name]) => name),
		),
		...availabilityContext,
	});
}
