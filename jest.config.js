module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "babel-jest",
      {
        presets: ["@babel/preset-typescript"],
        plugins: ["@babel/plugin-transform-modules-commonjs"]
      }
    ]
  },
  testMatch: ["**/__tests__/**/*.test.js"],
  modulePathIgnorePatterns: ["<rootDir>/.claude/", "<rootDir>/dist/", "<rootDir>/build/"],
  moduleFileExtensions: ["ts", "tsx", "js", "json"]
}
