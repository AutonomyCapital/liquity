import { Decimal } from "@liquity/decimal";

import { Trove, TroveWithPendingRewards } from "./Trove";
import { StabilityDeposit } from "./StabilityDeposit";
import { Fees } from "./Fees";
import { LQTYStake } from "./LQTYStake";

export type FrontendStatus =
  | { status: "unregistered" }
  | { status: "registered"; kickbackRate: Decimal };

export interface ReadableLiquity {
  getTotalRedistributed(): Promise<Trove>;

  getTroveWithoutRewards(address?: string): Promise<TroveWithPendingRewards>;

  getTrove(address?: string): Promise<Trove>;

  getNumberOfTroves(): Promise<number>;

  getPrice(): Promise<Decimal>;

  getTotal(): Promise<Trove>;

  getStabilityDeposit(address?: string): Promise<StabilityDeposit>;

  getLUSDInStabilityPool(): Promise<Decimal>;

  getLUSDBalance(address?: string): Promise<Decimal>;

  getLQTYBalance(address?: string): Promise<Decimal>;

  getCollateralSurplusBalance(address?: string): Promise<Decimal>;

  getLastTroves(
    startIdx: number,
    numberOfTroves: number
  ): Promise<[string, TroveWithPendingRewards][]>;

  getFirstTroves(
    startIdx: number,
    numberOfTroves: number
  ): Promise<[string, TroveWithPendingRewards][]>;

  getFees(): Promise<Fees>;

  getLQTYStake(address?: string): Promise<LQTYStake>;

  getTotalStakedLQTY(): Promise<Decimal>;

  getFrontendStatus(address?: string): Promise<FrontendStatus>;
}
