// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Vm.sol";

library DeployConfig {
    struct Config {
        address cvi;
        address cva;
        address paymentToken;
        address validatorPoolOwner;
    }

    error MissingEnvAddress(string name);

    function requireAddress(Vm vm, string memory key) internal view returns (address value) {
        value = vm.envAddress(key);
        if (value == address(0)) {
            revert MissingEnvAddress(key);
        }
    }

    function load(Vm vm) internal view returns (Config memory config) {
        config = Config({
            cvi: requireAddress(vm, "CLEANVERSE_CVI_ADDRESS"),
            cva: requireAddress(vm, "CLEANVERSE_CVA_ADDRESS"),
            paymentToken: requireAddress(vm, "MONAD_USDC_ADDRESS"),
            validatorPoolOwner: requireAddress(vm, "VALIDATOR_POOL_OWNER_ADDRESS")
        });
    }
}
