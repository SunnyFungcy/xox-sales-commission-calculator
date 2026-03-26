/**
 * 多層返傭分配（至多 3 層用戶鏈）
 * 基數 = 該筆交易「手續費」feeUsd（成交量 × 交易者 VIP 之 Maker/Taker 費率），
 * 非 platformNetUsd。每一對相鄰 (下線, 上線)：上線拿 feeUsd × (上線% − 下線%) ÷ 100（差 ≤ 0 則 0）。
 * 交易者本人不在此函式內另發「整筆 r0%」切片，僅上線依階差拿錢。
 */
import type { RebateOverrideInput } from "@/types";

export interface RebateAllocation {
  userId: string;
  amountUsd: number;
  /** 本筆對該用戶生效的「階差百分比」或覆蓋值（對 feeUsd） */
  rebatePercent: number;
  layer: number; // 1=第一個上線, 2=第二個上線（無交易者列）
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
 * 依「手續費 × 相鄰兩層 Commission Rebate 差」分配。
 *
 * 驗算範例（與產品手算一致）：
 * - c 1M Taker VIP2 taker 0.034% → fee=340；b (45−35)%→34；本人 (50−45)%→17。
 * - b 5M Maker VIP4 maker 0.006% → fee=300；本人 (50−45)%→15。
 * - b 1M Taker VIP4 taker 0.028% → fee=280；本人 5%→14。
 * - 本人三筆合計 17+15+14=46（若文檔寫 44 為 15+14 誤加；嚴格按階差公式為 46）。
 */
export function calcRebateAllocations(
  feeUsd: number,
  chain: string[],
  rebatePercents: number[], // 与 chain 同序 [交易者, 上线1, 上线2]
  overrides: RebateOverrideInput[],
  isAmbassadorOrInvestor: (userId: string) => boolean
): RebateAllocation[] {
  const result: RebateAllocation[] = [];
  const traderId = chain[0];
  if (!traderId || chain.length < 2 || feeUsd <= 0) {
    return result;
  }

  for (let i = 0; i < chain.length - 1; i++) {
    const downId = chain[i];
    const upId = chain[i + 1];
    const rDown = Math.max(0, rebatePercents[i] ?? 0);
    const rUp = Math.max(0, rebatePercents[i + 1] ?? 0);

    const override = getOverrideRebatePercent(traderId, upId, overrides);
    let slicePercent: number;
    if (override !== null) {
      slicePercent = Math.max(0, override);
    } else if (
      isAmbassadorOrInvestor(upId) &&
      isAmbassadorOrInvestor(traderId)
    ) {
      slicePercent = 0;
    } else {
      slicePercent = Math.max(0, rUp - rDown);
    }

    if (slicePercent > 0) {
      result.push({
        userId: upId,
        amountUsd: feeUsd * (slicePercent / 100),
        rebatePercent: slicePercent,
        layer: i + 1,
        fromTraderUserId: traderId,
      });
    }
  }

  return result;
}
