// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import {ValidatorPool} from "../src/ValidatorPool.sol";

contract DeployValidatorPool is Script {
    function run() external returns (address validatorPoolAddress) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address validatorPoolOwner = vm.envAddress("VALIDATOR_POOL_OWNER_ADDRESS");

        require(validatorPoolOwner != address(0), "VALIDATOR_POOL_OWNER_ADDRESS is required");

        vm.startBroadcast(deployerPrivateKey);
        ValidatorPool validatorPool = new ValidatorPool(validatorPoolOwner);
        vm.stopBroadcast();

        validatorPoolAddress = address(validatorPool);
        console2.log("ValidatorPool:", validatorPoolAddress);
        console2.log("Owner:", validatorPoolOwner);
    }
}
