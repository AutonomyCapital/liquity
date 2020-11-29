import { JsonFragment, LogDescription, Result } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { Signer } from "@ethersproject/abstract-signer";
import { Provider, Log } from "@ethersproject/abstract-provider";
import {
  Contract,
  ContractInterface,
  ContractFunction,
  Overrides,
  PopulatedTransaction
} from "@ethersproject/contracts";

import activePoolAbi from "../abi/ActivePool.json";
import borrowerOperationsAbi from "../abi/BorrowerOperations.json";
import cdpManagerAbi from "../abi/CDPManager.json";
import clvTokenAbi from "../abi/CLVToken.json";
import communityIssuanceAbi from "../abi/CommunityIssuance.json";
import defaultPoolAbi from "../abi/DefaultPool.json";
import lqtyTokenAbi from "../abi/LQTYToken.json";
import hintHelpersAbi from "../abi/HintHelpers.json";
import lockupContractFactoryAbi from "../abi/LockupContractFactory.json";
import lqtyStakingAbi from "../abi/LQTYStaking.json";
import multiCDPgetterAbi from "../abi/MultiCDPGetter.json";
import priceFeedAbi from "../abi/PriceFeed.json";
import sortedCDPsAbi from "../abi/SortedCDPs.json";
import stabilityPoolAbi from "../abi/StabilityPool.json";
import collSurplusPoolAbi from "../abi/CollSurplusPool.json";

import dev from "../deployments/dev.json";
import goerli from "../deployments/goerli.json";
import kovan from "../deployments/kovan.json";
import rinkeby from "../deployments/rinkeby.json";
import ropsten from "../deployments/ropsten.json";

import {
  ActivePool,
  BorrowerOperations,
  CDPManager,
  CLVToken,
  CommunityIssuance,
  DefaultPool,
  LQTYToken,
  HintHelpers,
  LockupContractFactory,
  LQTYStaking,
  MultiCDPGetter,
  PriceFeed,
  SortedCDPs,
  StabilityPool,
  CollSurplusPool
} from "../types";

export const abi: { [name: string]: JsonFragment[] } = {
  activePool: activePoolAbi,
  borrowerOperations: borrowerOperationsAbi,
  cdpManager: cdpManagerAbi,
  clvToken: clvTokenAbi,
  communityIssuance: communityIssuanceAbi,
  defaultPool: defaultPoolAbi,
  lqtyToken: lqtyTokenAbi,
  hintHelpers: hintHelpersAbi,
  lockupContractFactory: lockupContractFactoryAbi,
  lqtyStaking: lqtyStakingAbi,
  multiCDPgetter: multiCDPgetterAbi,
  priceFeed: priceFeedAbi,
  sortedCDPs: sortedCDPsAbi,
  stabilityPool: stabilityPoolAbi,
  collSurplusPool: collSurplusPoolAbi
};

export interface TypedLogDescription<T> extends Omit<LogDescription, "args"> {
  args: T;
}

type BucketOfFunctions = Record<string, (...args: any[]) => any>;

// Removes unsafe index signatures from an Ethers contract type
type TypeSafeContract<T> = Pick<
  T,
  {
    [P in keyof T]: BucketOfFunctions extends T[P] ? never : P;
  } extends {
    [_ in keyof T]: infer U;
  }
    ? U
    : never
>;

type EstimatedContractFunction<R = unknown, A extends unknown[] = unknown[], O = Overrides> = (
  overrides: O,
  adjustGas: (gas: BigNumber) => BigNumber,
  ...args: A
) => Promise<R>;

export type TypedContract<T, U> = TypeSafeContract<T> &
  U & {
    // readonly estimateAndCall: {
    //   [P in keyof U]: U[P] extends (...args: [...infer A, infer O | undefined]) => Promise<infer R>
    //     ? EstimatedContractFunction<R, A, O>
    //     : never;
    // };

    readonly estimateAndPopulate: {
      [P in keyof U]: U[P] extends (...args: [...infer A, infer O | undefined]) => unknown
        ? EstimatedContractFunction<PopulatedTransaction, A, O>
        : never;
    };
  };

const buildEstimatedFunctions = <T>(
  estimateFunctions: Record<string, ContractFunction<BigNumber>>,
  functions: Record<string, ContractFunction<T>>
): Record<string, EstimatedContractFunction<T>> =>
  Object.fromEntries(
    Object.keys(estimateFunctions).map(functionName => [
      functionName,
      async (overrides, adjustEstimate, ...args) => {
        if (overrides.gasLimit === undefined) {
          const estimatedGas = await estimateFunctions[functionName](...args, overrides);

          overrides = {
            ...overrides,
            gasLimit: adjustEstimate(estimatedGas)
          };
        }

        return functions[functionName](...args, overrides);
      }
    ])
  );

export class LiquityContract extends Contract {
  // readonly estimateAndCall: Record<string, EstimatedContractFunction>;
  readonly estimateAndPopulate: Record<string, EstimatedContractFunction<PopulatedTransaction>>;

  constructor(
    addressOrName: string,
    contractInterface: ContractInterface,
    signerOrProvider?: Signer | Provider
  ) {
    super(addressOrName, contractInterface, signerOrProvider);

    // this.estimateAndCall = buildEstimatedFunctions(this.estimateGas, this);
    this.estimateAndPopulate = buildEstimatedFunctions(this.estimateGas, this.populateTransaction);
  }

