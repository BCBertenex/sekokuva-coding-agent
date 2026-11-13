import type { ClineCore } from "@sekokuva-ca/core";
import type { MessageWithMetadata } from "@sekokuva-ca/shared";

export async function loadInteractiveResumeMessages(
	sessionManager: ClineCore,
	resumeSessionId?: string,
): Promise<MessageWithMetadata[] | undefined> {
	const target = resumeSessionId?.trim();
	if (!target) {
		return undefined;
	}
	return await sessionManager.readMessages(target);
}
