/**
 * 3 层返佣分配
 * 从交易者往上最多 3 层；返佣基于该笔 fee，按 rebate% 差额分配。
 */
import type { RebateOverrideInput } from "@/types";

export interface RebateAllocation {
  userId: string;
  amountUsd: number;
  rebatePercent: number;
  layer: number; // 1=交易者本人, 2=直接上线, 3=上线的上线
  fromTraderUserId: string;
}

/**
 * 获取从交易者往上最多 3 层的用户 id 列表 [交易者, 上线1, 上线2]
 */
export function getAncestorChain(
  traderId: string,
  referrerMap: Map<string, string>
): string[] {
  const chain: string[] = [traderId];
  let current = traderId;
  for (let i = 0; i < 2; i++) {
    const ref = referrerMap.get(current);
    if (!ref) break;
    chain.push(ref);
    current = ref;
  }
  return chain;
}

/**
 * 检查是否存在手动覆盖：A 从 B 的返佣比例（当 A、B 同为大使等情况）
 */
export function getOverrideRebatePercent(
  fromUserId: string,
  toUserId: string,
  overrides: RebateOverrideInput[]
): number | null {
  const o = overrides.find(
    (x) => x.fromUserId === fromUserId && x.toUserId === toUserId
  );
  return o ? o.rebatePercent : null;
}

/**
 * 3 层分配：基数 = 该笔平台净收入（fee - EdgeX）
 * 第1层（交易者）拿 base * rebate[0]
 * 第2层拿 base * (rebate[1] - rebate[0])
 * 第3层拿 base * (rebate[2] - rebate[1] - rebate[0])
 * 若同等级大使默认上线不拿下线，除非有手动覆盖
 */
export function calcRebateAllocations(
  rebateBaseUsd: number,
  chain: string[],
  rebatePercents: number[], // 与 chain 同序 [交易者, 上线1, 上线2]
  overrides: RebateOverrideInput[],
  isAmbassadorOrInvestor: (userId: string) => boolean
): RebateAllocation[] {
  const result: RebateAllocation[] = [];
  const traderId = chain[0];

  const r0 = Math.max(0, rebatePercents[0] ?? 0);
  result.push({
    userId: chain[0],
    amountUsd: rebateBaseUsd * (r0 / 100),
    rebatePercent: r0,
    layer: 1,
    fromTraderUserId: traderId,
  });

  let usedPercent = r0;

  for (let i = 1; i < chain.length; i++) {
    const uplineId = chain[i];
    const uplineRebate = Math.max(0, rebatePercents[i] ?? 0);
    const override = getOverrideRebatePercent(traderId, uplineId, overrides);

    let slicePercent: number;
    if (override !== null) {
      slicePercent = override;
    } else if (
      isAmbassadorOrInvestor(uplineId) &&
      isAmbassadorOrInvestor(traderId)
    ) {
      slicePercent = 0;
    } else {
      slicePercent = Math.max(0, uplineRebate - usedPercent);
    }

    usedPercent += uplineRebate;
    if (slicePercent > 0) {
      result.push({
        userId: uplineId,
        amountUsd: rebateBaseUsd * (slicePercent / 100),
        rebatePercent: slicePercent,
        layer: i + 1,
        fromTraderUserId: traderId,
      });
    }
  }

  return result;
}
