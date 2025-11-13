import { ChainId } from '@types';
import { BaseHttpProvider, HttpProviderConfig } from './base/base-http-provider';
import { Chains } from '@chains';

const SUPPORTED_CHAINS = [
  Chains.ARBITRUM,
  Chains.ARBITRUM_NOVA,
  Chains.AURORA,
  Chains.AVALANCHE,
  Chains.BASE,
  Chains.BLAST,
  Chains.BOBA,
  Chains.BNB_CHAIN,
  Chains.CELO,
  Chains.ETHEREUM,
  Chains.FANTOM,
  Chains.GNOSIS,
  Chains.HARMONY_SHARD_0,
  Chains.LINEA,
  Chains.MANTLE,
  Chains.MOONBEAM,
  Chains.OPTIMISM,
  Chains.opBNB,
  Chains.PLASMA,
  Chains.POLYGON,
  Chains.ROOTSTOCK,
  Chains.SCROLL,
  Chains.ETHEREUM_SEPOLIA,
  Chains.SONIC,
  Chains.UNICHAIN,
  Chains.ZK_SYNC_ERA,
];

export class EnvioProviderSource extends BaseHttpProvider {
  private readonly key?: string;
  private readonly supported: ChainId[];

  constructor({ key, onChains, config }: { key?: string; onChains?: ChainId[]; config?: HttpProviderConfig }) {
    super({
      methods: {
        include: [
          // Envio only supports these methods
          'eth_chainId',
          'eth_blockNumber',
          'eth_getBlockByNumber',
          'eth_getBlockByHash',
          'eth_getBlockReceipts',
          'eth_getTransactionByHash',
          'eth_getTransactionByBlockHashAndIndex',
          'eth_getTransactionByBlockNumberAndIndex',
          'eth_getTransactionReceipt',
        ],
      },
      ...config,
    });
    this.key = key;
    this.supported = onChains ?? envioSupportedChains();
  }

  supportedChains(): ChainId[] {
    return this.supported;
  }

  protected calculateUrl(chainId: ChainId): string {
    return buildEnvioRPCUrl({ chainId, apiKey: this.key });
  }
}

export function envioSupportedChains(): ChainId[] {
  return SUPPORTED_CHAINS.map(({ chainId }) => chainId);
}

export function buildEnvioRPCUrl({ chainId, apiKey }: { chainId: ChainId; apiKey?: string }) {
  return `https://${chainId}.hypersync.xyz/${apiKey}`;
}
