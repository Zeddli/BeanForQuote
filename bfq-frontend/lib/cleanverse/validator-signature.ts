import { hashMessage } from "viem";
import { privateKeyToAccount } from "viem/accounts";

function normalizeHexAddress(address: string) {
  return address.toLowerCase();
}

export function buildValidatorOwnerMessage(chain: string, contractAddress: string) {
  return `${chain.toLowerCase()}${normalizeHexAddress(contractAddress)}`;
}

export async function signValidatorOwnerMessage(
  chain: string,
  contractAddress: string,
  privateKey: `0x${string}`,
) {
  const account = privateKeyToAccount(privateKey);
  const message = buildValidatorOwnerMessage(chain, contractAddress);
  const signature = await account.signMessage({ message });

  return {
    signer: account.address,
    message,
    messageHash: hashMessage(message),
    signature,
  };
}
