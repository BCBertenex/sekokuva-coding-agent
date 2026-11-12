# Contributing to SekoKuva Coding Agent

Thanks for your interest in contributing. This document covers how to set up the
project, what we expect from a pull request, and how to get help.

By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting Bugs or Issues

Before opening an issue, search the existing issues to avoid duplicates.

When you open a bug report, include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Your OS, editor version, and SekoKuva Coding Agent version
- Relevant logs or screenshots

> **Security issues:** do not open a public issue. See [SECURITY.md](SECURITY.md).

## Before Contributing

All contributions should begin with an issue, unless the change is a small bug
fix, typo correction, or minor wording improvement.

For features:

1. Check existing issues and discussions for similar ideas.
2. Open an issue describing the change and why it is needed.
3. Wait for a maintainer to approve before starting implementation.

Pull requests without an approved issue may be closed.

## Development Setup

### Prerequisites

- [git-lfs](https://git-lfs.com/)
- [Bun](https://bun.com) 1.4.2
- Node.js >= 22
- VS Code 1.101 or newer

### First build

```bash
git clone <this-repository>
cd coding-agent
bun install
bun run build:sdk
```

The SDK packages resolve each other through compiled `dist/` output, so
`bun run build:sdk` must run after any change to `sdk/packages/*` and before
running the CLI, the extension, or the SDK tests.

### Extension

```bash
cd apps/vscode
bun run protos      # required before the first build
bun run dev         # generates protos and starts watch mode
```

Then press `F5` (or **Run -> Start Debugging**) to launch a second VS Code window
with the extension loaded. You may need the
[esbuild problem matchers extension](https://marketplace.visualstudio.com/items?itemName=connor4312.esbuild-problem-matchers).

### CLI

```bash
bun run cli          # interactive
bun run cli doctor   # local health check
```

### Linux test dependencies

Extension tests on Linux require:

```bash
sudo apt update
sudo apt install -y \
  dbus libasound2 libatk-bridge2.0-0 libatk1.0-0 libdrm2 libgbm1 \
  libgtk-3-0 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 \
  libxfixes3 libxkbfile1 libxrandr2 xvfb
```

## Writing and Submitting Code

### Keep pull requests focused

- One feature or bug fix per pull request.
- Split large changes into smaller, related pull requests.
- Break changes into logical commits that can be reviewed independently.

### Code quality

```bash
bun run lint
bun run format
bun run types
```

All pull requests must pass CI, which runs linting, formatting, type checking,
and tests.

### Testing

```bash
bun run test:unit
```

Add tests for new behavior. Update existing tests when your change affects them.

After changing prompts or tool definitions, regenerate snapshots:

```bash
UPDATE_SNAPSHOTS=true bun run test:unit
```

### Commit messages

Use conventional commit format (`feat:`, `fix:`, `docs:`, `refactor:`,
`test:`, `chore:`) and reference relevant issues.

### Before submitting

- Rebase on the latest `main`.
- Confirm the branch builds.
- Confirm tests pass.
- Remove debugging code and stray console output.

### Pull request description

- Describe what the change does and why.
- Include steps to verify it.
- List any breaking changes.
- Add screenshots for UI changes.

## Contribution Agreement

By submitting a pull request, you agree that your contributions are licensed
under the [Apache License 2.0](LICENSE), the same license as this project.
