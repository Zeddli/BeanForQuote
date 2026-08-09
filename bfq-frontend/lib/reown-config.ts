import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { defineChain } from "viem";

// Define Monad Testnet for ReOwn AppKit & Wagmi
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monadscan",
      url: "https://testnet.monadscan.com",
    },
  },
});

// Project ID for ReOwn AppKit (WalletConnect)
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "8e062283083cfc68461ab79679612345";

// Create Wagmi Adapter with SSR enabled
export const wagmiAdapter = new WagmiAdapter({
  networks: [monadTestnet],
  projectId,
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Initialize ReOwn AppKit globally for SSR and Client hydration
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [monadTestnet],
  projectId,
  metadata: {
    name: "BeanForQuote — CoffeeRFQ",
    description: "Compliant Price Discovery & RFQ Settlement Layer on Monad",
    url: "https://beanforquote.com",
    icons: ["https://avatars.githubusercontent.com/u/10143"],
  },
  features: {
    analytics: false,
  },
});
