import { decryptCleanversePayload, encryptCleanversePayload } from "@/lib/cleanverse/aes";
import { getCleanverseConfig } from "@/lib/cleanverse/config";
import type {
  CleanverseGenerateApassRequest,
  CleanverseGenerateApassResponse,
  CleanverseQueryApassRequest,
  CleanverseQueryApassResponse,
  CleanverseValidatorVerifyRequest,
  CleanverseValidatorVerifyResponse,
} from "@/lib/cleanverse/types";
import type {
  ValidatorIsRegisterRequest,
  ValidatorIsRegisterResponse,
  ValidatorRegisterRequest,
  ValidatorRegisterResponse,
} from "@/lib/cleanverse/validator-types";

async function postJson<TResponse>(path: string, body: unknown) {
  const config = getCleanverseConfig();
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-id": config.apiId,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Cleanverse request failed with HTTP ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export async function generateApass(
  request: CleanverseGenerateApassRequest,
): Promise<CleanverseGenerateApassResponse> {
  return encryptedRoundTripExample<CleanverseGenerateApassResponse>("/generate_apass", request);
}

export async function queryApass(
  request: CleanverseQueryApassRequest,
): Promise<CleanverseQueryApassResponse> {
  return postJson<CleanverseQueryApassResponse>("/query_apass", request);
}

export async function queryDepositAddress(request: { chain: string; address: string }): Promise<any> {
  return postJson<any>("/query_deposit_address", request);
}

export async function validatorVerify(
  request: CleanverseValidatorVerifyRequest,
): Promise<CleanverseValidatorVerifyResponse> {
  return postJson<CleanverseValidatorVerifyResponse>("/validator/verify", request);
}

export async function validatorIsRegister(
  request: ValidatorIsRegisterRequest,
): Promise<ValidatorIsRegisterResponse> {
  return postJson<ValidatorIsRegisterResponse>("/validator/is_register", request);
}

export async function validatorRegister(
  request: ValidatorRegisterRequest,
): Promise<ValidatorRegisterResponse> {
  return encryptedRoundTripExample<ValidatorRegisterResponse>("/validator/register", request);
}

export async function encryptedRoundTripExample<T>(path: string, payload: unknown): Promise<T> {
  const config = getCleanverseConfig();
  const encrypted = encryptCleanversePayload(payload, config.apiKeyBase64);
  const response = await postJson<{ data?: string | null } & T>(path, { data: encrypted });

  if (typeof response.data === "string" && response.data.length > 0) {
    return decryptCleanversePayload<T>(response.data, config.apiKeyBase64);
  }

  return response as T;
}
