import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: [
    "@reown/appkit",
    "@reown/appkit-adapter-wagmi",
    "@coinbase/cdp-sdk",
    "pino",
    "thread-stream",
  ],
};

export default nextConfig;
