import React from "react"
import { StyleSheet, View, ViewProps } from "react-native"
import { colors, radius, shadow, spacing } from "../theme"

type BaseCardProps = ViewProps & {
  children: React.ReactNode
  padding?: "none" | "sm" | "md" | "lg"
  tone?: "default" | "brand" | "success" | "warning" | "danger"
  elevated?: boolean
}

export function BaseCard({ children, elevated, padding = "lg", style, tone = "default", ...props }: BaseCardProps) {
  return (
    <View style={[styles.card, styles[`padding_${padding}`], styles[`tone_${tone}`], elevated && styles.elevated, style]} {...props}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md
  },
  elevated: {
    ...shadow.card
  },
  padding_none: {
    padding: 0
  },
  padding_sm: {
    padding: spacing.sm
  },
  padding_md: {
    padding: spacing.md
  },
  padding_lg: {
    padding: spacing.lg
  },
  tone_default: {
    backgroundColor: colors.surface
  },
  tone_brand: {
    backgroundColor: colors.brandSurface
  },
  tone_success: {
    backgroundColor: colors.successSurface
  },
  tone_warning: {
    backgroundColor: colors.warningSurface
  },
  tone_danger: {
    backgroundColor: colors.dangerSurface
  }
})
