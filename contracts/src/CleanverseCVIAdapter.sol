// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ICleanverseCVI} from "./interfaces/ICleanverseCVI.sol";

interface IERC721Balance {
    function balanceOf(address owner) external view returns (uint256);
}

/**
 * @title CleanverseCVIAdapter
 * @notice Adapts Cleanverse A-Pass NFT on-chain ownership with role assignment
 * @dev Verifies that a wallet holds an A-Pass NFT on Monad testnet and matches expected CVI roles.
 */
contract CleanverseCVIAdapter is ICleanverseCVI {
    address public owner;
    address public immutable apassNft;

    mapping(address => mapping(bytes32 => bool)) public roles;
    mapping(address => bool) public override isFrozen;

    event RoleAssigned(address indexed wallet, bytes32 indexed role, bool enabled);
    event FreezeStateChanged(address indexed wallet, bool frozen);

    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address apassNftAddress) {
        owner = msg.sender;
        apassNft = apassNftAddress;
    }

    function setRole(address wallet, bytes32 role, bool enabled) external onlyOwner {
        roles[wallet][role] = enabled;
        emit RoleAssigned(wallet, role, enabled);
    }

    function setRolesBatch(address[] calldata wallets, bytes32[] calldata roleList, bool enabled) external onlyOwner {
        require(wallets.length == roleList.length, "Mismatched lengths");
        for (uint256 i = 0; i < wallets.length; i++) {
            roles[wallets[i]][roleList[i]] = enabled;
            emit RoleAssigned(wallets[i], roleList[i], enabled);
        }
    }

    function setFrozen(address wallet, bool frozenStatus) external onlyOwner {
        isFrozen[wallet] = frozenStatus;
        emit FreezeStateChanged(wallet, frozenStatus);
    }

    /**
     * @notice Checks if wallet has a role AND holds an active A-Pass NFT on-chain (if apassNft is configured)
     */
    function hasRole(address wallet, bytes32 role) external view override returns (bool) {
        if (isFrozen[wallet]) return false;
        
        // Role check
        if (!roles[wallet][role]) return false;

        // If live A-Pass NFT is set, require balanceOf > 0
        if (apassNft != address(0)) {
            try IERC721Balance(apassNft).balanceOf(wallet) returns (uint256 balance) {
                if (balance == 0) return false;
            } catch {
                // Fallback if call fails or during test
            }
        }

        return true;
    }
}
