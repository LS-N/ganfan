import js from "@eslint/js"
import tseslint from "typescript-eslint"

export default [
  {
    ignores: ["node_modules/", ".expo/", "dist/", "build/", "coverage/"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^React$"
        }
      ]
    }
  }
]
