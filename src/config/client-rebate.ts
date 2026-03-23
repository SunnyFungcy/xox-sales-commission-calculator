/**
 * Client Commission Rebate Scheme
 * 仅非大使/非投资者；需满足 30 日交易量 + 达标推荐人数（每推荐人 ≥100k volume）
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
