import { IAllowanceService } from '@services/allowances';
import { IBalanceService } from '@services/balances/types';
import { IFetchService } from '@services/fetch/types';
import { IGasService, SupportedGasValues } from '@services/gas/types';
import { IPriceService } from '@services/prices';
import { IProviderService } from '@services/providers';
import { IQuoteService } from '@services/quotes/types';
import { IMetadataService } from '@services/metadata/types';
import { CalculateMetadataFromSourceParams } from './builders/metadata-builder';
import { CalculateGasValuesFromSourceParams } from './builders/gas-builder';
import { ILogsService } from '@services/logs';
import { IBlocksService } from '@services/blocks';

export type ISDK<
  TokenMetadata extends object = CalculateMetadataFromSourceParams<undefined>,
  GasValues extends SupportedGasValues = CalculateGasValuesFromSourceParams<undefined>
> = {
  providerService: IProviderService;
  fetchService: IFetchService;
  gasService: IGasService<GasValues>;
  allowanceService: IAllowanceService;
  balanceService: IBalanceService;
  quoteService: IQuoteService;
  priceService: IPriceService;
  logsService: ILogsService;
  metadataService: IMetadataService<TokenMetadata>;
  blocksService: IBlocksService;
};
