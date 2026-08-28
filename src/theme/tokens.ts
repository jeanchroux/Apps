/**
 * Design tokens for Aria.
 * Aesthetic reference: Kinfolk / Vogue editorial — deep charcoal, cream,
 * subtle gold/copper accents, generous negative space, hairline borders.
 */

export const palette = {
  // Neutrals
  cream: "#F7F3EC",
  paper: "#FBF9F5",
  charcoal: "#1C1B19",
  ink: "#111110",
  stone: "#8A8477",
  fog: "#D9D3C7",
  hairline: "#E4DFD3",
  hairlineDark: "#33312C",

  // Accents
  gold: "#B08D57",
  copper: "#A9612F",
  goldMuted: "#C9AD7F",

  // Semantic
  success: "#4C7A5C",
  warning: "#B0762E",
  danger: "#A23E3E",
  lgbtq: "#C9527B"
} as const;

export const lightTheme = {
  mode: "light" as const,
  background: palette.cream,
  surface: palette.paper,
  surfaceElevated: "#FFFFFF",
  textPrimary: palette.charcoal,
  textSecondary: palette.stone,
  textInverse: palette.cream,
  border: palette.hairline,
  accent: palette.gold,
  accentSecondary: palette.copper,
  tabBarBackground: "rgba(251, 249, 245, 0.94)",
  overlay: "rgba(17, 17, 16, 0.55)"
};

export const darkTheme = {
  mode: "dark" as const,
  background: palette.ink,
  surface: "#1C1B19",
  surfaceElevated: "#242320",
  textPrimary: palette.cream,
  textSecondary: "#A79E8C",
  textInverse: palette.ink,
  border: palette.hairlineDark,
  accent: palette.goldMuted,
  accentSecondary: palette.copper,
  tabBarBackground: "rgba(17, 17, 16, 0.9)",
  overlay: "rgba(0, 0, 0, 0.65)"
};

export type Theme = typeof lightTheme | typeof darkTheme;

export const fonts = {
  // Editorial serif for headlines / display
  display: "PlayfairDisplay_600SemiBold",
  displayItalic: "PlayfairDisplay_600SemiBold_Italic",
  headline: "Fraunces_500Medium",
  // Clean sans for body / UI
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold"
};

export const type = {
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, letterSpacing: 0.2 },
  h1: { fontFamily: fonts.headline, fontSize: 26, lineHeight: 32 },
  h2: { fontFamily: fonts.headline, fontSize: 20, lineHeight: 26 },
  h3: { fontFamily: fonts.headline, fontSize: 17, lineHeight: 22 },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: "uppercase" as const
  },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodySmall: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16 }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const radius = {
  none: 0,
  sm: 2,
  md: 6,
  lg: 12,
  pill: 999
};
