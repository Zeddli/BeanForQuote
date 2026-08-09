export interface CleanverseQueryApassRequest {
  chain: string;
  address: string;
}

export interface CleanverseQueryApassResponse {
  code: string;
  message: string;
  data?: {
    cvRecordId: string;
    subTier: number;
    tier: string;
    status: number;
    expirationTime: number;
    subGroup: string;
    currentKycHash: string;
    group: string;
    countries: string[];
  };
}

export interface CleanverseValidatorVerifyRequest {
  chain: string;
  contract_address: string;
  user_address: string;
}

export interface CleanverseValidatorVerifyResponse {
  code: string;
  message: string;
  data?: {
    chain: string;
    contract_address: string;
    user_address: string;
    valid: boolean;
  };
}

export interface ApassStatusView {
  active: boolean;
  frozen: boolean;
  expired: boolean;
  expiresAt: number | null;
  attributes: {
    tier: string | null;
    subTier: number | null;
    group: string | null;
    subGroup: string | null;
    countries: string[];
    cvRecordId: string | null;
    currentKycHash: string | null;
  };
}

export interface CleanverseIdentityData {
  idType: "ID_CARD" | "PASSPORT" | "DRIVER_LICENSE" | "HK_MACAO_TAIWAN_PASS" | "RESIDENCE_PERMIT";
  fullName: string;
  idNumber?: string;
  validUntil?: string;
  issuingCountryISO2: string;
}

export interface CleanverseGenerateApassRequest {
  customerId: string;         // ≥12 chars, A-Za-z0-9 only — no hyphens/underscores
  expirationTime: number;     // Unix timestamp seconds
  wallet: { address: string; chain: string };
  identityDataList?: CleanverseIdentityData[];
  subTier?: number;           // 1–99
  subGroup?: string;          // 2 letters, case-sensitive
  override?: boolean;
  kycSource?: string;
  kycId?: string;
}

export interface CleanverseGenerateApassResponse {
  code: string;
  message: string;
  data?: {
    customerId: string;
    cvRecordId: string;
    tier: string;
    wallet: {
      operate: string;
      address: string;
      chain: string;
      txHash: string;
      depositUSDCWallet: string;
      depositUSDTWallet: string;
    };
  };
}
