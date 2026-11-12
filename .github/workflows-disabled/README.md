# Workflows (disabled)

These workflows are inherited from the upstream Cline repository and are
**disabled**. They publish to Cline's npm scope, the `saoudrizwan` VS Code
Marketplace publisher, and Cline's GitHub releases, none of which belong to
BC Bertenex Oy.

GitHub only runs workflows from `.github/workflows/`, so moving this directory
is what disables them. Do not move it back.

Each workflow must be rewritten for SekoKuva before it is re-enabled:

- Replace `saoudrizwan` with the `sekokuva` publisher.
- Replace `@cline/*` npm packages with `@sekokuva-ca/*`.
- Replace Cline GitHub release URLs with this repository's releases.
- Remove the `PublishNPM` environment and Cline's WorkOS/PostHog secrets.
- Regenerate the Tauri updater keypair before enabling `desktop-publish.yml`.

See the rebrand plan for the per-workflow checklist.
