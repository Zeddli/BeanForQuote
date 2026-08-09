// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import {AttestationRegistry} from "../src/AttestationRegistry.sol";
import {AuditLog} from "../src/AuditLog.sol";
import {CoffeeLotToken} from "../src/CoffeeLotToken.sol";
import {MockCleanverseCVA} from "../src/mocks/MockCleanverseCVA.sol";
import {MockCleanverseCVI} from "../src/mocks/MockCleanverseCVI.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {RuleEngine} from "../src/RuleEngine.sol";
import {SettlementEngine} from "../src/SettlementEngine.sol";

contract SettlementEngineTest is Test {
    bytes32 internal constant EXPORTER_ROLE = keccak256("EXPORTER_ROLE");
    bytes32 internal constant QUALITY_INSPECTOR_ROLE = keccak256("QUALITY_INSPECTOR_ROLE");

    address internal exporter = address(0x1001);
    address internal inspector = address(0x1002);
    address internal buyer = address(0x1003);
    address internal maker = address(0x1004);
    address internal rfqEngineAddress = address(0x1005);

    MockCleanverseCVI internal cvi;
    MockCleanverseCVA internal cva;
    MockERC20 internal usdc;
    AttestationRegistry internal attestationRegistry;
    RuleEngine internal ruleEngine;
    CoffeeLotToken internal token;
    AuditLog internal auditLog;
    SettlementEngine internal settlementEngine;

    bytes32 internal lotId = keccak256("FV-2026-014");
    bytes32 internal quoteId = keccak256("QUOTE-1");

    function setUp() public {
        cvi = new MockCleanverseCVI();
        cva = new MockCleanverseCVA();
        usdc = new MockERC20();
        attestationRegistry = new AttestationRegistry(address(cvi));
        ruleEngine = new RuleEngine(address(cvi));
        token = new CoffeeLotToken(address(cvi), address(cva), address(attestationRegistry), address(ruleEngine));
        auditLog = new AuditLog();
        settlementEngine = new SettlementEngine(address(token), address(auditLog), address(usdc));

        auditLog.setSettlementEngine(address(settlementEngine));
        settlementEngine.setRFQEngine(rfqEngineAddress);
        token.setSettlementEngine(address(settlementEngine));

        cvi.setRole(exporter, EXPORTER_ROLE, true);
        cvi.setRole(inspector, QUALITY_INSPECTOR_ROLE, true);

        vm.prank(inspector);
        attestationRegistry.signGradeAttestation(lotId, "86.5", "Washed Caturra");

        vm.prank(exporter);
        token.mintLot(lotId, 500, bytes("metadata"));

        vm.prank(exporter);
        token.transferLot(lotId, maker, 500);

        usdc.mint(buyer, 1_000_000);
        vm.prank(buyer);
        usdc.approve(address(settlementEngine), type(uint256).max);
    }

    function testExecuteTradeOnlyRFQEngine() public {
        SettlementEngine.SettlementInstruction memory instruction = SettlementEngine.SettlementInstruction({
            quoteId: quoteId,
            lotId: lotId,
            buyer: buyer,
            maker: maker,
            lotAmount: 100,
            paymentAmount: 1_000,
            travelRuleData: bytes("travel-rule")
        });

        vm.expectRevert(SettlementEngine.NotRFQEngine.selector);
        settlementEngine.executeTrade(instruction);
    }

    function testExecuteTradeTransfersPaymentAndLotAndRecordsAudit() public {
        SettlementEngine.SettlementInstruction memory instruction = SettlementEngine.SettlementInstruction({
            quoteId: quoteId,
            lotId: lotId,
            buyer: buyer,
            maker: maker,
            lotAmount: 100,
            paymentAmount: 1_000,
            travelRuleData: bytes("travel-rule")
        });

        vm.prank(rfqEngineAddress);
        bytes32 tradeId = settlementEngine.executeTrade(instruction);

        assertEq(usdc.balanceOf(buyer), 999000);
        assertEq(usdc.balanceOf(maker), 1000);
        assertEq(token.balances(lotId, buyer), 100);
        assertEq(token.balances(lotId, maker), 400);

        (bytes32 recordedTradeId, bytes32 recordedQuoteId, address recordedBuyer, address recordedMaker,,) = auditLog.trades(tradeId);
        assertEq(recordedTradeId, tradeId);
        assertEq(recordedQuoteId, quoteId);
        assertEq(recordedBuyer, buyer);
        assertEq(recordedMaker, maker);
    }

    function testExecuteTradeRevertsWhenPaymentFails() public {
        usdc.setShouldFailTransfer(true);

        SettlementEngine.SettlementInstruction memory instruction = SettlementEngine.SettlementInstruction({
            quoteId: quoteId,
            lotId: lotId,
            buyer: buyer,
            maker: maker,
            lotAmount: 100,
            paymentAmount: 1_000,
            travelRuleData: bytes("travel-rule")
        });

        vm.prank(rfqEngineAddress);
        vm.expectRevert(SettlementEngine.PaymentTransferFailed.selector);
        settlementEngine.executeTrade(instruction);
    }
}
