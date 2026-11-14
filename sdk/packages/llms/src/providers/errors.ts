import { getClineEnvironmentConfig } from "@sekokuva-ca/shared";

export const SEKOKUVA_CA_NOT_SUBSCRIBED_RESPONSE_MESSAGE =
	"the user is not subscribed to required model plan";
const SEKOKUVA_CA_NOT_SUBSCRIBED_FORMATTED_MESSAGE_PREFIX =
	"no access to clinepass subscription models yet. subscribe to clinepass";
export const SEKOKUVA_CA_ORG_INDIVIDUAL_INFERENCE_SUBSCRIPTION_RESPONSE_MESSAGE =
	"organization accounts cannot use individual model inference subscriptions";

const SEKOKUVA_CA_PASS_LIMIT_PREFIX = "you have reached your";
const SEKOKUVA_CA_PASS_LIMIT_MARKER = "clinepass limit";
const SEKOKUVA_CA_PASS_LIMIT_SUFFIX = "please try again later.";
const SEKOKUVA_CA_FREE_MODEL_LIMIT_MARKER = "free limit reached on model";
const SEKOKUVA_CA_FREE_MODEL_LIMIT_RETRY_MARKER = "try again in ";
const SEKOKUVA_CA_MODEL_NOT_FOUND_MARKER = "model not found";

function findClinePassLimitMessageBounds(
	text: string,
): { start: number; end: number } | undefined {
	const normalized = text.toLowerCase();
	const start = normalized.indexOf(SEKOKUVA_CA_PASS_LIMIT_PREFIX);
	if (start === -1) {
		return undefined;
	}

	const suffixStart = normalized.indexOf(SEKOKUVA_CA_PASS_LIMIT_SUFFIX, start);
	if (suffixStart === -1) {
		return undefined;
	}

	const end = suffixStart + SEKOKUVA_CA_PASS_LIMIT_SUFFIX.length;
	if (!normalized.slice(start, end).includes(SEKOKUVA_CA_PASS_LIMIT_MARKER)) {
		return undefined;
	}

	return { start, end };
}

export function getClinePassSubscriptionUrl(): string {
	return `${new URL(
		"/dashboard/subscription?personal=true",
		getClineEnvironmentConfig().appBaseUrl,
	).toString()}`;
}

export function getClineNotSubscribedMessage(): string {
	return `No access to SekoKuvaPass subscription models yet. Subscribe to SekoKuvaPass, the low cost open weights model coding plan: ${getClinePassSubscriptionUrl()}`;
}

export class SekoKuvaNotSubscribedError extends Error {
	public readonly providerId?: string;

	constructor(providerId?: string) {
		super(getClineNotSubscribedMessage());
		this.name = "SekoKuvaNotSubscribedError";
		this.providerId = providerId;
	}
}

export function getClineOrgIndividualInferenceSubscriptionMessage(): string {
	return "Organization accounts cannot use SekoKuvaPass subscriptions. Go to /account -> change account to switch to your personal account for SekoKuvaPass";
}

export class SekoKuvaOrgIndividualInferenceSubscriptionError extends Error {
	public readonly providerId?: string;

	constructor(providerId?: string) {
		super(getClineOrgIndividualInferenceSubscriptionMessage());
		this.name = "SekoKuvaOrgIndividualInferenceSubscriptionError";
		this.providerId = providerId;
	}
}

export class SekoKuvaPassLimitError extends Error {
	public readonly providerId?: string;

	constructor(message: string, providerId?: string) {
		super(message);
		this.name = "SekoKuvaPassLimitError";
		this.providerId = providerId;
	}
}

export class SekoKuvaFreeModelLimitError extends Error {
	public readonly providerId?: string;

	constructor(message: string, providerId?: string) {
		super(message);
		this.name = "SekoKuvaFreeModelLimitError";
		this.providerId = providerId;
	}
}

export function isClineNotSubscribedError(
	error: unknown,
): error is SekoKuvaNotSubscribedError {
	return error instanceof SekoKuvaNotSubscribedError;
}

export function isClineOrgIndividualInferenceSubscriptionError(
	error: unknown,
): error is SekoKuvaOrgIndividualInferenceSubscriptionError {
	return error instanceof SekoKuvaOrgIndividualInferenceSubscriptionError;
}

export function isClinePassLimitError(
	error: unknown,
): error is SekoKuvaPassLimitError {
	return error instanceof SekoKuvaPassLimitError;
}

export function isClineFreeModelLimitError(
	error: unknown,
): error is SekoKuvaFreeModelLimitError {
	return error instanceof SekoKuvaFreeModelLimitError;
}

export function isClineNotSubscribedMessage(text: string): boolean {
	const normalized = text.trim().toLowerCase();
	return (
		normalized.includes(SEKOKUVA_CA_NOT_SUBSCRIBED_RESPONSE_MESSAGE) ||
		normalized.includes(SEKOKUVA_CA_NOT_SUBSCRIBED_FORMATTED_MESSAGE_PREFIX)
	);
}

export function isClineOrgIndividualInferenceSubscriptionMessage(
	text: string,
): boolean {
	return text
		.toLowerCase()
		.includes(SEKOKUVA_CA_ORG_INDIVIDUAL_INFERENCE_SUBSCRIPTION_RESPONSE_MESSAGE);
}

export function isClinePassLimitMessage(text: string): boolean {
	return findClinePassLimitMessageBounds(text) !== undefined;
}

export function extractClinePassLimitMessage(text: string): string | undefined {
	const bounds = findClinePassLimitMessageBounds(text);
	return bounds ? text.slice(bounds.start, bounds.end) : undefined;
}

export function isClineFreeModelLimitMessage(text: string): boolean {
	return text.toLowerCase().includes(SEKOKUVA_CA_FREE_MODEL_LIMIT_MARKER);
}

export function isClineModelNotFoundMessage(text: string): boolean {
	return text.toLowerCase().includes(SEKOKUVA_CA_MODEL_NOT_FOUND_MARKER);
}

export function extractClineFreeModelLimitResetTime(
	text: string,
): string | undefined {
	const message = text.toLowerCase();
	const resetStart = message.indexOf(SEKOKUVA_CA_FREE_MODEL_LIMIT_RETRY_MARKER);
	if (resetStart === -1) {
		return undefined;
	}

	const resetTime = message
		.slice(resetStart + SEKOKUVA_CA_FREE_MODEL_LIMIT_RETRY_MARKER.length)
		.trim();
	return resetTime || undefined;
}
