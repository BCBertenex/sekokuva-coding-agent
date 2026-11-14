import type { AgentPlugin } from "@sekokuva-ca/sdk";
import { SEKOKUVA_CA_DEFAULT_MODEL_ID } from "@sekokuva-ca/shared/browser";

export default {
	name: "packaged-backend-smoke",
	manifest: { capabilities: ["commands"] },
	setup(api) {
		if (typeof SEKOKUVA_CA_DEFAULT_MODEL_ID !== "string")
			throw new Error("Missing SDK browser exports");
		api.registerCommand({ name: "packaged-ping", handler: () => "pong" });
	},
} satisfies AgentPlugin;
