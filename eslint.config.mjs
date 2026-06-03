import js from "@eslint/js"
import tseslint from "typescript-eslint"

const tsconfigRootDir = import.meta.dirname

export default [
  {
    ignores: [
      "node_modules/",
      ".expo/",
      ".claude/",
      ".netlify/",
      ".netlify-publish/",
      "dist/",
      "build/",
      "coverage/",
      "docs/prototype/assets/"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir
      }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^React$"
        }
      ]
    }
  },
  {
    files: ["jest.config.js"],
    languageOptions: {
      globals: {
        module: "readonly"
      }
    }
  },
  {
    files: ["scripts/**/*.{js,mjs}"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly"
      }
    }
  },
  {
    files: ["**/__tests__/**/*.test.js"],
    languageOptions: {
      globals: {
        beforeEach: "readonly",
        describe: "readonly",
        expect: "readonly",
        jest: "readonly",
        require: "readonly",
        test: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  }
]
