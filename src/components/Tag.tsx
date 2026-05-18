import React from "react"
import { StyleSheet, Text, TextProps } from "react-native"
import { colors, radius, spacing, typography } from "../theme"

type TagProps = TextProps & {
  children: React.ReactNode
  tone?: "default" | "brand" | "success" | "warning" | "danger"
}

export function Tag({ children, style, tone = "default", ...props }: TagProps) {
  return (
    <Text style={[styles.tag, styles[`tone_${tone}`], style]} {...props}>
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    overflow: "hidden",
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold
  },
  tone_default: {
    color: colors.textSecondary,
    backgroundColor: colors.border
  },
  tone_brand: {
    color: colors.brand,
    backgroundColor: colors.brandSurface
  },
  tone_success: {
    color: colors.success,
    backgroundColor: colors.successSurface
  },
  tone_warning: {
    color: colors.warning,
    backgroundColor: colors.warningSurface
  },
  tone_danger: {
    color: colors.danger,
    backgroundColor: colors.dangerSurface
  }
})
