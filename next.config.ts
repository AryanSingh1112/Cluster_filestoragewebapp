import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "100MB",
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cdn.freepik.com",
            },
            {
                protocol: "https",
                hostname: "cloud.appwrite.io",
            },
            {
                protocol: "https",
                hostname: "th.bing.com", // This line was already added
            },
        ],
    },
};

export default nextConfig;
