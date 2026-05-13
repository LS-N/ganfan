export const colors = {
  background: "#FAF7F2",
  surface: "#FFFEF9",
  surfaceRaised: "#FFFFFF",
  textPrimary: "#1A1612",
  textSecondary: "#7A6E66",
  textMuted: "#C5BDB5",
  textInverse: "#FFFFFF",
  border: "#EDE8E1",
  borderStrong: "#D9CEC4",
  success: "#2D6A4F",
  successSurface: "#EBF5EF",
  warning: "#D4860A",
  warningSurface: "#FEF6E4",
  danger: "#C0392B",
  dangerSurface: "#FDECEA",
  brand: "#E85D26",
  brandPressed: "#C44D1F",
  brandSurface: "#FFF0E9",
  overlay: "rgba(26,22,18,.54)",
  overlayLight: "rgba(255,255,255,.78)",
  cameraSurface: "#111111",
  cameraPanel: "#151515"
} as const

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40
} as const

export const radius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999
} as const

export const typography = {
  family: {
    sans: undefined
  },
  size: {
    xxs: 10,
    xs: 11,
    sm: 12,
    md: 13,
    base: 14,
    lg: 15,
    xl: 17,
    titleSm: 18,
    titleMd: 20,
    titleLg: 24,
    displaySm: 28,
    displayMd: 30,
    displayLg: 36
  },
  lineHeight: {
    tight: 18,
    sm: 20,
    md: 22,
    lg: 27,
    titleSm: 30,
    titleMd: 35,
    titleLg: 38
  },
  weight: {
    regular: "400",
    medium: "600",
    semibold: "700",
    bold: "800",
    black: "900"
  }
} as const

export const opacity = {
  disabled: 0.48,
  muted: 0.72,
  pressed: 0.86,
  invisible: 0
} as const

export const size = {
  controlSm: 42,
  controlMd: 50,
  controlLg: 56,
  touchTarget: 44,
  mobileMaxWidth: 430,
  bottomChrome: 90
} as const

export const shadow = {
  none: {},
  card: {
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  raised: {
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  }
} as const

export const zIndex = {
  base: 0,
  chrome: 10,
  modal: 100
} as const

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  opacity,
  size,
  shadow,
  zIndex
} as const
