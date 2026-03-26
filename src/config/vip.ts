/**
 * VIP Commission Scheme
 * 30 日交易量仅算用户本人；决定 Maker/Taker 费率
 */
export interface VIPTier {
  id: string;
  name: string;
  minVolumeUsd: number;
  makerBps: number;
  takerBps: number;
}

export const VIP_SCHEME: VIPTier[] = [
  { id: "non_vip", name: "Non VIP", minVolumeUsd: 0, makerBps: 1.2, takerBps: 3.8 },
  { id: "vip1", name: "VIP 1", minVolumeUsd: 5_000_000, makerBps: 1.0, takerBps: 3.6 },
  { id: "vip2", name: "VIP 2", minVolumeUsd: 25_000_000, makerBps: 0.8, takerBps: 3.4 },
  { id: "vip3", name: "VIP 3", minVolumeUsd: 100_000_000, makerBps: 0.6, takerBps: 3.0 },
  { id: "vip4", name: "VIP 4", minVolumeUsd: 300_000_000, makerBps: 0.6, takerBps: 2.8 },
  { id: "vip5", name: "VIP 5", minVolumeUsd: 1_000_000_000, makerBps: 0.6, takerBps: 2.6 },
  { id: "vip6", name: "VIP 6", minVolumeUsd: 2_000_000_000, makerBps: 0.6, takerBps: 2.4 },
];

/**
 * 普通客戶 Rebate% 與「費率與規則參考」VIP 表 Commission Rebate 一致（單一資料源）。
 * VIP 6：計算時視為 0%；規則表 UI 仍顯示 —（見 RulesReferenceSection：僅有定義 id 才顯示百分比）。
 */
export const VIP_COMMISSION_REBATE_PERCENT: Partial<Record<string, number>> = {
  non_vip: 0,
  vip5: 50,
  vip4: 45,
  vip3: 40,
  vip2: 35,
  vip1: 30,
};

/** 由低到高；不達標「降一級」時依此順序取上一檔 id */
export const VIP_COMMISSION_REBATE_TIER_ORDER: readonly string[] = [
  "non_vip",
  "vip1",
  "vip2",
  "vip3",
  "vip4",
  "vip5",
  "vip6",
];

/** 依 VIP 檔位 id 取得 Commission Rebate（%）；未定義的 id（含 vip6）→ 0 */
export function lookupCommissionRebateByVipTierId(
  tierId: string,
  commissionMap: Partial<Record<string, number>> = VIP_COMMISSION_REBATE_PERCENT
): number {
  const v = commissionMap[tierId];
  return typeof v === "number" ? v : 0;
}

/**
 * 額外要求「不達標」：依 VIP 階序降一級後的 Commission Rebate%。
 * - non_vip 或無上一階 → 0%
 * - vip1 不達標 → non_vip → 0%
 * - vip2 不達標 → vip1 → 30%
 * - vip6 不達標 → vip5 → 50%（vip6 基準為 0%，降級後仍為上一檔比例）
 */
export function rebatePercentWhenExtraReqNotMetVip(
  currentTierId: string,
  commissionMap: Partial<Record<string, number>> = VIP_COMMISSION_REBATE_PERCENT
): number {
  const idx = VIP_COMMISSION_REBATE_TIER_ORDER.indexOf(currentTierId);
  if (idx <= 0) return 0;
  const prevId = VIP_COMMISSION_REBATE_TIER_ORDER[idx - 1]!;
  return lookupCommissionRebateByVipTierId(prevId, commissionMap);
}

export function getVIPTierByVolume(
  volume30dUsd: number,
  scheme: VIPTier[] = VIP_SCHEME
): VIPTier {
  if (!scheme.length) return VIP_SCHEME[0];
  let tier = scheme[0];
  for (const t of scheme) {
    if (volume30dUsd >= t.minVolumeUsd) tier = t;
  }
  return tier;
}

export function makerRateFromTier(tier: VIPTier): number {
  return tier.makerBps / 10000;
}
export function takerRateFromTier(tier: VIPTier): number {
  return tier.takerBps / 10000;
}

/** Map "VIP 5" / "VIP 4" etc to VIPTier */
export function getVIPTierByLabel(
  label: string,
  scheme: VIPTier[] = VIP_SCHEME
): VIPTier | undefined {
  const normalized = label.replace(/\s+/g, "").toLowerCase();
  return scheme.find(
    (t) => t.id === normalized || t.name.replace(/\s+/g, "").toLowerCase() === normalized
  );
}

/** 依檔位 id（non_vip, vip1, ... vip6）取得 VIPTier */
export function getVIPTierById(
  id: string,
  scheme: VIPTier[] = VIP_SCHEME
): VIPTier | undefined {
  if (!id) return undefined;
  return scheme.find((t) => t.id === id);
}
