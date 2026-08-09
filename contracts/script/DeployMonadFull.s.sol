// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import {CleanverseCVIAdapter} from "../src/CleanverseCVIAdapter.sol";
import {MockCleanverseCVA} from "../src/mocks/MockCleanverseCVA.sol";
import {AttestationRegistry} from "../src/AttestationRegistry.sol";
import {CustodyRegistry} from "../src/CustodyRegistry.sol";
import {RuleEngine} from "../src/RuleEngine.sol";
import {CoffeeLotToken} from "../src/CoffeeLotToken.sol";
import {AuditLog} from "../src/AuditLog.sol";
import {SettlementEngine} from "../src/SettlementEngine.sol";
import {RFQEngine} from "../src/RFQEngine.sol";
import {ValidatorPool} from "../src/ValidatorPool.sol";

contract DeployMonadFull is Script {
    bytes32 public constant EXPORTER_ROLE = keccak256("EXPORTER_ROLE");
    bytes32 public constant BUYER_ROLE = keccak256("BUYER_ROLE");
    bytes32 public constant MARKET_MAKER_ROLE = keccak256("MARKET_MAKER_ROLE");
    bytes32 public constant QUALITY_INSPECTOR_ROLE = keccak256("QUALITY_INSPECTOR_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    address public constant MONAD_APASS_NFT = 0xbA82D189540CaC9DC6FF46B6837CaC1BFdEC58B9;
    address public constant MONAD_USDC = 0x534b2f3A21130d7a60830c2Df862319e593943A3;

    address public constant EXPORTER_ADDR = 0xD06178216134c059BF17c4D3dD60CCD36074edfd;
    address public constant BUYER_ADDR = 0x9703f29Ab27a1D72502cfeDFc739d26aA41abF88;
    address public constant MAKER_A_ADDR = 0xcA3DC1C67a7da6e8ac1A4c89b19350fE5059EAEe;
    address public constant MAKER_B_ADDR = 0xe363CdAD20d73D91Fa43DB35FdaA432B863F56d9;
    address public constant MAKER_C_ADDR = 0x658A0dDaECBc2a662168c21AB02e983b722f5a37;
    address public constant INSPECTOR_ADDR = 0xe2690d943008be679A6eC7aBFe84dFCB1935095c;
    address public constant REGULATOR_ADDR = 0x67C8d12801E00d86d71D0B17b9aa15B7d2498d4a;
    address public constant AUDITOR_ADDR = 0xFca4A2EA6B048ea7e92B0d55a898706d8F047D7A;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy CleanverseCVIAdapter
        CleanverseCVIAdapter cvi = new CleanverseCVIAdapter(MONAD_APASS_NFT);

        // Batch role assignments
        address[] memory wallets = new address[](8);
        bytes32[] memory rolesList = new bytes32[](8);

        wallets[0] = EXPORTER_ADDR;   rolesList[0] = EXPORTER_ROLE;
        wallets[1] = BUYER_ADDR;      rolesList[1] = BUYER_ROLE;
        wallets[2] = MAKER_A_ADDR;    rolesList[2] = MARKET_MAKER_ROLE;
        wallets[3] = MAKER_B_ADDR;    rolesList[3] = MARKET_MAKER_ROLE;
        wallets[4] = MAKER_C_ADDR;    rolesList[4] = MARKET_MAKER_ROLE;
        wallets[5] = INSPECTOR_ADDR;  rolesList[5] = QUALITY_INSPECTOR_ROLE;
        wallets[6] = REGULATOR_ADDR;  rolesList[6] = REGULATOR_ROLE;
        wallets[7] = AUDITOR_ADDR;    rolesList[7] = AUDITOR_ROLE;

        cvi.setRolesBatch(wallets, rolesList, true);

        // 2. Deploy Mock CVA
        MockCleanverseCVA cva = new MockCleanverseCVA();

        // 3. Deploy Foundation
        AttestationRegistry attestationRegistry = new AttestationRegistry(address(cvi));
        CustodyRegistry custodyRegistry = new CustodyRegistry(address(cvi));
        RuleEngine ruleEngine = new RuleEngine(address(cvi));

        CoffeeLotToken coffeeLotToken = new CoffeeLotToken(
            address(cvi),
            address(cva),
            address(attestationRegistry),
            address(ruleEngine)
        );

        AuditLog auditLog = new AuditLog();

        SettlementEngine settlementEngine = new SettlementEngine(
            address(coffeeLotToken),
            address(auditLog),
            MONAD_USDC
        );

        RFQEngine rfqEngine = new RFQEngine(
            address(cvi),
            address(ruleEngine),
            address(coffeeLotToken),
            address(settlementEngine)
        );

        // Wire contract permissions
        auditLog.setSettlementEngine(address(settlementEngine));
        coffeeLotToken.setSettlementEngine(address(settlementEngine));
        settlementEngine.setRFQEngine(address(rfqEngine));

        vm.stopBroadcast();

        console2.log("=== BeanForQuote Monad Full Deployment ===");
        console2.log("CleanverseCVIAdapter:", address(cvi));
        console2.log("MockCleanverseCVA:   ", address(cva));
        console2.log("AttestationRegistry: ", address(attestationRegistry));
        console2.log("CustodyRegistry:     ", address(custodyRegistry));
        console2.log("RuleEngine:          ", address(ruleEngine));
        console2.log("CoffeeLotToken:      ", address(coffeeLotToken));
        console2.log("AuditLog:            ", address(auditLog));
        console2.log("SettlementEngine:    ", address(settlementEngine));
        console2.log("RFQEngine:           ", address(rfqEngine));
        console2.log("ValidatorPool (Prev):", 0x2155cf30AB82DBdB074bB1B9222E4e33B422532C);
    }
}
