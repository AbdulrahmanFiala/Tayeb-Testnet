# Tayeb - Sharia Compliant DeFi Platform

**Getting Started: Grab some DEV tokens from the [Moonbase Alpha faucet](https://faucet.moonbeam.network/) → Begin exploring the app and swapping into other tokens 🚀**

The first-of-its-kind decentralized platform for Sharia-compliant cryptocurrency investment, built with Solidity smart contracts for Moonbase Alpha (Moonbeam Testnet).

## 🌟 Features

### 1. Sharia-Compliant Asset Registry
- **Verified Token Registry**: Admin-controlled list of Sharia-compliant tokens
- **Compliance Validation**: All swaps and investments validated against Sharia principles
- **Transparent Documentation**: Each token includes compliance reasoning

### 2. Token Swapping (ShariaSwap)
- **Custom AMM**: Built-in Uniswap V2-style AMM for testing
- **Automatic Routing**: Automatically routes through USDC when direct pairs don't exist
- **Compliance Enforcement**: Only allows swaps into Sharia-compliant tokens
- **Price Quotes**: Get swap estimates before execution

### 3. Dollar Cost Averaging (ShariaDCA)
- **Automated DCA**: Schedule periodic investments into Sharia-compliant tokens
- **Cloud Automation**: Automated execution via cloud deployed script
- **Flexible Intervals**: Set custom time intervals (day, hour, and week)
- **Prepaid Deposits**: Lock funds for all future DCA executions
- **Cancel Anytime**: Get refunds for uncompleted intervals

### 4. Sharia-Compliant Scanner
- **Wallet Scanning**: Scan any wallet address to check Sharia compliance status
- **Compliance Identification**: Identifies which tokens are Sharia-compliant and which aren't
- **Informed Decisions**: Helps users make informed trading decisions based on Sharia principles

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      Frontend DApp                         │
│        (React 19 + TypeScript + Vite + Wagmi v2)           │
│  - Swap Interface                                          │
│  - DCA Orders Management                                   │
│  - Token Listing                                           │
│  - Sharia Scanner                                          │
└───────────┬────────────────────────────────────┬───────────┘
            │                                    │
┌───────────▼──────────┐              ┌──────────▼──────────┐
│  ShariaCompliance    │              │    ShariaSwap       │
│  - Token Registry    │◄─────────────┤    - DEX Router     │
│  - Validation        │              │    - Swap Logic     │
└──────────────────────┘              └─────────────────────┘
            ▲                                     │
            │                                     │
┌───────────┴──────────┐                          │ 
│     ShariaDCA        │                          │
│  - Automation Script │                          │
│  - Scheduled Orders  │                          │
└──────────────────────┘                          │ 
            │                                     │
            └─────────────┬───────────────────────┘
                          │
              ┌───────────▼──────────────┐
              │      Custom AMM          │
              │  (Uniswap V2 Style)      │
              └──────────────────────────┘
```

## 🚀 Getting Started

> **Quick Start**: For a step-by-step setup guide, see [SETUP.md](./docs/SETUP.md)


## 💻 Usage

> **📖 For comprehensive code examples and integration guides, see [USAGE_EXAMPLES.md](./docs/USAGE_EXAMPLES.md)**


## 📚 Resources

- **Usage Examples**: See [USAGE_EXAMPLES.md](./docs/USAGE_EXAMPLES.md) for detailed code examples and integration guides (Wagmi v2 + Viem)
- **Setup Guide**: See [SETUP.md](./docs/SETUP.md) for quick start and troubleshooting
- **Testing Guide**: See [TESTING.md](./docs/TESTING.md) for testing instructions
- **Deployment Workflow**: See [DEPLOYMENT_WORKFLOW.md](./docs/DEPLOYMENT_WORKFLOW.md) for deployment details
- **Moonbeam Docs**: https://docs.moonbeam.network/
- **Moonbase Faucet**: https://faucet.moonbeam.network/
- **Hardhat**: https://hardhat.org/
- **Wagmi v2**: https://wagmi.sh/
- **Viem**: https://viem.sh/

### Tech Stack

**Smart Contracts:**
- Solidity 0.8.20
- Hardhat
- TypeScript
- OpenZeppelin Contracts

**Frontend:**
- React 19
- TypeScript
- Vite
- Wagmi v2

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This platform provides tools for Sharia-compliant cryptocurrency investment. However:

- **Do Your Own Research**: Always verify token compliance with qualified Islamic scholars
- **No Financial Advice**: This is not financial or religious advice
- **Smart Contract Risk**: Use at your own risk; audit contracts before mainnet use

---

Built with ❤️ for the Muslim DeFi community
