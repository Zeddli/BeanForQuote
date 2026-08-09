import type {
  ApassStatusView,
  CleanverseQueryApassResponse,
  CleanverseValidatorVerifyResponse,
} from "@/lib/cleanverse/types";

export function normalizeApassStatus(response: CleanverseQueryApassResponse): ApassStatusView {
  const data = response.data;
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = data?.expirationTime ?? null;
  const frozen = data?.status === 2;
  const expired = typeof expiresAt === "number" ? expiresAt <= now : true;

  return {
    active: response.code === "0000" && !!data && data.status === 1 && !expired,
    frozen,
    expired,
    expiresAt,
    attributes: {
      tier: data?.tier ?? null,
      subTier: data?.subTier ?? null,
      group: data?.group ?? null,
      subGroup: data?.subGroup ?? null,
      countries: data?.countries ?? [],
      cvRecordId: data?.cvRecordId ?? null,
      currentKycHash: data?.currentKycHash ?? null,
    },
  };
}

export function normalizeValidatorVerify(response: CleanverseValidatorVerifyResponse) {
  return {
    success: response.code === "0000",
    valid: response.data?.valid ?? false,
    message: response.message,
    data: response.data ?? null,
  };
}
