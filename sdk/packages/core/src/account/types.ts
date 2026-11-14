export interface SekoKuvaAccountOrganization {
	active: boolean;
	memberId: string;
	name: string;
	organizationId: string;
	roles: Array<"admin" | "member" | "owner">;
}

export interface SekoKuvaAccountUser {
	id: string;
	email: string;
	displayName: string;
	photoUrl: string;
	createdAt: string;
	updatedAt: string;
	organizations: SekoKuvaAccountOrganization[];
	/** Web app path where the user manages data use and Cline Bench preferences. */
	dataPrivacyPath?: string;
}

export interface UserRemoteConfigOrganization {
	organizationId: string;
	name: string;
}

export interface UserRemoteConfigResponse {
	organizationId: string;
	value: string;
	enabled: boolean;
	organizations?: UserRemoteConfigOrganization[];
}

export interface SekoKuvaAccountBalance {
	balance: number;
	userId: string;
}

export interface SekoKuvaAccountUsageTransaction {
	aiInferenceProviderName: string;
	aiModelName: string;
	aiModelTypeName: string;
	completionTokens: number;
	costUsd: number;
	createdAt: string;
	creditsUsed: number;
	generationId: string;
	id: string;
	metadata: {
		additionalProp1: string;
		additionalProp2: string;
		additionalProp3: string;
	};
	operation?: string;
	organizationId: string;
	promptTokens: number;
	totalTokens: number;
	userId: string;
}

export interface SekoKuvaAccountPaymentTransaction {
	paidAt: string;
	creatorId: string;
	amountCents: number;
	credits: number;
}

export interface SekoKuvaOrganization {
	createdAt: string;
	defaultRemoteConfig?: string;
	deletedAt?: string;
	externalOrganizationId?: string;
	id: string;
	memberCount?: number;
	name: string;
	remoteConfigEnabled: boolean;
	updatedAt: string;
}

export interface SekoKuvaAccountOrganizationBalance {
	balance: number;
	organizationId: string;
}

export interface FeaturebaseTokenResponse {
	featurebaseJwt: string;
}

export interface SekoKuvaSubscriptionPlan {
	displayName?: string;
	features?: {
		included?: string[];
		[key: string]: unknown;
	};
	id?: string;
	interval?: string;
	name?: string;
	pricePerSeatCents?: number;
	type?: string;
	[key: string]: unknown;
}

export interface UserCurrentPlan {
	cancelAt?: string;
	canceledAt?: string;
	currentPeriodEnd?: string;
	currentPeriodStart?: string;
	plan?: SekoKuvaSubscriptionPlan | null;
	planHistoryId?: string;
	subscriptionId?: string;
	userId?: string;
	[key: string]: unknown;
}

export interface SekoKuvaAccountOrganizationUsageTransaction {
	aiInferenceProviderName: string;
	aiModelName: string;
	aiModelTypeName: string;
	completionTokens: number;
	costUsd: number;
	createdAt: string;
	creditsUsed: number;
	generationId: string;
	id: string;
	memberDisplayName: string;
	memberEmail: string;
	metadata: {
		additionalProp1: string;
		additionalProp2: string;
		additionalProp3: string;
	};
	operation?: string;
	organizationId: string;
	promptTokens: number;
	totalTokens: number;
	userId: string;
}
