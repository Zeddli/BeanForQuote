function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getCleanverseConfig() {
  return {
    baseUrl: requiredEnv("CLEANVERSE_BASE_URL"),
    apiId: requiredEnv("CLEANVERSE_API_ID"),
    apiKeyBase64: requiredEnv("CLEANVERSE_API_KEY_BASE64"),
    validatorOwnerPrivateKey: process.env.CLEANVERSE_VALIDATOR_OWNER_PRIVATE_KEY as
      | `0x${string}`
      | undefined,
  };
}
