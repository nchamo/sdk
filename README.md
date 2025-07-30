# Balmy SDK

A comprehensive TypeScript SDK for interacting with the Balmy protocol and various blockchain networks.

## 🧪 Installation

### Yarn

```bash
yarn add @balmy/sdk
```

### NPM

```bash
npm install @balmy/sdk
```

## Quick Start

### 👷🏽‍♀️ Building the SDK

```typescript
import { buildSDK } from "@balmy/sdk";

const sdk = buildSDK(config);
```

### ⚖️ Getting Balance for Multiple Tokens

```typescript
const accountBalances = await sdk.balanceService.getBalancesForTokens({
  account: "0x000000000000000000000000000000000000dead",
  tokens: {
    [Chains.ETHEREUM.chainId]: [
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
    ],
    [Chains.OPTIMISM.chainId]: [
      "0x7f5c764cbc14f9669b88837ca1490cca17c31607", // USDC
      "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", // DAI
    ],
  },
  config: {
    timeout: "30s",
  },
});
```

### 💸 Getting Allowances

```typescript
const accountAllowances = await sdk.allowanceService.getAllowances({
  chainId: Chains.ETHEREUM.chainId,
  token: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
  owner: "0x000000000000000000000000000000000000dead",
  spenders: ["0x6666666600000000000000000000000000009999"],
});
```

### 🔄 Getting Trade Quotes

```typescript
const allQuotes = await sdk.quoteService.getAllQuotesWithTxs({
  request: {
    chainId: Chains.ETHEREUM.chainId,
    sellToken: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    buyToken: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    order: {
      type: "sell",
      sellAmount: utils.parseUnits("1000", 6), // 1000 USDC
    },
    slippagePercentage: 1,
    takerAddress: signer.address,
    gasSpeed: {
      speed: "instant",
    },
  },
  config: {
    sort: {
      by: "most-swapped-accounting-for-gas",
    },
  },
});
```

## Overview

The Balmy SDK is a comprehensive TypeScript library that provides a unified interface for interacting with the Balmy protocol and various blockchain networks. The Balmy SDK allows you to interact with the Balmy protocol, providing efficient tools to manage token balances, retrieve trade quotes from DEX aggregators, and check token holdings across multiple chains. It's designed to be modular, with each functionality organized into specialized services that handle specific aspects of blockchain interaction.

### Available Services

The SDK is divided into the following services:

