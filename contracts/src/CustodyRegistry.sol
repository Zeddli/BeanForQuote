// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ICleanverseCVI} from "./interfaces/ICleanverseCVI.sol";

/**
 * @title CustodyRegistry
 * @notice Tracks physical custody state and transitions per coffee lot
 */
contract CustodyRegistry {
    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");

    enum CustodyStatus {
        InWarehouse,
        Released,
        InTransit,
        Delivered
    }

    struct CustodyRecord {
        bytes32 lotId;
        CustodyStatus status;
        address custodian;
        uint256 updatedAt;
        string location;
    }

    ICleanverseCVI public immutable cvi;

    mapping(bytes32 => CustodyRecord) public custodyRecords;

    event CustodyUpdated(
        bytes32 indexed lotId,
        CustodyStatus status,
        address indexed custodian,
        string location
    );

    error NotAuthorized();

    constructor(address cviAddress) {
        cvi = ICleanverseCVI(cviAddress);
    }

    function updateCustodyStatus(
        bytes32 lotId,
        CustodyStatus status,
        string calldata location
    ) external {
        if (!cvi.hasRole(msg.sender, CUSTODIAN_ROLE) || cvi.isFrozen(msg.sender)) {
            revert NotAuthorized();
        }

        custodyRecords[lotId] = CustodyRecord({
            lotId: lotId,
            status: status,
            custodian: msg.sender,
            updatedAt: block.timestamp,
            location: location
        });

        emit CustodyUpdated(lotId, status, msg.sender, location);
    }

    function getCustodyRecord(bytes32 lotId) external view returns (CustodyRecord memory) {
        return custodyRecords[lotId];
    }
}
