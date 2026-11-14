export interface SekoKuvaClientIdentity {
	name?: string;
	version?: string;
	platform?: string;
	platformVersion?: string;
}

interface SekoKuvaClientIdentityGlobal {
	__clineClientIdentity?: SekoKuvaClientIdentity;
}

function identityHolder(): SekoKuvaClientIdentityGlobal {
	return globalThis as SekoKuvaClientIdentityGlobal;
}

export function setClineClientIdentity(
	identity: SekoKuvaClientIdentity | undefined,
): void {
	identityHolder().__clineClientIdentity = identity;
}

export function getClineClientIdentity(): SekoKuvaClientIdentity | undefined {
	return identityHolder().__clineClientIdentity;
}
