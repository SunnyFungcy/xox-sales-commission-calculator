/**
 * Client Commission Rebate Scheme（階梯表）
 * 僅作「費率與規則參考」區塊展示與 JSON 規則相容；**普通客戶實際 Rebate% 以 VIP Commission Rebate 為準**
 * （見 `resolveUsers` + `VIP_COMMISSION_REBATE_PERCENT` / `rebatePercentWhenExtraReqNotMetVip`）。
 * 下列 `rebatePercentWhenExtraReqNotMet` 保留給階梯表語意類比，不再驅動主計算。
 */
export interface ClientRebateTier {
  id: string;
  tier: number;
  minVolumeUsd: number;
  rebatePercent: number;
  minReferrals100k: number;
}

export const CLIENT_REBATE_SCHEME: ClientRebateTier[] = [
  { id: "tier1", tier: 1, minVolumeUsd: 1_000_000, rebatePercent: 5, minReferrals100k: 3 },
  { id: "tier2", tier: 2, minVolumeUsd: 5_000_000, rebatePercent: 10, minReferrals100k: 10 },
  { id: "tier3", tier: 3, minVolumeUsd: 20_000_000, rebatePercent: 15, minReferrals100k: 20 },
  { id: "tier4", tier: 4, minVolumeUsd: 50_000_000, rebatePercent: 20, minReferrals100k: 40 },
];

export function getClientRebateTier(
  volume30dUsd: number,
  referralsWith100k: number
): ClientRebateTier | null {
  let matched: ClientRebateTier | null = null;
  for (const t of CLIENT_REBATE_SCHEME) {
    if (volume30dUsd >= t.minVolumeUsd && referralsWith100k >= t.minReferrals100k) {
      matched = t;
    }
  }
  return matched;
}

export function rebatePercentFromTier(tier: ClientRebateTier | null): number {
  return tier ? tier.rebatePercent : 0;
}

/** 僅依 30 日交易量取得可達到的最高 Tier（不計推薦人數），用於「若達標推薦人數後可得 X%」提示 */
export function getClientRebateTierByVolumeOnly(
  volume30dUsd: number,
  scheme: ClientRebateTier[] = CLIENT_REBATE_SCHEME
): ClientRebateTier | null {
  let matched: ClientRebateTier | null = null;
  for (const t of scheme) {
    if (volume30dUsd >= t.minVolumeUsd) matched = t;
  }
  return matched;
}

/**
 * 普通客戶選「不達標」時的 Rebate%：依交易量對照到的 volumeTier **降一級**。
 * - 無階梯或階梯 1 → 0%
 * - 階梯 N（N>1）→ 使用 scheme 中 tier (N-1) 的 rebatePercent（從設定讀取，不硬編）
 */
export function rebatePercentWhenExtraReqNotMet(
  volumeTier: ClientRebateTier | null,
  scheme: ClientRebateTier[]
): number {
  if (!volumeTier) return 0;
  const prevTierNum = volumeTier.tier - 1;
  if (prevTierNum <= 0) return 0;
  const row = scheme.find((t) => t.tier === prevTierNum);
  return row?.rebatePercent ?? 0;
}
