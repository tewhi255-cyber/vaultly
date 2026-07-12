const nextJest = require("next/jest")
const createJestConfig = nextJest({ dir: "./" })
const config = {
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  transform: { "^.+\\.tsx?$": ["ts-jest", { useESM: true }] },
  extensionsToTreatAsEsm: [".ts"],
  transformIgnorePatterns: [],
}
module.exports = createJestConfig(config)
