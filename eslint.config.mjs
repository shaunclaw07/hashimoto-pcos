import nextConfig from "eslint-config-next/core-web-vitals";

export default [
  ...nextConfig,
  {
    rules: {
      // react-hooks/set-state-in-effect is a new error in eslint-config-next@16
      // (did not exist in the eslint-config-next@14 baseline). Downgraded to warn
      // to avoid blocking the build while keeping visibility of the pattern.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // Enforce: src/core/ must NOT import from infrastructure/, app/, or lib/
    files: ["src/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/infrastructure/**", "**/app/**", "**/lib/**", "better-sqlite3", "next/*"],
              message:
                "core/ must not depend on infrastructure/, app/, lib/, or framework packages.",
            },
          ],
        },
      ],
    },
  },
];
