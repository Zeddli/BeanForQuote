export interface ValidatorRule {
  allowed_group: string;
  allowed_sub_group: string;
  min_tier: number;
  min_sub_tier: number;
  is_black_list?: boolean;
  countries?: string[];
}

export interface ValidatorRegisterRequest {
  chain: string;
  contract_address: string;
  rule: ValidatorRule;
  owner_signature: string;
}

export interface ValidatorRegisterResponse {
  code: string;
  message: string;
  data?: {
    chain: string;
    contract_address: string;
    tx_hash: string;
  };
}

export interface ValidatorIsRegisterRequest {
  chain: string;
  contract_address: string;
}

export interface ValidatorIsRegisterResponse {
  code: string;
  message: string;
  data?: {
    chain: string;
    contract_address: string;
    registered: boolean;
  };
}
