// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import {CustodyRegistry} from "../src/CustodyRegistry.sol";
import {MockCleanverseCVI} from "../src/mocks/MockCleanverseCVI.sol";

contract CustodyRegistryTest is Test {
    CustodyRegistry public custodyRegistry;
    MockCleanverseCVI public cvi;

    address public custodian = address(0x101);
    address public unauthorized = address(0x102);
    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");
    bytes32 public lotId = keccak256("LOT-ETH-042");

    function setUp() external {
        cvi = new MockCleanverseCVI();
        custodyRegistry = new CustodyRegistry(address(cvi));

        cvi.setRole(custodian, CUSTODIAN_ROLE, true);
    }

    function testUpdateCustodyStatusRequiresRole() external {
        vm.prank(unauthorized);
        vm.expectRevert(CustodyRegistry.NotAuthorized.selector);
        custodyRegistry.updateCustodyStatus(
            lotId,
            CustodyRegistry.CustodyStatus.InWarehouse,
            "Warehouse A, Singapore"
        );
    }

    function testUpdateCustodyStatusSucceedsForCustodian() external {
        vm.prank(custodian);
        custodyRegistry.updateCustodyStatus(
            lotId,
            CustodyRegistry.CustodyStatus.InTransit,
            "Port of Hamburg, Germany"
        );

        CustodyRegistry.CustodyRecord memory record = custodyRegistry.getCustodyRecord(lotId);
        assertEq(uint256(record.status), uint256(CustodyRegistry.CustodyStatus.InTransit));
        assertEq(record.custodian, custodian);
        assertEq(record.location, "Port of Hamburg, Germany");
    }
}
