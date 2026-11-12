<p align="center">
  <img src="assets/branding/sekokuva-app-icon-256.png" width="96" alt="SekoKuva Coding Agent" />
</p>

<h1 align="center">SekoKuva Coding Agent</h1>

<p align="center">
An AI coding agent for your editor and your terminal.
</p>

<p align="center">
  <a href="https://ca.sekokuva.fi"><strong>Website</strong></a> ·
  <a href="https://ca.sekokuva.fi/docs"><strong>Docs</strong></a> ·
  <a href="CONTRIBUTING.md"><strong>Contributing</strong></a>
</p>

---

SekoKuva Coding Agent reads your project, edits files, runs commands, and works
through tasks with you. Every file change and terminal command requires your
approval, so you stay in control of what actually changes.

It runs on the SekoKuva model gateway at `api.sekokuva.fi`, and can also be
pointed at any OpenAI-compatible endpoint.

## What's in this repository

| Part | Description | Location |
| --- | --- | --- |
| **VS Code extension** | The editor integration and its webview UI. | [`apps/vscode/`](apps/vscode) |
| **CLI** | Terminal UI, headless mode, and shell commands. | [`apps/cli/`](apps/cli) |
| **Agent core** | The tool loop, provider abstraction, and session runtime. | [`sdk/packages/`](sdk/packages) |
| **Desktop app** | Native shell (Tauri) around the agent core. | [`apps/examples/desktop-app/`](apps/examples/desktop-app) |
| **Docs** | Documentation site. | [`docs/`](docs) |

## Features

**Edits code across your project.** The agent reads your project structure,
understands the relationships between files, and makes coordinated changes. It
watches linter and compiler output as it works and fixes issues before you see
them. Every edit appears as a diff you can review, modify, or revert, and
checkpoints let you undo the agent's work.

**Runs commands.** Commands execute in your terminal with output streamed back
in real time. Long-running processes like dev servers keep running in the
background while the agent reacts to new output.

**Plan and Act.** In Plan mode the agent explores the codebase, asks clarifying
questions, and lays out a strategy. Switch to Act mode to execute it. Auto-approve
is available when you want the agent to run unattended.

**Rules and skills.** Project-specific rules live in `.sekokuva-ca-rules` and are
picked up automatically by every surface. Skills let the model load specific
rules only when they are relevant.

**Extensible.** Register tools and lifecycle hooks through the plugin system, or
connect MCP servers over `stdio`, `sse`, or `streamableHttp`.

## Getting started

### VS Code extension

Install **SekoKuva Coding Agent** from the VS Code Marketplace, then open the
SekoKuva view in the activity bar.

### CLI

```bash
npm install -g sekokuva-ca
sekokuva-ca
```

Run `sekokuva-ca doctor` to check your local setup.

### From source

```bash
bun install
bun run build:sdk
bun run cli
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development setup.

## Configuration

Configuration lives in `~/.sekokuva-ca`. Set `SEKOKUVA_CA_API_BASE_URL` to point
the agent at a different gateway.

## Brand assets

Logos, the icon mark, and the color palette are documented in
[`assets/branding/README.md`](assets/branding/README.md). Canonical brand values
live in [`sdk/packages/shared/src/brand.ts`](sdk/packages/shared/src/brand.ts).

## License

[Apache License 2.0](LICENSE) © 2026 BC Bertenex Oy.

This product includes software developed by Cline Bot Inc., licensed under the
Apache License 2.0. See [NOTICE](NOTICE).
