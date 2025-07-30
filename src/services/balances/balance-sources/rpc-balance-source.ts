import { parseAbi, Address as ViemAddress } from 'viem';
import { Address, ChainId, TimeString, TokenAddress } from '@types';
import { BalanceInput, IBalanceSource } from '../types';
import { IProviderService } from '@services/providers/types';
import ERC20_ABI from '@shared/abis/erc20';
import { MULTICALL_CONTRACT } from '@services/providers/utils';
import { filterRejectedResults, groupByChain, isSameAddress } from '@shared/utils';
import { Addresses } from '@shared/constants';
import { timeoutPromise } from '@shared/timeouts';
import { ILogger, ILogsService } from '@services/logs';

export type RPCBalanceSourceConfig = {
  batching?: { maxSizeInBytes: number };
};
export class RPCBalanceSource implements IBalanceSource {
  private readonly logger: ILogger;
  constructor(
    private readonly providerService: IProviderService,
    logs: ILogsService,
    private readonly config?: RPCBalanceSourceConfig | undefined
  ) {
    this.logger = logs.getLogger({ name: 'RPCBalanceSource' });
  }

  async getBalances({
    tokens,
    config,
  }: {
    tokens: BalanceInput[];
    config?: { timeout?: TimeString };
  }): Promise<Record<ChainId, Record<Address, Record<TokenAddress, bigint>>>> {
    const groupedByChain = groupByChain(tokens);
    const promises = Object.entries(groupedByChain).map<Promise<[ChainId, Record<Address, Record<TokenAddress, bigint>>]>>(
      async ([chainId, tokens]) => [
        Number(chainId),
        await timeoutPromise(this.fetchBalancesInChain(Number(chainId), tokens), config?.timeout, {
          reduceBy: '100',
          onTimeout: (timeout) => this.logger.debug(`Fetch balances in chain ${chainId} timeouted after ${timeout}`),
        }),
      ]
    );
    return Object.fromEntries(await filterRejectedResults(promises));
  }

  supportedChains(): ChainId[] {
    return this.providerService.supportedChains();
  }

  private async fetchBalancesInChain(
    chainId: ChainId,
    tokens: Omit<BalanceInput, 'chainId'>[],
    config?: { timeout?: TimeString }
  ): Promise<Record<Address, Record<TokenAddress, bigint>>> {
    if (tokens.length === 0) return {};

    const contracts = tokens.map(({ account, token }) =>
      isSameAddress(token, Addresses.NATIVE_TOKEN)
        ? {
            abi: MULTICALL_ABI,
            functionName: 'getEthBalance' as const,
            args: [account],
            address: MULTICALL_CONTRACT.address(chainId),
          }
        : {
            address: token as ViemAddress,
            abi: ERC20_ABI,
            functionName: 'balanceOf' as const,
            args: [account],
          }
    );

    const multicallResults = await this.providerService.getViemPublicClient({ chainId }).multicall({
      contracts,
      multicallAddress: MULTICALL_CONTRACT.address(chainId),
      batchSize: this.config?.batching?.maxSizeInBytes ?? 0,
    });

    const result: Record<Address, Record<TokenAddress, bigint>> = {};
    for (let i = 0; i < tokens.length; i++) {
      const multicallResult = multicallResults[i];
      if (multicallResult.status === 'failure') continue;
      const { account, token } = tokens[i];
      if (!(account in result)) result[account] = {};
      result[account][token] = multicallResult.result as unknown as bigint;
    }
    return result;
  }
}

// The Multicall3 contract has this function that we can use to fetch all native balances in one call
const MULTICALL_ABI = parseAbi(['function getEthBalance(address addr) external view returns (uint256 balance)']);
