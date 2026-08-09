// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ICleanverseCVI} from "./interfaces/ICleanverseCVI.sol";

contract AttestationRegistry {
    bytes32 public constant QUALITY_INSPECTOR_ROLE = keccak256("QUALITY_INSPECTOR_ROLE");

    struct Attestation {
        bytes32 attestationId;
        string grade;
        string notes;
        address inspector;
        uint256 timestamp;
    }

    ICleanverseCVI public immutable cvi;
    mapping(bytes32 => Attestation) private attestations;

    event GradeAttested(bytes32 indexed lotId, bytes32 indexed attestationId, address indexed inspector);

    error NotAuthorized();

    constructor(address cviAddress) {
        cvi = ICleanverseCVI(cviAddress);
    }

    function signGradeAttestation(bytes32 lotId, string calldata grade, string calldata notes) external {
        if (!cvi.hasRole(msg.sender, QUALITY_INSPECTOR_ROLE) || cvi.isFrozen(msg.sender)) {
            revert NotAuthorized();
        }

        bytes32 attestationId = keccak256(
            abi.encodePacked(lotId, msg.sender, grade, notes, block.timestamp)
        );

        attestations[lotId] = Attestation({
            attestationId: attestationId,
            grade: grade,
            notes: notes,
            inspector: msg.sender,
            timestamp: block.timestamp
        });

        emit GradeAttested(lotId, attestationId, msg.sender);
    }

    function getAttestation(bytes32 lotId) external view returns (Attestation memory) {
        return attestations[lotId];
    }
}
