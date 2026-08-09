// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract ValidatorPool {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error ZeroAddressOwner();

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert ZeroAddressOwner();
        }
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function transferOwnership(address newOwner) external {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        if (newOwner == address(0)) {
            revert ZeroAddressOwner();
        }
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
