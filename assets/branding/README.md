# SekoKuva Coding Agent — brand assets

Visual identity for SekoKuva Coding Agent, published by BC Bertenex Oy.

## Palette

Sampled directly from the SekoKuva logo. These are the only brand colors; do
not introduce new hues.

| Token | Hex | Use |
| --- | --- | --- |
| `primary` | `#ea7131` | Accent, active states, focus rings, the mark's chevrons |
| `primaryHover` | `#ee7b34` | Hover state for primary |
| `ink` | `#202e3b` | Body text, dark surfaces, the mark's octagon |
| `inkMuted` | `#2a3e4d` | Secondary text, borders on dark |
| `surface` | `#f9f9f5` | Light backgrounds, the mark's octagon on dark |

The canonical values live in
[`sdk/packages/shared/src/brand.ts`](../../sdk/packages/shared/src/brand.ts).
Import `BRAND.colors` rather than copying hex codes.

## The mark

The mark is derived from the central motif of the SekoKuva logo: a faceted
octagon inside a ring, with four outward chevrons. It reads as an aperture,
which suits a product named *SekoKuva* ("mixed image").

```
        ╱╲
      ╱    ╲
    ╱   ⬢    ╲
      ╲    ╱
        ╲╱
```

### Files

| File | Purpose |
| --- | --- |
| `sekokuva-mark.svg` | Monochrome, `currentColor`. **Use this for all UI.** |
| `sekokuva-mark-color.svg` | Two-color lockup for marketing and docs. |
| `sekokuva-app-icon.png` | 1024×1024 app icon, navy rounded square. |
| `sekokuva-app-icon-256.png` | 256×256 app icon. |
| `logos/sekokuva-wordmark-dark.png` | Horizontal lockup, navy text, for light backgrounds. |
| `logos/sekokuva-wordmark-light.png` | Horizontal lockup, off-white text, for dark backgrounds. |
| `sekokuva-logo-source.svg` | Original supplied artwork. **Not for production use** — see below. |

### Rules

1. **The activity bar icon must be `sekokuva-mark.svg`.** VS Code renders
   activity bar icons at 24×24 and recolors them via `currentColor`, so the
   icon must be monochrome and must not embed a raster image.
2. **Never scale the mark below 16×16.** At 16px the four chevrons merge into a
   diamond silhouette; that is intentional and is the smallest legible size.
3. **Do not place the mark on a busy background.** It needs either the navy
   surface or a plain light surface behind it.
4. **Do not recolor the mark** outside the palette above.
5. **Do not stretch or rotate the mark.** It is square; scale uniformly.

## About `sekokuva-logo-source.svg`

The supplied logo is a 1.5 MB SVG that wraps a single 1024×1024 PNG in a
`<image>` element. It contains no vector paths, so it cannot be recolored, does
not scale cleanly, and cannot be used as an activity bar icon.

It is kept here as the reference artwork the mark was derived from. Use it only
at large sizes as a decorative asset (splash screen, about page, docs hero).
For anything else, use the derived vector mark.