# Contracts

This Foundry workspace contains the BeanForQuote on-chain foundation for Monad testnet.

## Current scope

Validated foundations in this workspace:
- `AttestationRegistry`
- `RuleEngine`
- `CoffeeLotToken`
- `AuditLog`
- `SettlementEngine`
- `RFQEngine`
- `ValidatorPool`

## Standalone ValidatorPool deployment

A minimal standalone deployment script is available at:
- `script/DeployValidatorPool.s.sol`

Minimal required environment variables:
- `DEPLOYER_PRIVATE_KEY`
- `VALIDATOR_POOL_OWNER_ADDRESS`
- `MONAD_RPC_URL`

### Dry-run compile

From repo root:

```sh
forge build --root ./contracts
```

### Broadcast standalone ValidatorPool to Monad testnet

```sh
forge script script/DeployValidatorPool.s.sol:DeployValidatorPool \
  --root ./contracts \
  --rpc-url MONAD_RPC_URL \
  --broadcast
```

## Full Monad deployment foundation

A full-stack deployment script is also available at:
- `script/DeployMonadFoundation.s.sol`

It expects a local `contracts/.env` file derived from `contracts/.env.example`.

Required environment variables:
- `DEPLOYER_PRIVATE_KEY`
- `CLEANVERSE_CVI_ADDRESS`
- `CLEANVERSE_CVA_ADDRESS`
- `MONAD_USDC_ADDRESS`
- `VALIDATOR_POOL_OWNER_ADDRESS`
- `MONAD_RPC_URL`

### Dry-run compile

From repo root:

```sh
forge build --root ./contracts
```

### Broadcast full stack to Monad testnet

Only after real addresses are confirmed:

```sh
forge script script/DeployMonadFoundation.s.sol:DeployMonadFoundation \
  --root ./contracts \
  --rpc-url MONAD_RPC_URL \
  --broadcast
```

## Important constraints

Do not guess Cleanverse contract addresses.
The current project documentation confirms Cleanverse Cooperate API usage for validator/compliance flows, but does not yet provide validated Monad deployment addresses for CVI/CVA contracts. Populate those only after confirmation from Cleanverse engineers.
