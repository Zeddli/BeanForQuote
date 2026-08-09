// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import {DeployConfig} from "./DeployConfig.sol";
import {AttestationRegistry} from "../src/AttestationRegistry.sol";
import {RuleEngine} from "../src/RuleEngine.sol";
import {CoffeeLotToken} from "../src/CoffeeLotToken.sol";
import {AuditLog} from "../src/AuditLog.sol";
import {SettlementEngine} from "../src/SettlementEngine.sol";
import {RFQEngine} from "../src/RFQEngine.sol";
import {ValidatorPool} from "../src/ValidatorPool.sol";

contract DeployMonadFoundation is Script {
    struct Deployment {
        address attestationRegistry;
        address ruleEngine;
        address coffeeLotToken;
        address auditLog;
        address settlementEngine;
        address rfqEngine;
        address validatorPool;
    }

    function run() external returns (Deployment memory deployment) {
        DeployConfig.Config memory config = DeployConfig.load(vm);

        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        AttestationRegistry attestationRegistry = new AttestationRegistry(config.cvi);
        RuleEngine ruleEngine = new RuleEngine(config.cvi);
        CoffeeLotToken coffeeLotToken = new CoffeeLotToken(
            config.cvi,
            config.cva,
            address(attestationRegistry),
            address(ruleEngine)
        );
        AuditLog auditLog = new AuditLog();
        SettlementEngine settlementEngine = new SettlementEngine(
            address(coffeeLotToken),
            address(auditLog),
            config.paymentToken
        );
        RFQEngine rfqEngine = new RFQEngine(
            config.cvi,
            address(ruleEngine),
            address(coffeeLotToken),
            address(settlementEngine)
        );
        ValidatorPool validatorPool = new ValidatorPool(config.validatorPoolOwner);

        auditLog.setSettlementEngine(address(settlementEngine));
        coffeeLotToken.setSettlementEngine(address(settlementEngine));
        settlementEngine.setRFQEngine(address(rfqEngine));

        vm.stopBroadcast();

        deployment = Deployment({
            attestationRegistry: address(attestationRegistry),
            ruleEngine: address(ruleEngine),
            coffeeLotToken: address(coffeeLotToken),
            auditLog: address(auditLog),
            settlementEngine: address(settlementEngine),
            rfqEngine: address(rfqEngine),
            validatorPool: address(validatorPool)
        });

        console2.log("AttestationRegistry:", deployment.attestationRegistry);
        console2.log("RuleEngine:", deployment.ruleEngine);
        console2.log("CoffeeLotToken:", deployment.coffeeLotToken);
        console2.log("AuditLog:", deployment.auditLog);
        console2.log("SettlementEngine:", deployment.settlementEngine);
        console2.log("RFQEngine:", deployment.rfqEngine);
        console2.log("ValidatorPool:", deployment.validatorPool);
    }
}
