import { Chains } from '@chains';
import { ChainId } from '@types';

export const ALCHEMY_NETWORKS: Record<
  ChainId,
  { key: string; rpc: { tier: 'free' | 'paid' }; price: { supported: boolean }; blocks: { supported: boolean } }
> = {
  [Chains.ETHEREUM.chainId]: { key: 'eth-mainnet', rpc: { tier: 'free' }, price: { supported: true }, blocks: { supported: true } },
  [Chains.ETHEREUM_SEPOLIA.chainId]: { key: 'eth-sepolia', rpc: { tier: 'free' }, price: { supported: false }, blocks: { supported: false } },
  [Chains.OPTIMISM.chainId]: { key: 'opt-mainnet', rpc: { tier: 'free' }, price: { supported: true }, blocks: { supported: true } },
  [Chains.ARBITRUM.chainId]: { key: 'arb-mainnet', rpc: { tier: 'free' }, price: { supported: true }, blocks: { supported: true } },
  [Chains.POLYGON.chainId]: { key: 'polygon-mainnet', rpc: { tier: 'free' }, price: { supported: true }, blocks: { supported: true } },
  [Chains.POLYGON_MUMBAI.chainId]: { key: 'polygon-mumbai', rpc: { tier: 'free' }, price: { supported: false }, blocks: { supported: false } },
  [Chains.ASTAR.chainId]: { key: 'astar-mainnet', rpc: { tier: 'free' }, price: { supported: false }, blocks: { supported: false } },
  [Chains.BLAST.chainId]: { key: 'blast-mainnet', rpc: { tier: 'free' }, price: { supported: true }, blocks: { supported: true } },
  [Chains.BNB_CHAIN.chainId]: { key: 'bnb-mainnet', rpc: { tier: 'paid' }, price: { supported: true }, blocks: { supported: true } },
  [Chains.AVALANCHE.chainId]: { key: 'avax-mainnet', rpc: { tier: 'paid' }, price: { supported: true }, blocks: { supported: true } },
  [Chains.FANTOM.chainId]: { key: 'fantom-mainnet', rpc: { tier: 'free' }, price: { supported: true }, blocks: { supported: false } },
  [Chains.METIS_ANDROMEDA.chainId]: { key: 'metis-mainnet', rpc: { tier: 'paid' }, price: { supported: true }, blocks: { supported: false } },
  [Chains.POLYGON_ZKEVM.chainId]: {
    key: 'polygonzkevm-mainnet',
    rpc: { tier: 'free' },
    price: { supported: true },
    blocks: { supported: false },
  },
  [Chains.BASE.chainId]: { key: 'base-mainnet', rpc: { tier: 'free' }, price: { supported: true }, blocks: { supported: true } },
  [Chains.GNOSIS.chainId]: { key: 'gnosis-mainnet', rpc: { tier: 'paid' }, price: { supported: true }, blocks: { supported: false } },
  [Chains.SCROLL.chainId]: { key: 'scroll-mainnet', rpc: { tier: 'free' }, price: { supported: true }, blocks: { supported: false } },
  [Chains.opBNB.chainId]: { key: 'opbnb-mainnet', rpc: { tier: 'paid' }, price: { supported: true }, blocks: { supported: false } },
  [Chains.MANTLE.chainId]: { key: 'mantle-mainnet', rpc: { tier: 'free' }, price: { supported: false }, blocks: { supported: false } },
  [Chains.ROOTSTOCK.chainId]: { key: 'rootstock-mainnet', rpc: { tier: 'free' }, price: { supported: false }, blocks: { supported: false } },
  [Chains.LINEA.chainId]: { key: 'linea-mainnet', rpc: { tier: 'free' }, price: { supported: true }, blocks: { supported: false } },
  [Chains.SONIC.chainId]: { key: 'sonic-mainnet', rpc: { tier: 'free' }, price: { supported: false }, blocks: { supported: false } },
  [Chains.ZK_SYNC_ERA.chainId]: { key: 'zksync-mainnet', rpc: { tier: 'free' }, price: { supported: true }, blocks: { supported: true } },
  [Chains.CELO.chainId]: { key: 'celo-mainnet', rpc: { tier: 'free' }, price: { supported: false }, blocks: { supported: true } },
};
