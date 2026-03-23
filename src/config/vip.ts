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
