# SekoKuva Coding Agent — Rebrand Plan

Living plan for rebranding this repository from Cline to **SekoKuva Coding Agent**,
published by **BC Bertenex Oy**.

Keep this file updated as PRs land. Each PR below is independently mergeable and
has a verification gate.

## Brand facts

Canonical values live in [`sdk/packages/shared/src/brand.ts`](../sdk/packages/shared/src/brand.ts).
Do not hardcode these anywhere else.

| Field | Value |
| --- | --- |
| Product name | SekoKuva Coding Agent |
| Short name | SekoKuva CA |
| Slug | `sekokuva-ca` |
| Company | BC Bertenex Oy |
| VS Code publisher | `sekokuva` |
| Extension ID | `sekokuva.sekokuva-ca` |
| Homepage | https://ca.sekokuva.fi |
| Docs | https://ca.sekokuva.fi/docs |
| API base | https://api.sekokuva.fi |
| CLI binary | `sekokuva-ca` |
| Config dir | `~/.sekokuva-ca` |
| Provider id | `sekokuva-ca` |
| Env prefix | `SEKOKUVA_CA_` |

Palette (sampled from the logo): `#ea7131` orange, `#202e3b` navy, `#f9f9f5` off-white.

Brand assets and rules: [`assets/branding/README.md`](../assets/branding/README.md).

## Decisions already made

- **Full rename (Option B).** No existing users, so no compatibility layer, no
  dual-read, no deprecated aliases.
- **SDK is internal.** The `sdk/packages/*` workspace packages are renamed but
  **not published** to npm. They remain the internal module graph.
- **Own backend.** `api.sekokuva.fi` is the production target; the current
  working endpoint is `https://copilot.sekokuva.fi` (OpenAI-compatible, `/v1`).
- **OAuth later.** Ship API-key auth first; the client-side OAuth flow already
  exists and only needs server endpoints.
- **No on-disk migration.** `~/.cline` → `~/.sekokuva-ca` is a hard cut.
- **Trademark.** SekoKuva is a registered trademark of BC Bertenex Oy. The
  Apache-2.0 `LICENSE` and `NOTICE` attribution to Cline Bot Inc. must be kept.

## PR sequence

| # | Scope | Status |
| --- | --- | --- |
| 1 | Brand kit, NOTICE, community docs, disable upstream workflows | **Done** |
| 2 | SDK scope rename `@cline/*` → `@sekokuva-ca/*` | **Done** |
| 3 | SDK identifier rename `Cline*` → `SekoKuva*`, `CLINE_*` → `SEKOKUVA_CA_*` | **Next** |
| 4 | Proto package rename `cline` → `sekokuva` | Pending |
| 5 | VS Code manifest, registry, icons, walkthrough | Pending |
| 6 | Webview UI: logos, colors, copy | Pending |
| 7 | CLI: binary name, config dir, TUI | Pending |
| 8 | Desktop app: Tauri identifiers, updater keypair | Pending |
| 9 | Backend repoint + `sekokuva-ca` provider | Pending |
| 10 | Auth: API key now, OAuth server later | Pending |
| 11 | Docs site | Pending |
| 12 | CI / release workflows | Pending |

### PR 3 — SDK identifiers (current)

Scope: `sdk/packages/*` only. Measured surface:

- **501 files**, **5,518** `Cline*` matches
- **137 distinct** `CLINE_*` env vars, **1,263** occurrences

Order matters — do one package at a time, running
`bun run build:sdk && bun run types` after each:

1. `shared` (foundation, no internal deps)
2. `llms` (depends on shared)
3. `agents` (depends on llms, shared)
4. `core` (depends on agents, llms, shared)
5. `sdk` (alias for core)
6. `ui` (depends on shared)

Naming rules:

