# Cline web visual foundation

The shared visual contract now lives in the internal
[`@sekokuva-ca/ui`](../../../../../sdk/packages/ui/README.md) workspace package
instead of beside the desktop app.

The desktop imports the complete `@sekokuva-ca/ui/theme/index.css` entry point. Other
Cline surfaces can import `@sekokuva-ca/ui/theme/tokens.css` without React or
Tailwind, or compose the Tailwind adapter and optional base styles in order.
Consuming apps still own their font files and shell-specific layout.
