// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AttestationRegistry} from "./AttestationRegistry.sol";
import {RuleEngine} from "./RuleEngine.sol";
import {ICleanverseCVA} from "./interfaces/ICleanverseCVA.sol";
import {ICleanverseCVI} from "./interfaces/ICleanverseCVI.sol";

contract CoffeeLotToken {
    bytes32 public constant EXPORTER_ROLE = keccak256("EXPORTER_ROLE");

    address public settlementEngine;

    struct LotMetadata {
        address exporter;
        uint256 quantity;
        bytes metadata;
    }

    ICleanverseCVI public immutable cvi;
    ICleanverseCVA public immutable cva;
    AttestationRegistry public immutable attestationRegistry;
    RuleEngine public immutable ruleEngine;

    mapping(bytes32 => LotMetadata) public lots;
    mapping(bytes32 => mapping(address => uint256)) public balances;

    event LotMinted(bytes32 indexed lotId, address indexed exporter, uint256 quantity);
    event LotTransferred(bytes32 indexed lotId, address indexed from, address indexed to, uint256 amount);

    error NotAuthorized();
    error MissingAttestation();
    error TransferNotAllowed();
    error InsufficientBalance();
    error SettlementEngineAlreadySet();

    constructor(
        address cviAddress,
        address cvaAddress,
        address attestationRegistryAddress,
        address ruleEngineAddress
    ) {
        cvi = ICleanverseCVI(cviAddress);
        cva = ICleanverseCVA(cvaAddress);
        attestationRegistry = AttestationRegistry(attestationRegistryAddress);
        ruleEngine = RuleEngine(ruleEngineAddress);
    }

    function mintLot(bytes32 lotId, uint256 quantity, bytes calldata metadata) external {
        if (!cvi.hasRole(msg.sender, EXPORTER_ROLE) || cvi.isFrozen(msg.sender)) {
            revert NotAuthorized();
        }

        AttestationRegistry.Attestation memory attestation = attestationRegistry.getAttestation(lotId);
        if (attestation.attestationId == bytes32(0)) {
            revert MissingAttestation();
        }

        cva.wrapAsset(lotId, quantity, metadata);

        lots[lotId] = LotMetadata({exporter: msg.sender, quantity: quantity, metadata: metadata});
        balances[lotId][msg.sender] += quantity;

        emit LotMinted(lotId, msg.sender, quantity);
    }

    function setSettlementEngine(address settlementEngineAddress) external {
        if (settlementEngine != address(0)) {
            revert SettlementEngineAlreadySet();
        }
        settlementEngine = settlementEngineAddress;
    }

    function transferLot(bytes32 lotId, address to, uint256 amount) external {
        _transferLot(msg.sender, to, lotId, amount);
    }

    function settlementTransferLot(
        bytes32 lotId,
        address from,
        address to,
        uint256 amount
    ) external {
        if (msg.sender != settlementEngine) {
            revert NotAuthorized();
        }
        _transferLot(from, to, lotId, amount);
    }

    function _transferLot(address from, address to, bytes32 lotId, uint256 amount) internal {
        _beforeTransfer(from, to, lotId);

        if (balances[lotId][from] < amount) {
            revert InsufficientBalance();
        }

        balances[lotId][from] -= amount;
        balances[lotId][to] += amount;

        emit LotTransferred(lotId, from, to, amount);
    }

    function _beforeTransfer(address from, address to, bytes32 lotId) internal view {
        if (!ruleEngine.checkCompliant(from, to, lotId)) {
            revert TransferNotAllowed();
        }
        if (!cva.isTransferEligible(from, to, uint256(lotId))) {
            revert TransferNotAllowed();
        }
    }
}
