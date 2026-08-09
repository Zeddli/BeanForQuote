// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract AuditLog {
    struct TradeRecord {
        bytes32 tradeId;
        bytes32 quoteId;
        address buyer;
        address maker;
        uint256 settledAt;
        bytes travelRuleData;
    }

    address public settlementEngine;
    mapping(bytes32 => TradeRecord) public trades;

    event TradeRecorded(bytes32 indexed tradeId, bytes32 indexed quoteId, address indexed buyer, address maker);

    error NotSettlementEngine();
    error SettlementEngineAlreadySet();

    function setSettlementEngine(address settlementEngineAddress) external {
        if (settlementEngine != address(0)) {
            revert SettlementEngineAlreadySet();
        }
        settlementEngine = settlementEngineAddress;
    }

    function recordTrade(
        bytes32 tradeId,
        bytes32 quoteId,
        address buyer,
        address maker,
        bytes calldata travelRuleData
    ) external {
        if (msg.sender != settlementEngine) {
            revert NotSettlementEngine();
        }

        trades[tradeId] = TradeRecord({
            tradeId: tradeId,
            quoteId: quoteId,
            buyer: buyer,
            maker: maker,
            settledAt: block.timestamp,
            travelRuleData: travelRuleData
        });

        emit TradeRecorded(tradeId, quoteId, buyer, maker);
    }
}
