import { createTransport, EIP1193RequestFn, Transport } from 'viem';
import { ChainId } from '@types';
import { IProviderSource } from '../types';

export class ByMethodProviderSource implements IProviderSource {
  constructor(private readonly defaultSource: IProviderSource, private readonly sourcesByMethod: Record<string, IProviderSource>) {
    if (Object.keys(sourcesByMethod).length === 0) throw new Error('Need at least one source by method');
  }

  supportedChains() {
    return this.defaultSource.supportedChains();
  }

  getViemTransport({ chainId }: { chainId: ChainId }) {
    const transportsByMethod = Object.fromEntries(
      Object.entries(this.sourcesByMethod)
        .filter(([, source]) => source.supportedChains().includes(chainId))
        .map(([method, source]) => [method, source.getViemTransport({ chainId })])
    );
    const defaultTransport = this.defaultSource.getViemTransport({ chainId });
    return byMethod(defaultTransport, transportsByMethod);
  }
}

function byMethod(defaultTransportBuilder: Transport, buildersByMethod: Record<string, Transport>): Transport {
  return (params) => {
    const transportByMethod = Object.fromEntries(Object.entries(buildersByMethod).map(([method, t]) => [method, t(params)]));
    const defaultTransport = defaultTransportBuilder(params);
    const request: EIP1193RequestFn = async ({ method, ...params }: { method: string }): Promise<any> => {
      const transport = transportByMethod[method] ?? defaultTransport;
      return transport.request({ method, ...params });
    };
    return createTransport({
      key: 'by-method',
      name: 'By Method',
      type: 'by-method',
      request,
    });
  };
}
