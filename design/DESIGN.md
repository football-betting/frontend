---
name: Apex Pitch
colors:
  surface: '#121317'
  surface-dim: '#121317'
  surface-bright: '#38393d'
  surface-container-lowest: '#0d0e12'
  surface-container-low: '#1a1b1f'
  surface-container: '#1e1f23'
  surface-container-high: '#292a2e'
  surface-container-highest: '#343539'
  on-surface: '#e3e2e7'
  on-surface-variant: '#e7bdb7'
  inverse-surface: '#e3e2e7'
  inverse-on-surface: '#2f3034'
  outline: '#ad8883'
  outline-variant: '#5d3f3b'
  surface-tint: '#ffb4aa'
  primary: '#ffb4aa'
  on-primary: '#690003'
  primary-container: '#ff5545'
  on-primary-container: '#5c0002'
  inverse-primary: '#c0000a'
  secondary: '#adc6ff'
  on-secondary: '#002e69'
  secondary-container: '#4b8eff'
  on-secondary-container: '#00285c'
  tertiary: '#74d1ff'
  on-tertiary: '#003548'
  tertiary-container: '#149ccb'
  on-tertiary-container: '#002e3f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930005'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#c1e8ff'
  tertiary-fixed-dim: '#74d1ff'
  on-tertiary-fixed: '#001e2b'
  on-tertiary-fixed-variant: '#004d67'
  background: '#121317'
  on-background: '#e3e2e7'
  surface-variant: '#343539'
typography:
  display:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-mono:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 64px
  max-width-desktop: 1280px
---

## Brand & Style
The design system is engineered for a high-stakes tournament environment, focusing on the clarity of prediction data and the tension of live sports. The brand personality is authoritative, neutral, and precise, mirroring a premium broadcast graphics package.

The visual style is **High-Contrast Dark Mode**. It utilizes deep blacks and cool grays to create a "stadium at night" atmosphere, where data visualization and interactive elements are brought to the foreground through vibrant, neon-adjacent accents. The aesthetic avoids gamification tropes, opting instead for a professional, analytical interface that treats tournament predictions with the same rigor as professional sports journalism.

## Colors
The palette is rooted in a pure black background to ensure maximum contrast and energy efficiency on OLED screens. 

- **Primary (Red):** Used for critical actions, live indicators, and high-priority alerts.
- **Secondary & Tertiary (Blue/Cyan):** Used for navigation, interactive states, and differentiating data sets (e.g., Home vs. Away or Group A vs. Group B).
- **Surface Colors:** `surface_color_hex` provides the base for cards and containers, creating a subtle lift from the background.
- **Scoring Tokens:** Success (4 pts), Warning (2 pts), Neutral (1 pt), and Error (0 pts) utilize the status colors for immediate feedback on prediction accuracy.

## Typography
The system relies exclusively on **Hanken Grotesk** to maintain a sharp, contemporary feel. 

- **Headlines:** Use Bold and ExtraBold weights with tighter letter spacing for a high-impact, editorial look.
- **Data Tables:** Ensure numerical data uses the `data-mono` style for alignment.
- **Labels:** Use `label-caps` (Uppercase) for category headers, group stages, and table headers to create clear structural divisions without the need for heavy lines.
- **Mobile scaling:** Display and Large Headlines scale down significantly to ensure match data remains the focal point on smaller screens.

## Layout & Spacing
The layout philosophy centers on **High-Density Data Clarity**. 

- **Mobile:** A single-column vertical scroll of "Match Cards." Padding is tight (`md`) to maximize the number of visible fixtures.
- **Desktop:** A 12-column fluid grid that transitions into a fixed-width container at `1280px`. Sidebars are used for standings and navigation, while the center column handles the primary feed or detailed match data.
- **Spacing Rhythm:** Based on a 4px baseline. Use `16px` (md) for standard component spacing and `24px` (lg) for section separation.

## Elevation & Depth
Depth is achieved through **Tonal Layering** and **Low-Contrast Outlines** rather than traditional shadows. 

- **Level 0 (Background):** Pure black `#0a0a0a`.
- **Level 1 (Cards/Containers):** Surface `#161616`.
- **Interactivity:** Elements in a "hover" or "active" state should receive a 1px solid border using the Primary or Secondary accent colors, or a subtle lighten of the surface color. 
- **Separation:** Use thin 1px borders (`#262626`) to separate list items and table rows, maintaining a flat, architectural feel.

## Shapes
The shape language is **Soft** but disciplined. 

- **Standard Radius:** 4px (`rounded-sm`) for input fields, prediction buttons, and small UI elements.
- **Large Radius:** 8px (`rounded-lg`) for match cards and primary containers.
- **Logic:** Avoid circles or heavy rounding to maintain the professional "broadcast" aesthetic. Rectilinear shapes with minimal rounding convey precision and technical reliability.

## Components
- **Match Cards:** The core component. Features the surface color, 1px subtle border, and a clear "Prediction Zone." Scores are displayed in `headline-md`.
- **Prediction Input:** Large, tappable areas with high-contrast borders when focused. No "Points Multipliers" or "Bonus" elements.
- **Data Tables:** High-density rows for standings. Use `data-mono` for all numeric stats (P, W, D, L, GD, Pts). Row highlighting occurs on hover.
- **Action Buttons:** Primary buttons use a solid Red (`#ff3b30`) fill with white text. Secondary actions use Ghost styles with Blue (`#007aff`) outlines.
- **Chips:** Minimalist indicators for "Live," "Finished," or "Upcoming." Use a small solid circle for Live status (pulsing Primary Red).
- **Navigation:** Bottom-tab bar for mobile with high-contrast icons; sidebar for desktop.