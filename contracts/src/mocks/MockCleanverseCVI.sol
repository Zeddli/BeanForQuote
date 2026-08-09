// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ICleanverseCVI} from "../interfaces/ICleanverseCVI.sol";

contract MockCleanverseCVI is ICleanverseCVI {
    mapping(address => mapping(bytes32 => bool)) public roles;
    mapping(address => bool) public frozen;

    function setRole(address wallet, bytes32 role, bool enabled) external {
        roles[wallet][role] = enabled;
    }

    function setFrozen(address wallet, bool frozenStatus) external {
        frozen[wallet] = frozenStatus;
    }

    function hasRole(address wallet, bytes32 role) external view returns (bool) {
        return roles[wallet][role];
    }

    function isFrozen(address wallet) external view returns (bool) {
        return frozen[wallet];
    }
}
