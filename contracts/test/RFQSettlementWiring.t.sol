// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import {AttestationRegistry} from "../src/AttestationRegistry.sol";
import {AuditLog} from "../src/AuditLog.sol";
import {CoffeeLotToken} from "../src/CoffeeLotToken.sol";
import {MockCleanverseCVA} from "../src/mocks/MockCleanverseCVA.sol";
import {MockCleanverseCVI} from "../src/mocks/MockCleanverseCVI.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {RFQEngine} from "../src/RFQEngine.sol";
import {RuleEngine} from "../src/RuleEngine.sol";
import {SettlementEngine} from "../src/SettlementEngine.sol";

contract RFQSettlementWiringTest is Test {
    bytes32 internal constant EXPORTER_ROLE = keccak256("EXPORTER_ROLE");
    bytes32 internal constant QUALITY_INSPECTOR_ROLE = keccak256("QUALITY_INSPECTOR_ROLE");
    bytes32 internal constant BUYER_ROLE = keccak256("BUYER_ROLE");
    bytes32 internal constant MARKET_MAKER_ROLE = keccak256("MARKET_MAKER_ROLE");

    address internal exporter = address(0x1001);
    address internal inspector = address(0x1002);
    address internal buyer = address(0x1003);
    address internal maker = address(0x1004);

    MockCleanverseCVI internal cvi;
    MockCleanverseCVA internal cva;
    MockERC20 internal usdc;
    AttestationRegistry internal attestationRegistry;
    RuleEngine internal ruleEngine;
    CoffeeLotToken internal token;
    AuditLog internal auditLog;
    SettlementEngine internal settlementEngine;
    RFQEngine internal rfqEngine;

    bytes32 internal lotId = keccak256("FV-2026-014");

    function setUp() public {
        cvi = new MockCleanverseCVI();
        cva = new MockCleanverseCVA();
        usdc = new MockERC20();
        attestationRegistry = new AttestationRegistry(address(cvi));
        ruleEngine = new RuleEngine(address(cvi));
        token = new CoffeeLotToken(address(cvi), address(cva), address(attestationRegistry), address(ruleEngine));
        auditLog = new AuditLog();
        settlementEngine = new SettlementEngine(address(token), address(auditLog), address(usdc));
        rfqEngine = new RFQEngine(address(cvi), address(ruleEngine), address(token), address(settlementEngine));

        auditLog.setSettlementEngine(address(settlementEngine));
        settlementEngine.setRFQEngine(address(rfqEngine));
        token.setSettlementEngine(address(settlementEngine));

        cvi.setRole(exporter, EXPORTER_ROLE, true);
        cvi.setRole(inspector, QUALITY_INSPECTOR_ROLE, true);
        cvi.setRole(buyer, BUYER_ROLE, true);
        cvi.setRole(maker, MARKET_MAKER_ROLE, true);

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

    function testAcceptQuoteExecutesSettlementAndSettlesRFQ() public {
        vm.prank(buyer);
        bytes32 rfqId = rfqEngine.submitRFQ(lotId, 100, block.timestamp + 300);

        vm.prank(maker);
        bytes32 quoteId = rfqEngine.submitQuote(rfqId, 1_000, block.timestamp + 60);

        vm.prank(buyer);
        rfqEngine.acceptQuote(quoteId);

        (, , , , , RFQEngine.RFQStatus status) = rfqEngine.rfqs(rfqId);
        assertEq(uint256(status), uint256(RFQEngine.RFQStatus.Settled));
        assertEq(usdc.balanceOf(buyer), 999000);
        assertEq(usdc.balanceOf(maker), 1000);
        assertEq(token.balances(lotId, buyer), 100);
        assertEq(token.balances(lotId, maker), 400);
    }
}