  extractEvents(logs: Log[], name: string): TypedLogDescription<unknown>[] {
    return logs
      .filter(log => log.address === this.address)
      .map(log => this.interface.parseLog(log))
      .filter(e => e.name === name);
  }
}

export interface LiquityContractAddresses {
  activePool: string;
  borrowerOperations: string;
  cdpManager: string;
  clvToken: string;
  communityIssuance: string;
  defaultPool: string;
  lqtyToken: string;
  hintHelpers: string;
  lockupContractFactory: string;
  lqtyStaking: string;
  multiCDPgetter: string;
  priceFeed: string;
  sortedCDPs: string;
  stabilityPool: string;
  collSurplusPool: string;
}

export interface LiquityContracts {
  [name: string]: TypeSafeContract<LiquityContract>;

  activePool: ActivePool;
  borrowerOperations: BorrowerOperations;
  cdpManager: CDPManager;
  clvToken: CLVToken;
  communityIssuance: CommunityIssuance;
  defaultPool: DefaultPool;
  lqtyToken: LQTYToken;
  hintHelpers: HintHelpers;
  lockupContractFactory: LockupContractFactory;
  lqtyStaking: LQTYStaking;
  multiCDPgetter: MultiCDPGetter;
  priceFeed: PriceFeed;
  sortedCDPs: SortedCDPs;
  stabilityPool: StabilityPool;
  collSurplusPool: CollSurplusPool;
}

export const addressesOf = (contracts: LiquityContracts): LiquityContractAddresses => ({
  activePool: contracts.activePool.address,
  borrowerOperations: contracts.borrowerOperations.address,
  cdpManager: contracts.cdpManager.address,
  clvToken: contracts.clvToken.address,
  communityIssuance: contracts.communityIssuance.address,
  defaultPool: contracts.defaultPool.address,
  lqtyToken: contracts.lqtyToken.address,
  hintHelpers: contracts.hintHelpers.address,
  lockupContractFactory: contracts.lockupContractFactory.address,
  lqtyStaking: contracts.lqtyStaking.address,
  multiCDPgetter: contracts.multiCDPgetter.address,
  priceFeed: contracts.priceFeed.address,
  sortedCDPs: contracts.sortedCDPs.address,
  stabilityPool: contracts.stabilityPool.address,
  collSurplusPool: contracts.collSurplusPool.address
});

const create = <T extends TypedContract<LiquityContract, unknown>>(
  address: string,
  contractInterface: ContractInterface,
  signerOrProvider: Signer | Provider
) => (new LiquityContract(address, contractInterface, signerOrProvider) as unknown) as T;

export const connectToContracts = (
  addresses: LiquityContractAddresses,
  signerOrProvider: Signer | Provider
): LiquityContracts => ({
  activePool: create<ActivePool>(addresses.activePool, activePoolAbi, signerOrProvider),

  borrowerOperations: create<BorrowerOperations>(
    addresses.borrowerOperations,
    borrowerOperationsAbi,
    signerOrProvider
  ),

  cdpManager: create<CDPManager>(addresses.cdpManager, cdpManagerAbi, signerOrProvider),

  clvToken: create<CLVToken>(addresses.clvToken, clvTokenAbi, signerOrProvider),

  collSurplusPool: create<CollSurplusPool>(
    addresses.collSurplusPool,
    collSurplusPoolAbi,
    signerOrProvider
  ),

  communityIssuance: create<CommunityIssuance>(
    addresses.communityIssuance,
    communityIssuanceAbi,
    signerOrProvider
  ),

  defaultPool: create<DefaultPool>(addresses.defaultPool, defaultPoolAbi, signerOrProvider),

  lqtyToken: create<LQTYToken>(addresses.lqtyToken, lqtyTokenAbi, signerOrProvider),

  hintHelpers: create<HintHelpers>(addresses.hintHelpers, hintHelpersAbi, signerOrProvider),

  lockupContractFactory: create<LockupContractFactory>(
    addresses.lockupContractFactory,
    lockupContractFactoryAbi,
    signerOrProvider
  ),

  lqtyStaking: create<LQTYStaking>(addresses.lqtyStaking, lqtyStakingAbi, signerOrProvider),

  multiCDPgetter: create<MultiCDPGetter>(
    addresses.multiCDPgetter,
    multiCDPgetterAbi,
    signerOrProvider
  ),

  priceFeed: create<PriceFeed>(addresses.priceFeed, priceFeedAbi, signerOrProvider),

  sortedCDPs: create<SortedCDPs>(addresses.sortedCDPs, sortedCDPsAbi, signerOrProvider),

  stabilityPool: create<StabilityPool>(addresses.stabilityPool, stabilityPoolAbi, signerOrProvider)
});

export type LiquityDeployment = {
  addresses: LiquityContractAddresses;
  version: string;
  deploymentDate: number;
  abiHash: string;
};

export const DEV_CHAIN_ID = 17;

type DevDeployment = {
  dev: LiquityDeployment;
  [DEV_CHAIN_ID]: LiquityDeployment;
};

const devDeployment: DevDeployment | {} =
  dev !== null
    ? {
        dev,
        [DEV_CHAIN_ID]: dev
      }
    : {};

export const deploymentOnNetwork: {
  [network: string]: LiquityDeployment;
  [chainId: number]: LiquityDeployment;
} = {
  goerli,
  kovan,
  rinkeby,
  ropsten,

  3: ropsten,
  4: rinkeby,
  5: goerli,
  42: kovan,

  ...devDeployment
};
