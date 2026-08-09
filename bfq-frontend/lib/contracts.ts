export const MONAD_TESTNET_CONFIG = {
  chainId: 10143,
  chainName: "Monad Testnet",
  rpcUrl: "https://testnet-rpc.monad.xyz",
  explorerUrl: "https://testnet.monadscan.com",
} as const;

export const AUDITOR_ADDRESS = (process.env.NEXT_PUBLIC_AUDITOR_ADDRESS || "0xfc9dCa8fCdD0B6D6347462b5C6306ECa1FD79a55") as `0x${string}`;

export const CONTRACT_ADDRESSES = {
  cleanverseCviAdapter: "0x1c5fa313efc3868e0396532f92c163c02c148d6d",
  mockCleanverseCva: "0xcfb4dd97d787c8818247ff4a77fe31208abfdc3a",
  attestationRegistry: "0xf76a2decdd3dca42c6f95d5c3148c6e2accd42c4",
  custodyRegistry: "0x7bd85132c3befaefca9b4b870073453714dfa362",
  ruleEngine: "0x157209a3bc4100723e0d302f6163f1ec410bae66",
  coffeeLotToken: "0xab06536d0f182db3c54f6e1d7503d5ddd489dc84",
  auditLog: "0xd169c004f7a20fdba82dafd15c3e2c080f3b92a8",
  settlementEngine: "0xed26a56ab4daf8f5a36a039e179ed4938fc976e8",
  rfqEngine: "0x4a56d24fbb25769f1c2e9aaef0d2d756a2a5fa6e",
  validatorPool: "0x2155cf30AB82DBdB074bB1B9222E4e33B422532C",
  ausdcAddress: "0xaC0893567D43C3E7e6e35a72803df05416C1f20D",
} as const;

export const DEMO_WALLETS = {
  exporter: {
    label: "Finca Verde Cooperative (Exporter)",
    address: "0xD06178216134c059BF17c4D3dD60CCD36074edfd",
    role: "exporter",
    subGroup: "EX",
    country: "CO",
  },
  buyer: {
    label: "Nordlicht Roasters (Buyer)",
    address: "0x9703f29Ab27a1D72502cfeDFc739d26aA41abF88",
    role: "buyer",
    subGroup: "BY",
    country: "DE",
  },
  makerA: {
    label: "Market Maker Alpha",
    address: "0xcA3DC1C67a7da6e8ac1A4c89b19350fE5059EAEe",
    role: "maker",
    subGroup: "MM",
    country: "SG",
  },
  makerB: {
    label: "Market Maker Beta",
    address: "0xe363CdAD20d73D91Fa43DB35FdaA432B863F56d9",
    role: "maker",
    subGroup: "MM",
    country: "SG",
  },
  makerC: {
    label: "Market Maker Gamma",
    address: "0x658A0dDaECBc2a662168c21AB02e983b722f5a37",
    role: "maker",
    subGroup: "MM",
    country: "US",
  },
  inspector: {
    label: "Quality Inspector",
    address: "0xe2690d943008be679A6eC7aBFe84dFCB1935095c",
    role: "inspector",
    subGroup: "QI",
    country: "CO",
  },
  regulator: {
    label: "Regulator Admin",
    address: "0x67C8d12801E00d86d71D0B17b9aa15B7d2498d4a",
    role: "regulator",
    subGroup: "RG",
    country: "US",
  },
  auditor: {
    label: "Auditor Admin",
    address: "0xfc9dCa8fCdD0B6D6347462b5C6306ECa1FD79a55",
    role: "auditor",
    subGroup: "AU",
    country: "US",
  },
} as const;