- **[Allowances Service](#allowances-service)**: Manage token approvals and permissions across different chains
- **[Balances Service](#balances-service)**: Query token balances across multiple chains and tokens
- **[Quotes Service](#quotes-service)**: Get optimized swap quotes from various DEX aggregators
- **[Gas Service](#gas-service)**: Optimize transaction costs and estimate gas prices
- **[Prices Service](#prices-service)**: Retrieve token price information across multiple chains
- **[Metadata Service](#metadata-service)**: Access token metadata and information

Each service provides a focused set of functionality while maintaining a consistent interface and error handling approach. This modular design allows developers to use only the services they need while ensuring a cohesive experience across the entire SDK.

## Services

### Allowances Service

The Allowances Service provides functionality to check and manage token allowances across different chains.

#### Objective and Potential

- **Objective**: Enable efficient management of token approvals across multiple chains and protocols
- **Potential Use Cases**:
  - Batch checking multiple token approvals in a single call
  - Optimizing gas costs by checking approvals before transactions
  - Managing permissions for DeFi protocols and dApps
  - Cross-chain allowance monitoring and management

#### Methods

##### `supportedChains()`

Returns an array of chain IDs that are supported by the service.

```typescript
const chains = sdk.allowanceService.supportedChains();
```

##### `getAllowanceInChain(params)`

Gets the allowance for a specific token and spender on a given chain.

```typescript
const allowance = await sdk.allowanceService.getAllowanceInChain({
  chainId: Chains.ETHEREUM.chainId,
  token: "0x...", // Token address
  owner: "0x...", // Owner address
  spender: "0x...", // Spender address
  config: { timeout: TimeString },
});
```

##### `getAllowancesInChain(params)`

Gets multiple allowances in a single call for a specific chain.

```typescript
const allowances = await sdk.allowanceService.getAllowancesInChain({
  chainId: Chains.ETHEREUM.chainId,
  allowances: [
    { token: "0x...", owner: "0x...", spender: "0x..." },
    { token: "0x...", owner: "0x...", spender: "0x..." },
  ],
  config: { timeout: TimeString },
});
```

##### `getAllowances(params)`

Gets allowances across multiple chains in a single call.

```typescript
const allowances = await sdk.allowanceService.getAllowances({
  allowances: [
    {
      chainId: Chains.ETHEREUM.chainId,
      token: "0x...",
      owner: "0x...",
      spender: "0x...",
    },
    {
      chainId: Chains.OPTIMISM.chainId,
      token: "0x...",
      owner: "0x...",
      spender: "0x...",
    },
  ],
  config: { timeout: TimeString },
});
```

### Balances Service

The Balances Service allows querying token balances across multiple chains and tokens.

#### Objective and Potential

- **Objective**: Provide a unified interface for retrieving token balances across multiple chains
- **Potential Use Cases**:
  - Portfolio tracking across multiple chains
  - Balance monitoring for DeFi positions
  - Multi-chain wallet integration
  - Automated balance checks for trading strategies

#### Methods

##### `supportedChains()`

Returns an array of chain IDs that are supported by the service.

```typescript
const chains = sdk.balanceService.supportedChains();
```

##### `getBalancesForAccountInChain(params)`

Gets balances for a specific account in a single chain.

```typescript
const balances = await sdk.balanceService.getBalancesForAccountInChain({
  chainId: Chains.ETHEREUM.chainId,
  account: "0x...",
  tokens: ["0x...", "0x..."],
  config: { timeout: "30s" },
});
```

##### `getBalancesForAccount(params)`

Gets balances for a specific account across multiple chains.

```typescript
const balances = await sdk.balanceService.getBalancesForAccount({
  account: "0x...",
  tokens: [
    { chainId: Chains.ETHEREUM.chainId, token: "0x..." },
    { chainId: Chains.OPTIMISM.chainId, token: "0x..." },
  ],
  config: { timeout: "30s" },
});
```

##### `getBalancesInChain(params)`

Gets balances for multiple accounts in a single chain.

```typescript
const balances = await sdk.balanceService.getBalancesInChain({
  chainId: Chains.ETHEREUM.chainId,
  tokens: [
    { account: "0x...", token: "0x..." },
    { account: "0x...", token: "0x..." },
  ],
  config: { timeout: "30s" },
});
```

##### `getBalances(params)`

Gets balances for multiple accounts across multiple chains.

```typescript
const balances = await sdk.balanceService.getBalances({
  tokens: [
    { chainId: Chains.ETHEREUM.chainId, account: "0x...", token: "0x..." },
    { chainId: Chains.OPTIMISM.chainId, account: "0x...", token: "0x..." },
  ],
  config: { timeout: "30s" },
});
```

### Quotes Service

The Quotes Service provides comprehensive functionality for getting trade quotes from various DEX aggregators.

#### Objective and Potential

- **Objective**: Aggregate and optimize trade quotes from multiple DEX sources
- **Potential Use Cases**:
  - Finding the best trade routes across multiple DEXs
  - Gas-optimized trading strategies
  - Cross-chain arbitrage opportunities
  - Automated trading systems
  - Price impact analysis

#### Methods

##### `supportedSources()`

Returns metadata about all supported quote sources.

```typescript
const sources = sdk.quoteService.supportedSources();
```

##### `supportedChains()`

Returns an array of chain IDs that are supported by the service.

```typescript
const chains = sdk.quoteService.supportedChains();
```

##### `supportedSourcesInChain(params)`

Returns metadata about quote sources supported in a specific chain.

```typescript
const sources = sdk.quoteService.supportedSourcesInChain({
  chainId: Chains.ETHEREUM.chainId,
});
```

##### `supportedGasSpeeds()`

Returns supported gas speeds for each chain.

```typescript
const gasSpeeds = sdk.quoteService.supportedGasSpeeds();
```

##### `estimateQuotes(params)`

Gets estimated quotes from all sources without transaction details.

```typescript
const quotes = sdk.quoteService.estimateQuotes({
  request: {
    chainId: Chains.ETHEREUM.chainId,
    sellToken: "0x...",
    buyToken: "0x...",
    order: { type: "sell", sellAmount: BigInt("1000000") },
    slippagePercentage: 1,
  },
  config: { timeout: TimeString },
});
```

##### `estimateAllQuotes(params)`

Gets estimated quotes from all sources and returns them in a sorted array.

```typescript
const quotes = await sdk.quoteService.estimateAllQuotes({
  request: {
    chainId: Chains.ETHEREUM.chainId,
    sellToken: "0x...",
    buyToken: "0x...",
    order: { type: "sell", sellAmount: BigInt("1000000") },
    slippagePercentage: 1,
  },
  config: {
    ignoredFailed: boolean,
    sort: { by: "most-swapped-accounting-for-gas", using: "gas-price" },
    timeout: TimeString,
  },
});
```

##### `getQuotes(params)`

Gets quotes from all sources with transaction details.

```typescript
const quotes = sdk.quoteService.getQuotes({
  request: {
    chainId: Chains.ETHEREUM.chainId,
    sellToken: "0x...",
    buyToken: "0x...",
    order: { type: "sell", sellAmount: BigInt("1000000") },
    slippagePercentage: 1,
    takerAddress: "0x...",
  },
  config: { timeout: TimeString },
});
```

##### `getAllQuotes(params)`

Gets quotes from all sources and returns them in a sorted array.

```typescript
const quotes = await sdk.quoteService.getAllQuotes({
  request: {
    chainId: Chains.ETHEREUM.chainId,
    sellToken: "0x...",
    buyToken: "0x...",
    order: { type: "sell", sellAmount: BigInt("1000000") },
    slippagePercentage: 1,
    takerAddress: "0x...",
  },
  config: {
    ignoredFailed: boolean,
    sort: { by: "most-swapped-accounting-for-gas", using: "gas-price" },
    timeout: TimeString,
  },
});
```

##### `getBestQuote(params)`

Gets the best quote according to specified criteria.

```typescript
const bestQuote = await sdk.quoteService.getBestQuote({
  request: {
    chainId: Chains.ETHEREUM.chainId,
    sellToken: "0x...",
    buyToken: "0x...",
    order: { type: "sell", sellAmount: BigInt("1000000") },
    slippagePercentage: 1,
    takerAddress: "0x...",
  },
  config: {
    choose: { by: "most-swapped-accounting-for-gas", using: "gas-price" },
    timeout: TimeString,
  },
});
```

##### `getAllQuotesWithTxs(params)`

Gets quotes with built transactions from all sources.

```typescript
const quotesWithTxs = await sdk.quoteService.getAllQuotesWithTxs({
  request: {
    chainId: Chains.ETHEREUM.chainId,
    sellToken: "0x...",
    buyToken: "0x...",
    order: { type: "sell", sellAmount: BigInt("1000000") },
    slippagePercentage: 1,
    takerAddress: "0x...",
  },
  config: {
    ignoredFailed: boolean,
    sort: { by: "most-swapped-accounting-for-gas", using: "gas-price" },
    timeout: TimeString,
  },
});
```

##### `buildTxs(params)`

Builds transactions for given quotes.

```typescript
const txs = sdk.quoteService.buildTxs({
  quotes: quotes,
  sourceConfig: SourceConfig,
  config: { timeout: TimeString },
});
```

##### `buildAllTxs(params)`

Builds transactions for all quotes and returns them in a sorted array.

```typescript
const allTxs = await sdk.quoteService.buildAllTxs({
  quotes: quotes,
  sourceConfig: SourceConfig,
  config: {
    timeout: TimeString,
    ignoredFailed: boolean,
  },
});
```

### Gas Service

The Gas Service provides gas price estimation and optimization across different chains.

#### Objective and Potential

- **Objective**: Optimize transaction costs across different chains and networks
- **Potential Use Cases**:
  - Gas price monitoring and optimization
  - Transaction cost estimation
  - Gas-aware trading strategies
  - Multi-chain gas price comparison
  - Automated gas price optimization

#### Methods

##### `supportedChains()`

Returns an array of chain IDs that are supported by the service.

```typescript
const chains = sdk.gasService.supportedChains();
```

##### `supportedSpeeds()`

Returns supported gas speeds for each chain.

```typescript
const speeds = sdk.gasService.supportedSpeeds();
```

##### `estimateGas(params)`

Estimates gas usage for a transaction.

```typescript
const gasEstimation = await sdk.gasService.estimateGas({
  chainId: Chains.ETHEREUM.chainId,
  tx: {
    from: "0x...",
    to: "0x...",
    data: "0x...",
  },
  config: { timeout: TimeString },
});
```

##### `getGasPrice(params)`

Gets gas prices for different speeds on a chain.

```typescript
const gasPrices = await sdk.gasService.getGasPrice({
  chainId: Chains.ETHEREUM.chainId,
  config: {
    timeout: TimeString,
    fields: {
      standard: "required" | "best effort" | "can ignore",
      fast: "required" | "best effort" | "can ignore",
      instant: "required" | "best effort" | "can ignore",
    },
  },
});
```

##### `calculateGasCost(params)`

Calculates gas cost for a transaction.

```typescript
const gasCost = await sdk.gasService.calculateGasCost({
  chainId: Chains.ETHEREUM.chainId,
  gasEstimation: BigInt("21000"),
  tx: {
    from: "0x...",
    to: "0x...",
    data: "0x...",
  },
  config: {
    timeout: TimeString,
    fields: {
      standard: "required" | "best effort" | "can ignore",
      fast: "required" | "best effort" | "can ignore",
      instant: "required" | "best effort" | "can ignore",
    },
  },
});
```

##### `getQuickGasCalculator(params)`

Gets a quick gas calculator for a specific chain.

```typescript
const calculator = await sdk.gasService.getQuickGasCalculator({
  chainId: Chains.ETHEREUM.chainId,
  config: {
    timeout: TimeString,
    fields: {
      standard: "required" | "best effort" | "can ignore",
      fast: "required" | "best effort" | "can ignore",
      instant: "required" | "best effort" | "can ignore",
    },
  },
});

// Use the calculator
const gasPrices = calculator.getGasPrice();
const gasCost = calculator.calculateGasCost({
  gasEstimation: BigInt("21000"),
  tx: {
    from: "0x...",
    to: "0x...",
    data: "0x...",
  },
});
```

### Prices Service

The Prices Service provides token price information across multiple chains.

#### Objective and Potential

- **Objective**: Provide a unified interface for retrieving token prices across multiple chains
- **Potential Use Cases**:
  - Price feeds for DeFi applications
  - Token value calculations
  - Historical price analysis
  - Price chart generation
  - Multi-chain price aggregation

#### Methods

##### `supportedChains()`

Returns an array of chain IDs that are supported by the service.

```typescript
const chains = sdk.pricesService.supportedChains();
```

##### `supportedQueries()`

Returns the supported price queries for each chain.

```typescript
const queries = sdk.pricesService.supportedQueries();
```

##### `getCurrentPricesInChain(params)`

Gets current prices for tokens in a specific chain.

```typescript
const prices = await sdk.pricesService.getCurrentPricesInChain({
  chainId: Chains.ETHEREUM.chainId,
  tokens: ["0x...", "0x..."],
  config: { timeout: "30s" },
});
```

##### `getCurrentPrices(params)`

Gets current prices for tokens across multiple chains.

```typescript
const prices = await sdk.pricesService.getCurrentPrices({
  tokens: [
    { chainId: Chains.ETHEREUM.chainId, token: "0x..." },
    { chainId: Chains.OPTIMISM.chainId, token: "0x..." },
  ],
  config: { timeout: "30s" },
});
```

##### `getHistoricalPricesInChain(params)`

Gets historical prices for tokens in a specific chain at a given timestamp.

```typescript
const prices = await sdk.pricesService.getHistoricalPricesInChain({
  chainId: Chains.ETHEREUM.chainId,
  tokens: ["0x...", "0x..."],
  timestamp: 1234567890,
  searchWidth: "1h",
  config: { timeout: "30s" },
});
```

##### `getHistoricalPrices(params)`

Gets historical prices for tokens across multiple chains at a given timestamp.

```typescript
const prices = await sdk.pricesService.getHistoricalPrices({
  tokens: [
    { chainId: Chains.ETHEREUM.chainId, token: "0x..." },
    { chainId: Chains.OPTIMISM.chainId, token: "0x..." },
  ],
  timestamp: 1234567890,
  searchWidth: "1h",
  config: { timeout: "30s" },
});
```

##### `getBulkHistoricalPrices(params)`

Gets historical prices for multiple tokens at different timestamps.

```typescript
const prices = await sdk.pricesService.getBulkHistoricalPrices({
  tokens: [
    { chainId: Chains.ETHEREUM.chainId, token: "0x...", timestamp: 1234567890 },
    { chainId: Chains.OPTIMISM.chainId, token: "0x...", timestamp: 1234567890 },
  ],
  searchWidth: "1h",
  config: { timeout: "30s" },
});
```

##### `getChart(params)`

Gets price chart data for tokens over a specified time period.

```typescript
const chart = await sdk.pricesService.getChart({
  tokens: [
    { chainId: Chains.ETHEREUM.chainId, token: "0x..." },
    { chainId: Chains.OPTIMISM.chainId, token: "0x..." },
  ],
  span: 100,
  period: "1d",
  bound: { from: 1234567890 },
  searchWidth: "1h",
});
```

### Metadata Service

The Metadata Service provides token metadata information across multiple chains.

#### Objective and Potential

- **Objective**: Provide a unified interface for retrieving token metadata across multiple chains
- **Potential Use Cases**:
  - Token information display in UIs
  - Token validation and verification
  - Multi-chain token management
  - Token data aggregation

#### Methods

##### `supportedChains()`

Returns an array of chain IDs that are supported by the service.

```typescript
const chains = sdk.metadataService.supportedChains();
```

##### `supportedProperties()`

Returns the supported metadata properties for each chain.

```typescript
const properties = sdk.metadataService.supportedProperties();
```

##### `getMetadataInChain(params)`

Gets metadata for tokens in a specific chain.

```typescript
const metadata = await sdk.metadataService.getMetadataInChain({
  chainId: Chains.ETHEREUM.chainId,
  tokens: ["0x...", "0x..."],
  config: {
    fields: { symbol: "required", decimals: "required" },
    timeout: "30s",
  },
});
```

##### `getMetadata(params)`

Gets metadata for tokens across multiple chains.

```typescript
const metadata = await sdk.metadataService.getMetadata({
  tokens: [
    { chainId: Chains.ETHEREUM.chainId, token: "0x..." },
    { chainId: Chains.OPTIMISM.chainId, token: "0x..." },
  ],
  config: {
    fields: { symbol: "required", decimals: "required" },
    timeout: "30s",
  },
});
```

## Advanced Usage

### Error Handling

The SDK provides comprehensive error handling for all services:

```typescript
try {
  const quotes = await sdk.quoteService.getAllQuotes({...});
} catch (error) {
  if (error instanceof FailedToGenerateAnyQuotesError) {
    // Handle quote generation failure
  }
}
```

### Configuration

Each service can be configured with custom timeouts and other parameters:

```typescript
const quotes = await sdk.quoteService.getAllQuotes({
  request: {...},
  config: {
    timeout: "30s",
    ignoredFailed: true,
    sort: {
      by: "most-swapped-accounting-for-gas",
      using: "gas-price"
    }
  }
});
```

### Multi-chain Support

All services support operations across multiple chains:

```typescript
const balances = await sdk.balanceService.getBalancesForTokens({
  account: "0x...",
  tokens: {
    [Chains.ETHEREUM.chainId]: ["0x..."],
    [Chains.OPTIMISM.chainId]: ["0x..."],
    [Chains.ARBITRUM.chainId]: ["0x..."],
  },
});
```

## 👨‍💻 Development

### Environment Setup

```bash
yarn install
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### [Docs](https://docs.balmy.xyz) | [X](https://x.com/balmy_xyz) | [Discord](http://discord.balmy.xyz/)
