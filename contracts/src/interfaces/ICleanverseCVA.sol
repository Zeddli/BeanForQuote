// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface ICleanverseCVA {
    function wrapAsset(bytes32 lotId, uint256 amount, bytes calldata metadata) external returns (uint256);
    function isTransferEligible(address from, address to, uint256 tokenId) external view returns (bool);
}
