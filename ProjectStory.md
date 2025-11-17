# Project Story

*About the project*  
Be sure to write what inspired you, what you learned, how you built your project, and the challenges you faced. Format your story in Markdown, with LaTeX support for math.

## What Inspired Me

I was inspired by how Islamic banking transformed the financial landscape in Muslim-majority countries, not only as a religious alternative, but as a driver of overall market growth.

According to the **IFSB**, in some key jurisdictions Islamic banking now represents a large share of total banking assets. For example, as of 2024:

- **Saudi Arabia**: Islamic banking makes up ~74.96% of total banking assets. ([IFSB](https://www.ifsb.org))  
- **Kuwait**: Islamic banking is about ~60.6% of total banking assets. ([IFSB](https://www.ifsb.org))  
- **Malaysia**: Islamic banking is ~33.2% of total banking assets. ([IFSB](https://www.ifsb.org))  
- **UAE**: Islamic banking is ~23.2% of total banking assets. ([IFSB](https://www.ifsb.org))  

This data showed me that Islamic banking is not only growing fast, but is deeply embedded in some national banking systems. That inspired me to build **Tayeb** — the first Sharia‑compliant DEX — to bring the principles of Islamic finance into the world of decentralized finance, and serve a market with real scale and potential.

## What I Learned & How I Built It

In building Tayeb, I first explored deploying **Solidity smart contracts** on the **Paseo testnet**, then experimented with **Ink! contracts**. After testing, I settled on **writing Solidity contracts on Moonbase Alpha testnet**, which offered a stable EVM environment and easier integration with Solidity tools.

I built four core components:

1. **Sharia-Compliant Asset Registry**  
   Controlled token registry validating all swaps against Sharia principles with transparent compliance documentation.

2. **ShariaSwap (Custom AMM)**  
   Uniswap V2-style AMM with automatic USDC routing and compliance enforcement.

3. **ShariaDCA (Dollar Cost Averaging)**  
   Automated periodic investments with flexible intervals, prepaid deposits, and cloud-deployed execution scripts.

4. **Sharia-Compliant Scanner**  
   Wallet scanner identifying Sharia-compliant tokens to help users make informed trading decisions.

The platform was built with a modern tech stack: **Solidity & Hardhat** for smart contracts, **React + TypeScript + Vite + Wagmi v2** for the frontend, and **local automation scripts** for DCA execution and liquidity management — enabling real-world automated investing features.

This process taught me the importance of adapting tooling to blockchain limitations and designing around liquidity and compliance constraints. Building my own liquidity pool and DCA automation gave me complete control over Sharia compliance enforcement rather than relying on external integrations.

## Challenges Faced

Building Tayeb required navigating several technical and ecosystem limitations:

- **ETH-RPC Adapter & Contracts UI Issues**  
  - Running a local Ethereum RPC adapter node failed.  
  - Contracts UI had a bug when deploying Ink! contracts locally.  
  - I **opened GitHub** ([link](https://github.com/use-ink/contracts-ui/issues/593)) and **Polkadot forum issues** ([link](https://forum.polkadot.network/t/hardhat-deployment-hangs-while-local-substrate-node-stays-idle-no-blocks-produced/15638)) to report these blockers, then **pivoted to Solidity on Moonbase Alpha testnet** for a stable EVM environment.

- **Chopsticks Fork & Missing HRMP Channel**  
  - No HRMP channel exists between Moonbase Alpha and Hydra testnets.  
  - Chopsticks forks lack Frontier EVM RPC methods, preventing EVM-Substrate interoperability.  
  - I **tested cross-chain workflows on mainnet** (Moonbeam ↔ Hydration) to confirm architecture viability.

- **Stellaswap Liquidity & SDK Issues**  
  - No testnet liquidity pools, outdated mainnet SDK, and limited developer support.  
  - I **built my own liquidity pool contracts on Moonbase Alpha testnet** for testing.

- **Moonbeam XCM SDK Failures**  
  - Official XCM SDK was unreliable.  
  - I **integrated ParaSpell XCM in the mainnet version (currently under development)** for stable cross-chain routing and improved documentation.

These challenges revealed critical gaps in EVM-compatible cross-chain tooling and shaped my architectural decisions to prioritize flexibility and mainnet validation.
