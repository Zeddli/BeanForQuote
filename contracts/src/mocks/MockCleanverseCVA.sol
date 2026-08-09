// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ICleanverseCVA} from "../interfaces/ICleanverseCVA.sol";

contract MockCleanverseCVA is ICleanverseCVA {
    bool public transferEligible = true;
    bytes32 public lastLotId;
    uint256 public lastAmount;
    bytes public lastMetadata;

    function setTransferEligible(bool eligible) external {
        transferEligible = eligible;
    }

    function wrapAsset(bytes32 lotId, uint256 amount, bytes calldata metadata) external returns (uint256) {
        lastLotId = lotId;
        lastAmount = amount;
        lastMetadata = metadata;
        return uint256(lotId);
    }

    function isTransferEligible(address, address, uint256) external view returns (bool) {
        return transferEligible;
    }
}
