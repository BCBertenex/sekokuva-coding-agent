import type {
	SekoKuvaAccountActionRequest,
	ProviderActionRequest,
} from "@sekokuva-ca/shared";
import type {
	SekoKuvaAccountBalance,
	SekoKuvaAccountOrganization,
	SekoKuvaAccountOrganizationBalance,
	SekoKuvaAccountOrganizationUsageTransaction,
	SekoKuvaAccountPaymentTransaction,
	SekoKuvaAccountUsageTransaction,
	SekoKuvaAccountUser,
	FeaturebaseTokenResponse,
	UserCurrentPlan,
} from "./types";

export interface SekoKuvaAccountOperations {
	fetchMe(): Promise<SekoKuvaAccountUser>;
	fetchBalance(userId?: string): Promise<SekoKuvaAccountBalance>;
	fetchUsageTransactions(
		userId?: string,
	): Promise<SekoKuvaAccountUsageTransaction[]>;
	fetchPaymentTransactions(
		userId?: string,
	): Promise<SekoKuvaAccountPaymentTransaction[]>;
	fetchUserOrganizations(): Promise<SekoKuvaAccountOrganization[]>;
	fetchOrganizationBalance(
		organizationId: string,
	): Promise<SekoKuvaAccountOrganizationBalance>;
	fetchOrganizationUsageTransactions(input: {
		organizationId: string;
		memberId?: string;
	}): Promise<SekoKuvaAccountOrganizationUsageTransaction[]>;
	switchAccount(organizationId?: string | null): Promise<void>;
	fetchFeaturebaseToken?(): Promise<FeaturebaseTokenResponse | undefined>;
	fetchCurrentUserPlan?(): Promise<UserCurrentPlan | undefined>;
}

export function isClineAccountActionRequest(
	request: ProviderActionRequest,
): request is SekoKuvaAccountActionRequest {
	return request.action === "sekokuvaCaAccount";
}

export async function executeClineAccountAction(
	request: SekoKuvaAccountActionRequest,
	service: SekoKuvaAccountOperations,
): Promise<unknown> {
	switch (request.operation) {
		case "fetchMe":
			return service.fetchMe();
		case "fetchBalance":
			return service.fetchBalance(request.userId);
		case "fetchUsageTransactions":
			return service.fetchUsageTransactions(request.userId);
		case "fetchPaymentTransactions":
			return service.fetchPaymentTransactions(request.userId);
		case "fetchUserOrganizations":
			return service.fetchUserOrganizations();
		case "fetchOrganizationBalance":
			return service.fetchOrganizationBalance(request.organizationId);
		case "fetchOrganizationUsageTransactions":
			return service.fetchOrganizationUsageTransactions({
				organizationId: request.organizationId,
				memberId: request.memberId,
			});
		case "switchAccount":
			await service.switchAccount(request.organizationId);
			return { updated: true };
		case "fetchFeaturebaseToken":
			return service.fetchFeaturebaseToken?.();
		case "fetchCurrentUserPlan":
			return service.fetchCurrentUserPlan?.();
		default: {
			const exhaustive: never = request;
			throw new Error(
				`Unsupported Cline account operation: ${String(exhaustive)}`,
			);
		}
	}
}

export interface ProviderActionExecutor {
	runProviderAction(request: ProviderActionRequest): Promise<{
		result: unknown;
	}>;
}

export class RpcClineAccountService implements SekoKuvaAccountOperations {
	private readonly executor: ProviderActionExecutor;

	constructor(executor: ProviderActionExecutor) {
		this.executor = executor;
	}

	public async fetchMe(): Promise<SekoKuvaAccountUser> {
		return this.request<SekoKuvaAccountUser>({
			action: "sekokuvaCaAccount",
			operation: "fetchMe",
		});
	}

	public async fetchBalance(userId?: string): Promise<SekoKuvaAccountBalance> {
		return this.request<SekoKuvaAccountBalance>({
			action: "sekokuvaCaAccount",
			operation: "fetchBalance",
			...(userId?.trim() ? { userId: userId.trim() } : {}),
		});
	}

	public async fetchUsageTransactions(
		userId?: string,
	): Promise<SekoKuvaAccountUsageTransaction[]> {
		return this.request<SekoKuvaAccountUsageTransaction[]>({
			action: "sekokuvaCaAccount",
			operation: "fetchUsageTransactions",
			...(userId?.trim() ? { userId: userId.trim() } : {}),
		});
	}

	public async fetchPaymentTransactions(
		userId?: string,
	): Promise<SekoKuvaAccountPaymentTransaction[]> {
		return this.request<SekoKuvaAccountPaymentTransaction[]>({
			action: "sekokuvaCaAccount",
			operation: "fetchPaymentTransactions",
			...(userId?.trim() ? { userId: userId.trim() } : {}),
		});
	}

	public async fetchUserOrganizations(): Promise<SekoKuvaAccountOrganization[]> {
		return this.request<SekoKuvaAccountOrganization[]>({
			action: "sekokuvaCaAccount",
			operation: "fetchUserOrganizations",
		});
	}

	public async fetchOrganizationBalance(
		organizationId: string,
	): Promise<SekoKuvaAccountOrganizationBalance> {
		const orgId = organizationId.trim();
		if (!orgId) {
			throw new Error("organizationId is required");
		}
		return this.request<SekoKuvaAccountOrganizationBalance>({
			action: "sekokuvaCaAccount",
			operation: "fetchOrganizationBalance",
			organizationId: orgId,
		});
	}

	public async fetchOrganizationUsageTransactions(input: {
		organizationId: string;
		memberId?: string;
	}): Promise<SekoKuvaAccountOrganizationUsageTransaction[]> {
		const orgId = input.organizationId.trim();
		if (!orgId) {
			throw new Error("organizationId is required");
		}
		return this.request<SekoKuvaAccountOrganizationUsageTransaction[]>({
			action: "sekokuvaCaAccount",
			operation: "fetchOrganizationUsageTransactions",
			organizationId: orgId,
			...(input.memberId?.trim() ? { memberId: input.memberId.trim() } : {}),
		});
	}

	public async switchAccount(organizationId?: string | null): Promise<void> {
		await this.request<{ updated: boolean }>({
			action: "sekokuvaCaAccount",
			operation: "switchAccount",
			organizationId: organizationId?.trim() || null,
		});
	}

	public async fetchFeaturebaseToken(): Promise<
		FeaturebaseTokenResponse | undefined
	> {
		return this.request<FeaturebaseTokenResponse | undefined>({
			action: "sekokuvaCaAccount",
			operation: "fetchFeaturebaseToken",
		});
	}

	public async fetchCurrentUserPlan(): Promise<UserCurrentPlan | undefined> {
		return this.request<UserCurrentPlan | undefined>({
			action: "sekokuvaCaAccount",
			operation: "fetchCurrentUserPlan",
		});
	}

	private async request<T>(request: SekoKuvaAccountActionRequest): Promise<T> {
		const response = await this.executor.runProviderAction(request);
		return response.result as T;
	}
}
