// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface ICleanverseCVI {
    function hasRole(address wallet, bytes32 role) external view returns (bool);
    function isFrozen(address wallet) external view returns (bool);
}
