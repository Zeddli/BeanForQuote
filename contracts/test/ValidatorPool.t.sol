// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";

import {ValidatorPool} from "../src/ValidatorPool.sol";

contract ValidatorPoolTest is Test {
    address internal owner = address(0x1001);
    address internal nextOwner = address(0x1002);

    function testConstructorSetsOwner() public {
        ValidatorPool pool = new ValidatorPool(owner);
        assertEq(pool.owner(), owner);
    }

    function testOnlyOwnerCanTransferOwnership() public {
        ValidatorPool pool = new ValidatorPool(owner);

        vm.prank(nextOwner);
        vm.expectRevert(ValidatorPool.NotOwner.selector);
        pool.transferOwnership(nextOwner);
    }

    function testTransferOwnershipSucceeds() public {
        ValidatorPool pool = new ValidatorPool(owner);

        vm.prank(owner);
        pool.transferOwnership(nextOwner);

        assertEq(pool.owner(), nextOwner);
    }
}
