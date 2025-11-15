import { ethers } from "hardhat";
import deployedContracts from "../../config/deployedContracts.json";
import tayebCoins from "../../config/tayebCoins.json";

type CoinConfig = (typeof tayebCoins)["coins"][number];

function getCoinByAddress(address: string): CoinConfig | undefined {
  const lowerAddress = address.toLowerCase();
  return tayebCoins.coins.find(
    (coin) => coin.addresses.moonbase?.toLowerCase() === lowerAddress
  );
}

function formatAmount(raw: bigint, coin?: CoinConfig): string {
  if (!coin) return raw.toString();
  return ethers.formatUnits(raw, coin.decimals);
}

async function logPairReserves(pairName: string, pairAddress: string) {
  const pair = await ethers.getContractAt("SimplePair", pairAddress);

  const [reserve0, reserve1] = await pair.getReserves();
  const token0 = await pair.token0();
  const token1 = await pair.token1();

  const coin0 = getCoinByAddress(token0);
  const coin1 = getCoinByAddress(token1);

  console.log(`\n🔍 ${pairName} (${pairAddress})`);
  console.log(
    `   token0: ${token0} ${coin0 ? `(${coin0.symbol})` : "(unknown)"}`
  );
  console.log(
    `   token1: ${token1} ${coin1 ? `(${coin1.symbol})` : "(unknown)"}`
  );
  console.log(
    `   reserves: ${formatAmount(reserve0, coin0)} ${
      coin0?.symbol ?? ""
    } / ${formatAmount(reserve1, coin1)} ${coin1?.symbol ?? ""}`
  );
}

async function main() {
  const { pairs } = deployedContracts;

  if (!pairs) {
    throw new Error("Pairs section missing in deployedContracts.json");
  }

  const entries = Object.entries(pairs).filter(
    ([, address]) => !!address && address !== ethers.ZeroAddress
  );

  if (entries.length === 0) {
    console.warn("⚠️  No pair addresses found in deployedContracts.json");
    return;
  }

  console.log(`💧 Checking liquidity reserves for ${entries.length} pair(s)...`);

  for (const [pairKey, address] of entries) {
    const displayName = pairKey.replace(/_/g, "/");

    try {
      await logPairReserves(displayName, address);
    } catch (error) {
      console.error(`❌ Failed to read reserves for ${displayName}:`, error);
    }
  }
}

main()
  .then(() => {
    console.log("\n✅ Liquidity check completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Liquidity check failed:", error);
    process.exit(1);
  });


