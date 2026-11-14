// Under vitest, `@sekokuva-ca/core` is aliased to src/test/cline-core-vitest-stub.ts
// (see vitest.config.ts), which holds models.json state in memory and exposes
// the stub-only `resetModelsFileState` — hence the cast below.
import * as SekoKuvaCore from "@sekokuva-ca/core"
import { resetRegistry } from "@sekokuva-ca/llms"
import { beforeEach } from "vitest"

const { resetModelsFileState } = SekoKuvaCore as typeof SekoKuvaCore & { resetModelsFileState(): void }

beforeEach(() => {
	resetModelsFileState()
	// The stub's syncStoredProviderRegistration mutates the real shared
	// @sekokuva-ca/llms registry; reset it so registrations never leak across tests.
	resetRegistry()
})
