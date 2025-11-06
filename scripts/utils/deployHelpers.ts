import { ethers } from "hardhat";

/**
 * Helper function to deploy or verify a contract
 * 
 * Checks if a contract already exists at the given address (on-chain verification).
 * If valid, returns the existing address. Otherwise, deploys a new contract.
 * 
 * @param contractName - Name of the contract for logging purposes
 * @param existingAddress - Existing contract address from config (can be null/undefined)
 * @param deployFn - Async function that returns a contract instance to deploy
 * @returns The contract address (existing or newly deployed)
 */
export async function deployOrVerifyContract(
  contractName: string,
  existingAddress: string | null | undefined,
  deployFn: () => Promise<ethers.Contract>
): Promise<string> {
  // Check if contract already exists and is valid
  if (existingAddress && existingAddress !== null && existingAddress !== "null") {
    try {
      const code = await ethers.provider.getCode(existingAddress);
      if (code && code !== "0x") {
        console.log(`⏭️  ${contractName} already deployed at: ${existingAddress}`);
        return existingAddress;
      }
    } catch (error) {
      // Verification failed, will deploy below
    }
    console.log(`⚠️  ${contractName} address in JSON but contract not found on-chain, redeploying...`);
  }

  // Deploy new contract
  const contract = await deployFn();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`✅ ${contractName} deployed to: ${address}`);
  return address;
}

/**
 * Helper function to create or verify a liquidity pair
 * 
 * Checks if a pair already exists at the given address (on-chain + factory verification).
 * If valid, returns the existing pair address. Otherwise, creates a new pair.
 * 
 * @param pairName - Name of the pair for logging purposes (e.g., "BTC/USDC")
 * @param existingPairAddress - Existing pair address from config (can be null/undefined)
 * @param factory - The factory contract instance
 * @param tokenA - Address of first token
 * @param tokenB - Address of second token
 * @returns The pair address (existing or newly created)
 */
export async function createOrVerifyPair(
  pairName: string,
  existingPairAddress: string | null | undefined,
  factory: ethers.Contract,
  tokenA: string,
  tokenB: string
): Promise<string> {
  // Check if pair already exists and is valid
  if (existingPairAddress && existingPairAddress !== "null") {
    try {
      const code = await ethers.provider.getCode(existingPairAddress);
      if (code && code !== "0x") {
        // Verify it's the correct pair by checking factory
        const pairFromFactory = await factory.getPair(tokenA, tokenB);
        const pairFromFactoryReverse = await factory.getPair(tokenB, tokenA);
        const isCorrectPair = pairFromFactory === existingPairAddress || pairFromFactoryReverse === existingPairAddress;
        
        if (isCorrectPair) {
          console.log(`⏭️  ${pairName} pair already exists at: ${existingPairAddress}`);
          return existingPairAddress;
        }
      }
    } catch (error) {
      // Verification failed, will create below
    }
    console.log(`⚠️  ${pairName} address in JSON but pair not found on-chain or doesn't match factory, recreating...`);
  }

  // Create new pair
  const tx = await factory.createPair(tokenA, tokenB);
  await tx.wait(); // Wait for transaction to be mined
  const pairAddress = await factory.getPair(tokenA, tokenB);
  const finalPairAddress = pairAddress === ethers.ZeroAddress 
    ? await factory.getPair(tokenB, tokenA)
    : pairAddress;
  
  if (finalPairAddress && finalPairAddress !== ethers.ZeroAddress) {
    console.log(`✅ ${pairName} pair created at: ${finalPairAddress}`);
    return finalPairAddress;
  } else {
    throw new Error(`Failed to get ${pairName} pair address after creation`);
  }
}

