// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ICleanverseCVI} from "./interfaces/ICleanverseCVI.sol";

contract RuleEngine {
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    struct JurisdictionRule {
        bool isSet;
        bool allowed;
    }

    ICleanverseCVI public immutable cvi;

    mapping(address => bool) public flaggedWallets;
    mapping(bytes32 => bool) public frozenLots;
    mapping(bytes32 => JurisdictionRule) public jurisdictionRules;

    event WalletFlagged(address indexed wallet, bool flagged);
    event LotFrozen(bytes32 indexed lotId, bool frozen);
    event JurisdictionRuleSet(bytes32 indexed ruleId, bool allowed);

    error NotAuthorized();

    constructor(address cviAddress) {
        cvi = ICleanverseCVI(cviAddress);
    }

    function setJurisdictionRule(bytes32 ruleId, bool allowed) external {
        _requireRegulator();
        jurisdictionRules[ruleId] = JurisdictionRule({isSet: true, allowed: allowed});
        emit JurisdictionRuleSet(ruleId, allowed);
    }

    function flagWallet(address wallet) external {
        _requireRegulator();
        flaggedWallets[wallet] = true;
        emit WalletFlagged(wallet, true);
    }

    function unflagWallet(address wallet) external {
        _requireRegulator();
        flaggedWallets[wallet] = false;
        emit WalletFlagged(wallet, false);
    }

    function freezeLot(bytes32 lotId) external {
        _requireRegulator();
        frozenLots[lotId] = true;
        emit LotFrozen(lotId, true);
    }

    function unfreeze(bytes32 lotId) external {
        _requireRegulator();
        frozenLots[lotId] = false;
        emit LotFrozen(lotId, false);
    }

    function checkCompliant(address walletA, address walletB, bytes32 lotId) external view returns (bool) {
        if (flaggedWallets[walletA] || flaggedWallets[walletB]) return false;
        if (frozenLots[lotId]) return false;
        if (cvi.isFrozen(walletA) || cvi.isFrozen(walletB)) return false;
        return true;
    }

    function _requireRegulator() internal view {
        if (!cvi.hasRole(msg.sender, REGULATOR_ROLE) || cvi.isFrozen(msg.sender)) {
            revert NotAuthorized();
        }
    }
}
