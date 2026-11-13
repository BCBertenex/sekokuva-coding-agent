import { setClineClientIdentity } from "@sekokuva-ca/shared";
import { getCliBuildInfo } from "./common";

export function registerClineClientIdentity(name: string): void {
	const { version } = getCliBuildInfo();
	setClineClientIdentity({
		name,
		version,
		platform: "cli",
		platformVersion: version,
	});
}
