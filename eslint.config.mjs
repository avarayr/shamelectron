import nextConfig from "eslint-config-next";

const config = [
    ...nextConfig,
    {
        ignores: ["lib/apps/index.ts"],
    },
];

export default config;