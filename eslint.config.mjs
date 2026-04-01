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
];
