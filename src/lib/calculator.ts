/**
 * 主计算流程：交易流水 -> 每笔 fee、平台净收入、返佣分配（階差基數為毛 feeUsd，不扣 EdgeX）-> 汇总报表
 */
import type { UserInput, TradeInput, RebateOverrideInput } from "@/types";
import type { ResolvedUser } from "@/lib/resolve-users";
import { resolveUsers } from "@/lib/resolve-users";
import { calcFeeAndPlatformNet } from "@/lib/calc-fee";
import {
  getAncestorChain,
  calcRebateAllocations,
  type RebateAllocation,
} from "@/lib/rebate";
import {
  getDefaultCalculatorRules,
  type CalculatorRules,
} from "@/lib/calculator-rules";

export interface TradeResult {
  trade: TradeInput;
  feeUsd: number;
  edgexUsd: number;
  platformNetUsd: number;
  allocations: RebateAllocation[];
}

export interface CalculatorInput {
  users: UserInput[];
  trades: TradeInput[];
  overrides?: RebateOverrideInput[];
  /** 用于 30 日窗口；默认取最后一笔交易日期 */
  asOfDate?: Date;
  /** 生效規則（VIP/EdgeX/返傭階梯等）；未傳則用預設 config */
  rules?: CalculatorRules;
}

export interface CalculatorResult {
  resolvedUsers: Map<string, ResolvedUser>;
  tradeResults: TradeResult[];
  platformTotalNetUsd: number;
  userRebateTotalUsd: Map<string, number>;
}

export function runCalculator(input: CalculatorInput): CalculatorResult {
  const { users, trades, overrides = [] } = input;
  const rules = input.rules ?? getDefaultCalculatorRules();
  const asOfDate =
    input.asOfDate ??
    (trades.length
      ? new Date(
          Math.max(
            ...trades.map((t) => new Date(t.timestamp).getTime())
          )
        )
      : new Date());

  const resolvedUsers = resolveUsers(
    users,
    trades.map((t) => ({
      userId: t.userId,
      timestamp: t.timestamp,
      volumeUsd: t.volumeUsd,
    })),
    asOfDate,
    rules
  );

  const referrerMap = new Map<string, string>();
  users.forEach((u) => {
    if (u.referrerId) referrerMap.set(u.id, u.referrerId);
  });

  const tradeResults: TradeResult[] = [];
  let platformTotalNetUsd = 0;
  const userRebateTotalUsd = new Map<string, number>();

  for (const trade of trades) {
    const resolved = resolvedUsers.get(trade.userId);
    if (!resolved) {
      tradeResults.push({
        trade,
        feeUsd: 0,
        edgexUsd: 0,
        platformNetUsd: 0,
        allocations: [],
      });
      continue;
    }

    const tier = resolved.vipTier;
    const feeResult = calcFeeAndPlatformNet(
      trade.volumeUsd,
      trade.side,
      tier,
      rules.edgexShare
    );

    const chain = getAncestorChain(trade.userId, referrerMap);
    const rebatePercents = chain.map(
      (id) => resolvedUsers.get(id)?.rebatePercent ?? 0
    );
    const rebateBaseUsd = feeResult.feeUsd;
    const allocations = calcRebateAllocations(
      rebateBaseUsd,
      chain,
      rebatePercents,
      overrides
    );

    tradeResults.push({
      trade,
      feeUsd: feeResult.feeUsd,
      edgexUsd: feeResult.edgexUsd,
      platformNetUsd: feeResult.platformNetUsd,
      allocations,
    });

    platformTotalNetUsd += feeResult.platformNetUsd;
    allocations.forEach((a) => {
      userRebateTotalUsd.set(
        a.userId,
        (userRebateTotalUsd.get(a.userId) ?? 0) + a.amountUsd
      );
    });
  }

  return {
    resolvedUsers,
    tradeResults,
    platformTotalNetUsd,
    userRebateTotalUsd,
  };
}
