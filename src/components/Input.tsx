import React from "react"
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native"
import { colors, radius, size, spacing, typography } from "../theme"

type InputProps = TextInputProps & {
  label?: string
  error?: string
  helperText?: string
}

export function Input({ error, helperText, label, style, ...props }: InputProps) {
  const help = error ?? helperText

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {help ? <Text style={[styles.helper, error && styles.errorText]}>{help}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold
  },
  input: {
    minHeight: size.controlLg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    fontSize: typography.size.base
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSurface
  },
  helper: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.tight
  },
  errorText: {
    color: colors.danger,
    fontWeight: typography.weight.semibold
  }
})
