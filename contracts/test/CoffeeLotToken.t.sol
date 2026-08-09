// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import {AttestationRegistry} from "../src/AttestationRegistry.sol";
import {CoffeeLotToken} from "../src/CoffeeLotToken.sol";
import {RuleEngine} from "../src/RuleEngine.sol";
import {MockCleanverseCVA} from "../src/mocks/MockCleanverseCVA.sol";
import {MockCleanverseCVI} from "../src/mocks/MockCleanverseCVI.sol";

contract CoffeeLotTokenTest is Test {
    bytes32 internal constant EXPORTER_ROLE = keccak256("EXPORTER_ROLE");
    bytes32 internal constant QUALITY_INSPECTOR_ROLE = keccak256("QUALITY_INSPECTOR_ROLE");
    bytes32 internal constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    address internal exporter = address(0x1001);
    address internal inspector = address(0x1002);
    address internal buyer = address(0x1003);
    address internal regulator = address(0x1004);

    MockCleanverseCVI internal cvi;
    MockCleanverseCVA internal cva;
    AttestationRegistry internal attestationRegistry;
    RuleEngine internal ruleEngine;
    CoffeeLotToken internal token;

    bytes32 internal lotId = keccak256("FV-2026-014");

    function setUp() public {
        cvi = new MockCleanverseCVI();
        cva = new MockCleanverseCVA();
        attestationRegistry = new AttestationRegistry(address(cvi));
        ruleEngine = new RuleEngine(address(cvi));
        token = new CoffeeLotToken(address(cvi), address(cva), address(attestationRegistry), address(ruleEngine));

        cvi.setRole(exporter, EXPORTER_ROLE, true);
        cvi.setRole(inspector, QUALITY_INSPECTOR_ROLE, true);
        cvi.setRole(regulator, REGULATOR_ROLE, true);
    }

    function testMintRequiresAttestation() public {
        vm.prank(exporter);
        vm.expectRevert(CoffeeLotToken.MissingAttestation.selector);
        token.mintLot(lotId, 500, bytes("metadata"));
    }

    function testMintSucceedsWithAttestation() public {
        vm.prank(inspector);
        attestationRegistry.signGradeAttestation(lotId, "86.5", "Washed Caturra");

        vm.prank(exporter);
        token.mintLot(lotId, 500, bytes("metadata"));

        assertEq(token.balances(lotId, exporter), 500);
    }

    function testTransferBlockedWhenLotFrozen() public {
        vm.prank(inspector);
        attestationRegistry.signGradeAttestation(lotId, "86.5", "Washed Caturra");

        vm.prank(exporter);
        token.mintLot(lotId, 500, bytes("metadata"));

        vm.prank(regulator);
        ruleEngine.freezeLot(lotId);

        vm.prank(exporter);
        vm.expectRevert(CoffeeLotToken.TransferNotAllowed.selector);
        token.transferLot(lotId, buyer, 100);
    }
}