| Pattern | Becomes | Example |
| --- | --- | --- |
| `ClineXxx` (type/class/interface) | `SekoKuvaXxx` | `ClineCore` → `SekoKuvaCore` |
| `CLINE_XXX` (env var) | `SEKOKUVA_CA_XXX` | `CLINE_DIR` → `SEKOKUVA_CA_DIR` |
| `clineXxx` (camelCase var) | `sekokuvaCaXxx` | `clineAccount` → `sekokuvaCaAccount` |
| `cline_xxx` (snake_case) | `sekokuva_ca_xxx` | `cline_type` → `sekokuva_ca_type` |

**Do not rename in PR 3:**

- `cline.bot` / `api.cline.bot` URLs — PR 9
- `@cline/...` specifiers — already done in PR 2
- Proto field names — PR 4
- User-facing strings — PRs 5–7

### The wire-format rule

The single most important constraint in this PR. A name is either **ours** or
**theirs**, and only ours may be renamed.

| Kind | Rename? | Why |
| --- | --- | --- |
| Our types, classes, env vars, constants | **Yes** | We own both sides |
| JSON fields in a server response | **No** | The server still sends the old name |
| JSON keys in a legacy on-disk file | **No** | Historical data format |
| Error text we match against | **No** | The server still emits the old text |
| User-facing message strings | **Yes** | We author them |

Concrete cases that must keep the old spelling:

- `clinePass` / `clineCloud` — fields in `/api/v1/ai/cline/recommended-models`
- `clineUserId` — field in the WorkOS auth response
- `clineApiKey`, `clineAccountId`, `actModeClineModelId` — legacy `secrets.json`
  and `globalState.json` keys read by the migration
- `"clinepass limit"`, `"no access to clinepass..."` — substrings of server
  error bodies

The codemod cannot tell these apart, so **every rename it makes must be
reviewed against this table**. The `as keyof LegacyGlobalState` cast in
`provider-settings-legacy-migration.ts` is a particular trap: it silences the
compiler while the lookup silently returns `undefined`.

### Consumers must move with the SDK

Renaming an SDK export breaks every app that imports it. Two follow-up codemods
handle the mechanical part:

```bash
node scripts/fix-sdk-consumers.mjs            # apps/*: renamed SDK exports
node scripts/fix-sdk-consumers.mjs --root sdk/examples
node scripts/rename-app-env-vars.mjs          # apps/*: CLINE_* -> SEKOKUVA_CA_*
```

Env vars are a cross-process contract: if the SDK reads `SEKOKUVA_CA_DATA_DIR`
and the CLI still sets `CLINE_DATA_DIR`, the two halves silently stop talking
and tests fail with paths pointing at the real user home.

Verification gate:

```bash
bun run build:sdk
bun run types
bun -F @sekokuva-ca/shared test
bun -F @sekokuva-ca/llms test
bun -F @sekokuva-ca/agents test
bun -F @sekokuva-ca/core test:unit
bun -F @sekokuva-ca/cli test:unit
bun -F claude-dev test
```

### PR 3 result

| Suite | Result |
| --- | --- |
| `shared` | 527 pass |
| `llms` | 1135 pass |
| `agents` | 160 pass |
| `core` | 3559 pass / 0 fail |
| `cli` | 1326 pass / 0 fail |
| `vscode` | 1235 pass / 0 fail |
| `ui` | 413 pass / 0 fail |
| `types` | all 16 packages pass |

228 SDK files and 23 paths renamed; 84 app files and 369 SDK-export references
updated; 252 app files and 1451 env-var references updated.

## Test-suite health

The suite is green on Windows. Getting there required fixing real product bugs,
not just test assumptions — the distinction matters, so each is recorded below.

### Product bugs found and fixed

