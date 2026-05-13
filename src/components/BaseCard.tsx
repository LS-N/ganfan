import React from "react"
import { StyleSheet, View, ViewProps } from "react-native"
import { colors, radius, spacing } from "../styles/tokens"

type BaseCardProps = ViewProps & {
  children: React.ReactNode
}

export function BaseCard({ children, style, ...props }: BaseCardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg
  }
})
