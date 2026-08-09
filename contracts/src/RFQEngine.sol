// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {CoffeeLotToken} from "./CoffeeLotToken.sol";
import {RuleEngine} from "./RuleEngine.sol";
import {SettlementEngine} from "./SettlementEngine.sol";
import {ICleanverseCVI} from "./interfaces/ICleanverseCVI.sol";

contract RFQEngine {
    bytes32 public constant BUYER_ROLE = keccak256("BUYER_ROLE");
    bytes32 public constant MARKET_MAKER_ROLE = keccak256("MARKET_MAKER_ROLE");

    enum RFQStatus {
        Open,
        Quoted,
        Accepted,
        Settled,
        Expired
    }

    struct RFQ {
        bytes32 rfqId;
        address buyer;
        bytes32 lotId;
        uint256 quantity;
        uint256 expiry;
        RFQStatus status;
    }

    struct Quote {
        bytes32 quoteId;
        bytes32 rfqId;
        address maker;
        uint256 price;
        uint256 expiry;
        bool accepted;
    }

    ICleanverseCVI public immutable cvi;
    RuleEngine public immutable ruleEngine;
    CoffeeLotToken public immutable token;
    SettlementEngine public immutable settlementEngine;

    mapping(bytes32 => RFQ) public rfqs;
    mapping(bytes32 => Quote) public quotes;

    event RFQSubmitted(bytes32 indexed rfqId, address indexed buyer, bytes32 indexed lotId);
    event QuoteSubmitted(bytes32 indexed quoteId, bytes32 indexed rfqId, address indexed maker);
    event QuoteAccepted(bytes32 indexed quoteId, bytes32 indexed rfqId, address indexed buyer);

    error NotAuthorized();
    error InvalidExpiry();
    error RFQNotOpen();
    error QuoteExpired();
    error QuoteNotFound();
    error NotRFQBuyer();
    error LotFrozen();
    error NonCompliant();

    constructor(
        address cviAddress,
        address ruleEngineAddress,
        address tokenAddress,
        address settlementEngineAddress
    ) {
        cvi = ICleanverseCVI(cviAddress);
        ruleEngine = RuleEngine(ruleEngineAddress);
        token = CoffeeLotToken(tokenAddress);
        settlementEngine = SettlementEngine(settlementEngineAddress);
    }

    function submitRFQ(bytes32 lotId, uint256 quantity, uint256 expiry) external returns (bytes32 rfqId) {
        if (!cvi.hasRole(msg.sender, BUYER_ROLE) || cvi.isFrozen(msg.sender)) {
            revert NotAuthorized();
        }
        if (expiry <= block.timestamp) {
            revert InvalidExpiry();
        }
        if (ruleEngine.frozenLots(lotId)) {
            revert LotFrozen();
        }

        rfqId = keccak256(abi.encodePacked(msg.sender, lotId, quantity, expiry, block.timestamp));
        rfqs[rfqId] = RFQ({
            rfqId: rfqId,
            buyer: msg.sender,
            lotId: lotId,
            quantity: quantity,
            expiry: expiry,
            status: RFQStatus.Open
        });

        emit RFQSubmitted(rfqId, msg.sender, lotId);
    }

    function submitQuote(
        bytes32 rfqId,
        uint256 price,
        uint256 expiry
    ) external returns (bytes32 quoteId) {
        if (!cvi.hasRole(msg.sender, MARKET_MAKER_ROLE) || cvi.isFrozen(msg.sender)) {
            revert NotAuthorized();
        }

        RFQ storage rfq = rfqs[rfqId];
        if (rfq.rfqId == bytes32(0)) {
            revert RFQNotOpen();
        }
        if (rfq.status != RFQStatus.Open && rfq.status != RFQStatus.Quoted) {
            revert RFQNotOpen();
        }
        if (rfq.expiry <= block.timestamp || expiry <= block.timestamp) {
            revert InvalidExpiry();
        }
        if (ruleEngine.frozenLots(rfq.lotId)) {
            revert LotFrozen();
        }

        quoteId = keccak256(abi.encodePacked(rfqId, msg.sender, price, expiry, block.timestamp));
        quotes[quoteId] = Quote({
            quoteId: quoteId,
            rfqId: rfqId,
            maker: msg.sender,
            price: price,
            expiry: expiry,
            accepted: false
        });
        rfq.status = RFQStatus.Quoted;

        emit QuoteSubmitted(quoteId, rfqId, msg.sender);
    }

    function acceptQuote(bytes32 quoteId) external {
        Quote storage quote = quotes[quoteId];
        if (quote.quoteId == bytes32(0)) {
            revert QuoteNotFound();
        }
        if (quote.expiry < block.timestamp) {
            revert QuoteExpired();
        }

        RFQ storage rfq = rfqs[quote.rfqId];
        if (rfq.buyer != msg.sender) {
            revert NotRFQBuyer();
        }
        if (rfq.status != RFQStatus.Quoted && rfq.status != RFQStatus.Open) {
            revert RFQNotOpen();
        }
        if (!ruleEngine.checkCompliant(rfq.buyer, quote.maker, rfq.lotId)) {
            revert NonCompliant();
        }

        quote.accepted = true;
        rfq.status = RFQStatus.Accepted;

        emit QuoteAccepted(quoteId, quote.rfqId, msg.sender);

        SettlementEngine.SettlementInstruction memory instruction = SettlementEngine
            .SettlementInstruction({
                quoteId: quote.quoteId,
                lotId: rfq.lotId,
                buyer: rfq.buyer,
                maker: quote.maker,
                lotAmount: rfq.quantity,
                paymentAmount: quote.price,
                travelRuleData: ""
            });

        settlementEngine.executeTrade(instruction);
        rfq.status = RFQStatus.Settled;
    }
}