| Bug | Impact | Fix |
| --- | --- | --- |
| MCP stdio servers could not start from a path containing a space | `shell: true` on win32 routed the command through `cmd.exe`, which split `C:\Program Files\nodejs\node.exe` at the space. Every MCP server launched by absolute path failed with `'C:\Program' is not recognized`. | `resolveWindowsSpawnOptions()` in `@sekokuva-ca/shared/node` uses the shell only for `.cmd`/`.bat` shims and bare names, and quotes paths with spaces. Applied to the MCP client and `plugin-install`. |
| Extensionless hook files silently did nothing on Windows | The fallback was hardcoded to `bash`, but `bash.exe` on Windows is the WSL launcher and cannot run a script at a Windows path. | Falls back to PowerShell; `-File` rejects a non-`.ps1` script, so the content is piped through `Invoke-Expression`. |
| A bare Git repository threw instead of reporting "not a working tree" | Git 2.38+ refuses `rev-parse` inside a bare repo unless `safe.bareRepository` allows it. The code only handled "not a git repository" and rethrew. | Treat `cannot use bare repository` as `false`. |
| `bin/cline` could not spawn a `.cmd` target | `spawnSync` on a `.cmd` fails with `EINVAL` on Windows. | Same shell rule as the MCP client. |
| Status bar and context-usage numbers followed the host locale | `toLocaleString()` with no locale rendered `12 345` under `fi-FI`, breaking fixed-width TUI alignment and making output machine-dependent. | Pinned to `en-US`, matching `utils/output.ts`. |
| `agents-squad` plugin failed to typecheck | The plugin pinned `zod@^4.1.5` while the SDK used `^4.3.6`, so `createTool`'s `ZodTypeAny` overload never matched. | Aligned the plugin's range to `^4.6.5`. |

### Test-isolation bugs found and fixed

| Bug | Impact | Fix |
| --- | --- | --- |
| `runtime-builder` and `fetch-wiring` read the developer's real `~/.cline/data/settings/cline_mcp_settings.json` | A machine with any configured stdio server made unrelated tests spawn it and hang for 20s. | Both suites point `SEKOKUVA_CA_MCP_SETTINGS_PATH` at a temp dir. |
| `bin-wrapper` copied the wrapper into a temp dir under the repo | It inherited `apps/cli/package.json` (`"type": "module"`), so Node parsed the CommonJS wrapper as ESM. The published package has no `type` field. | The fixture writes its own `package.json`. |
| `kanban` wrote POSIX `sh` stubs | The product resolves `kanban.cmd` on win32. | Stubs are emitted per target platform. |
| `hook-file-hooks` assumed bash | See the product bug above. | POSIX tests are gated to non-Windows; Windows equivalents cover the same behaviour through PowerShell. |

### Flakiness

`@sekokuva-ca/core` mixes unit tests with real process, Git, and SQLite
integration coverage. On Windows those children contend for cores, and a few
timing-sensitive tests (MCP stdio handshakes, hub proxy tunnels, large-remote
Git inspection) intermittently exceeded their budgets when every worker ran at
once. `vitest.config.ts` now caps `maxWorkers` at 4 on Windows. Verified stable
across consecutive full runs.

### Fixed during the rebrand

| Issue | Fix |
| --- | --- |
| Logging hung when `CLINE_LOG_PATH` pointed at a directory | `isWritableLogFile()` checks `statSync().isFile()` first |
| Plugin install failed on Windows for `.cmd` npm shims | `shell: true` on win32 in `runCommand` |
| SQLite handle leaked, causing `EBUSY` on cleanup | `store.close()` in `finally` |
| `@C:\path\file` mentions silently ignored on Windows | Mention regex accepts drive letters and UNC paths |
| `/team` never enabled teams | `enableAgentTeams` gated on `isZenMode`, not `isYoloMode` |
| `--teams` / `--no-teams` removed by a refactor | Restored, with explicit flag winning over the mode default |

## Mode reference

`AgentMode = "act" | "plan" | "yolo" | "zen"`

| Mode | Approvals | Terminal | Teams |
| --- | --- | --- | --- |
| `act` | per-action | attached | on |
| `plan` | per-action | attached | on (read-only tools) |
| `yolo` | none | attached | on |
| `zen` | none | **exits immediately** | **off** |

`yolo` is auto-selected for one-shot runs (prompt + no TTY). `zen` disables
teams because the CLI exits before work starts and nobody can stop an unbounded
fan-out of teammates. `--teams` overrides this explicitly.

## Runtime topology

Nothing requires a remote server to run a task.

