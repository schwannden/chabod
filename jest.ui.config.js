/** @type {import('jest').Config} */
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  testMatch: ["<rootDir>/tests/ui/**/*.test.tsx", "<rootDir>/tests/ui/**/*.spec.tsx"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/main.tsx",
    "!src/vite-env.d.ts",
    "!src/components/ui/**/*.{ts,tsx}", // Exclude shadcn components
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/ui-setup.ts"],
  testTimeout: 10000,
  maxWorkers: "50%",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  verbose: true,
  // Handle module mapping and static assets
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/tests/__mocks__/fileMock.js",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "./tsconfig.test.json",
      },
    ],
  },
};
