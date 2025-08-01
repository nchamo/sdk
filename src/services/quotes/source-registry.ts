import { GlobalQuoteSourceConfig, SourceId, SourceMetadata } from './types';
import { Without } from '@utility-types';
import { IQuoteSource, QuoteSourceSupport } from './quote-sources/types';
import { OdosQuoteSource } from './quote-sources/odos-quote-source';
import { ParaswapQuoteSource } from './quote-sources/paraswap-quote-source';
import { ZRXQuoteSource } from './quote-sources/0x-quote-source';
import { OneInchQuoteSource } from './quote-sources/1inch-quote-source';
import { UniswapQuoteSource } from './quote-sources/uniswap-quote-source';
import { OpenOceanQuoteSource } from './quote-sources/open-ocean-quote-source';
import { LiFiQuoteSource } from './quote-sources/li-fi-quote-source';
import { KyberswapQuoteSource } from './quote-sources/kyberswap-quote-source';
import { RangoQuoteSource } from './quote-sources/rango-quote-source';
import { ChangellyQuoteSource } from './quote-sources/changelly-quote-source';
import { PortalsFiQuoteSource } from './quote-sources/portals-fi-quote-source';
import { OKXDexQuoteSource } from './quote-sources/okx-dex-quote-source';
import { BebopQuoteSource } from './quote-sources/bebop-quote-source';
import { XYFinanceQuoteSource } from './quote-sources/xy-finance-quote-source';
import { FlyTradeQuoteSource } from './quote-sources/fly-trade-quote-source';
import { SquidQuoteSource } from './quote-sources/squid-quote-source';
import { ConveyorQuoteSource } from './quote-sources/conveyor-quote-source';
import { EnsoQuoteSource } from './quote-sources/enso-quote-source';
import { BrainDexQuoteSource } from './quote-sources/braindex-quote-source';
import { BarterQuoteSource } from './quote-sources/barter-quote-source';
import { DodoDexQuoteSource } from './quote-sources/dodo-quote-source';
import { SwingQuoteSource } from './quote-sources/swing-quote-source';
import { SushiswapQuoteSource } from './quote-sources/sushiswap-quote-source';

export const QUOTE_SOURCES = {
  bebop: new BebopQuoteSource(),
  paraswap: new ParaswapQuoteSource(),
  'xy-finance': new XYFinanceQuoteSource(),
  '0x': new ZRXQuoteSource(),
  '1inch': new OneInchQuoteSource(),
  uniswap: new UniswapQuoteSource(),
  'open-ocean': new OpenOceanQuoteSource(),
  'li-fi': new LiFiQuoteSource(),
  kyberswap: new KyberswapQuoteSource(),
  odos: new OdosQuoteSource(),
  braindex: new BrainDexQuoteSource(),
  barter: new BarterQuoteSource(),
  rango: new RangoQuoteSource(),
  changelly: new ChangellyQuoteSource(),
  ['fly-trade']: new FlyTradeQuoteSource(),
  squid: new SquidQuoteSource(),
  'portals-fi': new PortalsFiQuoteSource(),
  enso: new EnsoQuoteSource(),
  'okx-dex': new OKXDexQuoteSource(),
  conveyor: new ConveyorQuoteSource(),
  dodo: new DodoDexQuoteSource(),
  swing: new SwingQuoteSource(),
  sushiswap: new SushiswapQuoteSource(),
} satisfies Record<SourceId, IQuoteSource<QuoteSourceSupport, any>>;

export const SOURCES_METADATA = Object.fromEntries(
  Object.entries(QUOTE_SOURCES).map(([sourceId, source]) => [sourceId, source.getMetadata()])
) as Record<keyof typeof QUOTE_SOURCES, SourceMetadata>;

export type SourceWithConfigId = keyof LocalSourcesConfig;
export type SourceConfig = { global?: GlobalQuoteSourceConfig; custom?: Partial<LocalSourcesConfig> };
export type LocalSourceConfig = LocalSourcesConfig[keyof LocalSourcesConfig];
type ImplementedSources = typeof QUOTE_SOURCES;
type LocalSourcesConfig = Without<
  { [K in keyof AllLocalSourcesConfig]: ConfigHasKeys<AllLocalSourcesConfig[K]> extends true ? AllLocalSourcesConfig[K] : never },
  never
>;
type AllLocalSourcesConfig = {
  [K in keyof ImplementedSources]: ImplementedSources[K] extends IQuoteSource<any, any>
    ? GetCustomConfigFromSource<ImplementedSources[K]>
    : never;
};
type ConfigHasKeys<CustomQuoteSourceConfig extends object> = keyof CustomQuoteSourceConfig extends never ? false : true;
type GetCustomConfigFromSource<T extends IQuoteSource<any, any>> = T extends IQuoteSource<any, infer CustomQuoteSourceConfig>
  ? CustomQuoteSourceConfig
  : never;
