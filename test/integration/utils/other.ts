import { Chains } from '@chains';

export const CHAINS_WITH_KNOWN_ISSUES = [
  Chains.AURORA,
  Chains.ASTAR,
  Chains.OASIS_EMERALD,
  Chains.VELAS,
  Chains.POLYGON_ZKEVM,
  Chains.ETHEREUM_SEPOLIA,
  Chains.ETHEREUM_GOERLI,
  Chains.POLYGON_MUMBAI,
  Chains.BASE_GOERLI,
  Chains.BOBA,
  Chains.opBNB,
  Chains.HECO,
  Chains.EVMOS,
  Chains.CANTO,
].map(({ chainId }) => chainId);
