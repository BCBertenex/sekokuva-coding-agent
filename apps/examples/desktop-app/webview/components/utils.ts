import { formatDisplayUserInput } from "@sekokuva-ca/shared/browser";

export function normalizeTitle(title?: string): string {
	if (!title?.trim()) return "";
	return formatDisplayUserInput(title);
}