| Component | Where | Needed |
| --- | --- | --- |
| Agent loop | In-process (CLI) | Always |
| Hub daemon | `127.0.0.1:8787`, spawned on demand | Only for `--zen`, connectors, schedules, dashboard |
| Model gateway | `api.sekokuva.fi` | For inference |
| Distribution | npm / VS Marketplace | Install time only |

## Running it locally

Both surfaces build and run on Windows. Verified end to end.

### VS Code extension

```powershell
cd apps\vscode
bun run build:webview      # webview UI -> webview-ui/build (~30s)
bun esbuild.mjs            # extension bundle -> dist/extension.js (~10s)
```

Then launch a dev host:

```powershell
code --user-data-dir="$env:TEMP\vscode-dev" `
     --extensionDevelopmentPath="C:\Users\ville\projects\coding-agent\apps\vscode" `
     "$env:TEMP\test-workspace"
```

Open the Cline view from the activity bar. Confirmed working: the extension
activates in ~360ms, `VscodeSessionHost` initializes with `SekoKuvaCore`, and
the webview renders and accepts input.

Notes:

- `bun run download-ripgrep` fails on Windows because it shells out to `unzip`.
  It is **not needed for development** — `getBinaryLocation()` resolves `rg`
  from VS Code's own installation. Only the packaged build needs the bundled
  binaries.
- The manifest is still `claude-dev` / `Cline` / `saoudrizwan`. That is PR 5.
- A configured stdio server in your real `~/.cline/data/settings` will log
  `Failed to connect to new MCP server` on activation. Expected until PR 7
  moves the config directory.

### Desktop app

The native window needs Rust (`cargo`, `rustc`), which is not installed here.
The headless mode does not:

```powershell
cd apps\examples\desktop-app
bun run dev:headless       # sidecar + Next.js UI, no Rust
```

Serves the UI at `http://localhost:3125` and the sidecar on a random port.
Confirmed working: the onboarding screen renders and the sidecar reports
`{"type":"ready", ...}`.

For the native window, install Rust ≥1.85 (`winget install Rustlang.Rustup`),
then `bun run dev` (Tauri). The crate graph needs Cargo's `edition2024` feature.

## Verification commands

```bash
# SDK must be rebuilt after any sdk/packages change
bun run build:sdk

# Typecheck everything
bun run types

# Unit tests
bun run test:unit

# Refresh snapshots after prompt/tool changes
UPDATE_SNAPSHOTS=true bun run test:unit

# Brand-leak check (should trend to zero)
rg -i "cline" --glob '!**/node_modules/**' --glob '!**/dist/**' -c
```

## WSL notes

Running the CLI suite on Windows produces false failures. Use WSL with a
native-filesystem clone:

```bash
# One-time: install Bun without unzip (Ubuntu base image lacks it)
curl -fsSL -o bun-linux-x64.zip \
  https://github.com/oven-sh/bun/releases/latest/download/bun-linux-x64.zip
python3 -c "import zipfile; zipfile.ZipFile('bun-linux-x64.zip').extractall('.')"
mkdir -p ~/.bun/bin && cp bun-linux-x64/bun ~/.bun/bin/bun && chmod +x ~/.bun/bin/bun

# Node via nvm (no sudo)
curl -fsSL -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm install 22

# Clone to native fs (NOT /mnt/c — 9p is 5-10x slower)
git clone /mnt/c/Users/ville/projects/coding-agent ~/ca-test
cd ~/ca-test && bun install && bun run build:sdk
cd apps/cli && bun run test:unit
```

Add to `~/.bashrc` so WSL doesn't pick up the Windows `npm`:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
export PATH="$HOME/.bun/bin:$PATH"
```

## Legal

- `LICENSE` — Apache-2.0, kept verbatim.
- `NOTICE` — credits Cline Bot Inc. under Apache-2.0 §4.
- Apache-2.0 §6 does **not** grant trademark rights; the Cline name and logo
  must not ship. SekoKuva is BC Bertenex Oy's trademark.