// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AuditLog} from "./AuditLog.sol";
import {CoffeeLotToken} from "./CoffeeLotToken.sol";

interface IERC20Like {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract SettlementEngine {
    bytes32 public constant BUYER_ROLE = keccak256("BUYER_ROLE");
    struct SettlementInstruction {
        bytes32 quoteId;
        bytes32 lotId;
        address buyer;
        address maker;
        uint256 lotAmount;
        uint256 paymentAmount;
        bytes travelRuleData;
    }

    address public rfqEngine;
    CoffeeLotToken public immutable coffeeLotToken;
    AuditLog public immutable auditLog;
    IERC20Like public immutable paymentToken;

    event TradeSettled(bytes32 indexed tradeId, bytes32 indexed quoteId, address indexed buyer, address maker);

    error NotRFQEngine();
    error RFQEngineAlreadySet();
    error PaymentTransferFailed();

    constructor(address tokenAddress, address auditLogAddress, address paymentTokenAddress) {
        coffeeLotToken = CoffeeLotToken(tokenAddress);
        auditLog = AuditLog(auditLogAddress);
        paymentToken = IERC20Like(paymentTokenAddress);
    }

    function setRFQEngine(address rfqEngineAddress) external {
        if (rfqEngine != address(0)) {
            revert RFQEngineAlreadySet();
        }
        rfqEngine = rfqEngineAddress;
    }

    function executeTrade(SettlementInstruction calldata instruction) external returns (bytes32 tradeId) {
        if (msg.sender != rfqEngine) {
            revert NotRFQEngine();
        }

        bool paymentTransferred = paymentToken.transferFrom(
            instruction.buyer,
            instruction.maker,
            instruction.paymentAmount
        );
        if (!paymentTransferred) {
            revert PaymentTransferFailed();
        }

        coffeeLotToken.settlementTransferLot(
            instruction.lotId,
            instruction.maker,
            instruction.buyer,
            instruction.lotAmount
        );

        tradeId = keccak256(
            abi.encodePacked(
                instruction.quoteId,
                instruction.buyer,
                instruction.maker,
                instruction.lotId,
                instruction.paymentAmount,
                block.timestamp
            )
        );

        bytes memory travelPayload = instruction.travelRuleData.length > 0
            ? instruction.travelRuleData
            : abi.encode(
                instruction.quoteId,
                instruction.buyer,
                instruction.maker,
                instruction.lotId,
                instruction.lotAmount,
                instruction.paymentAmount,
                block.timestamp
            );

        auditLog.recordTrade(
            tradeId,
            instruction.quoteId,
            instruction.buyer,
            instruction.maker,
            travelPayload
        );

        emit TradeSettled(tradeId, instruction.quoteId, instruction.buyer, instruction.maker);
    }
}
