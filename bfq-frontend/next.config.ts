import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: [
    "@reown/appkit",
    "@reown/appkit-adapter-wagmi",
    "@coinbase/cdp-sdk",
    "pino",
    "thread-stream",
  ],
};

export default nextConfig;
