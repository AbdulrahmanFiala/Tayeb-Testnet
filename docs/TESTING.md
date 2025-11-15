# Testing Guide for Tayeb Sharia Platform

## ✅ Quick Start Testing

### 1. Run All Tests

```bash
npm test
```

This runs all Hardhat tests using Mocha and Chai. Expected output:

```
  ShariaCompliance
    Deployment
      ✓ Should set the correct owner
      ✓ Should start with no coins registered (coins registered programmatically from config)
      ✓ Should return total coins
    Register Coin
      ✓ Should allow owner to register new coin
      ✓ Should not allow non-owner to register coin
      ✓ Should not allow duplicate coin registration
    Remove Coin
      ✓ Should allow owner to remove coin
      ✓ Should not allow removing non-existent coin
    Update Compliance Status
      ✓ Should allow owner to update compliance status
    Get Coin Details
      ✓ Should return correct coin details
      ✓ Should revert when getting non-existent coin
    Get All Coins
      ✓ Should return all registered coins
    Require Sharia Compliant
      ✓ Should not revert for compliant coin
      ✓ Should revert for non-compliant coin

  15 passing
```

### 2. Run Tests in Watch Mode

```bash
npm test -- --watch
```

### 3. Run Tests with Gas Reporting

```bash
npm test -- --report-gas
```

### 4. Run Specific Test File

```bash
npx hardhat test test/ShariaCompliance.test.ts
```

### 5. Run Specific Test Suite or Test

```bash
# Run specific test suite
npx hardhat test --grep "Register Coin"

# Run specific test
npx hardhat test --grep "Should allow owner to register new coin"
```

## Available Tests

### ShariaCompliance Tests

**Location**: `test/ShariaCompliance.test.ts`

**Test Suites**:
1. **Deployment** - Tests contract deployment and initialization
2. **Register Coin** - Tests registering Sharia-compliant coins
3. **Remove Coin** - Tests removing coins from registry
4. **Update Compliance Status** - Tests updating coin compliance status
5. **Get Coin Details** - Tests retrieving coin information
6. **Get All Coins** - Tests retrieving all registered coins
7. **Require Sharia Compliant** - Tests compliance validation

## Test Framework

This project uses:
- **Hardhat** - Ethereum development environment
- **Mocha** - Test framework (via Hardhat)
- **Chai** - Assertion library
- **@nomicfoundation/hardhat-ethers** - Ethers.js integration
- **@nomicfoundation/hardhat-chai-matchers** - Additional Chai matchers

## Compile Contracts Before Testing

```bash
npm run compile
```

This compiles all Solidity contracts and generates TypeScript types in `typechain-types/`.

## Test Coverage

To generate test coverage reports:

```bash
# Install coverage tool (if not already installed)
npm install --save-dev solidity-coverage

# Add to hardhat.config.ts:
# require("solidity-coverage");

# Run tests with coverage
npx hardhat coverage
```

## Integration Testing

For integration tests on testnet:

1. **Deploy to Testnet**:
   ```bash
   npm run deploy:testnet
   ```

2. **Run Manual Tests**:
   - Use scripts in `scripts/` directory
   - Interact with deployed contracts via frontend
   - Test swap functionality with testnet tokens

3. **Test Automation Scripts**:
   ```bash
   # Test DCA automation
   npx hardhat run scripts/automation/auto-execute-dca.ts --network moonbase
   ```

## Frontend Testing

```bash
cd frontend
npm run test  # If test scripts are configured
```

## Debugging Tests

### Run Tests with Console Output

```bash
npx hardhat test --verbose
```

### Debug Specific Test

Add `console.log()` statements in test files or use a debugger:

```typescript
it("Should allow owner to register new coin", async function () {
  console.log("Owner address:", owner.address);
  const tx = await shariaCompliance.registerShariaCoin(...);
  const receipt = await tx.wait();
  console.log("Gas used:", receipt.gasUsed.toString());
});
```

## Current Test Status

✅ **ShariaCompliance**: 15 tests passing
- All deployment tests passing
- All registration tests passing
- All compliance validation tests passing

## Adding New Tests

Create new test files in the `test/` directory:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { YourContract } from "../typechain-types";

describe("YourContract", function () {
  let contract: YourContract;
  let owner: SignerWithAddress;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const YourContractFactory = await ethers.getContractFactory("YourContract");
    contract = await YourContractFactory.deploy();
    await contract.waitForDeployment();
  });

  it("Should do something", async function () {
    // Your test here
    expect(await contract.someFunction()).to.equal(expectedValue);
  });
});
```

## Next Steps

1. ✅ Unit tests for ShariaCompliance - **Complete**
2. 🔲 Add tests for ShariaSwap contract
3. 🔲 Add tests for ShariaDCA contract
4. 🔲 Add integration tests
5. 🔲 Add frontend component tests
