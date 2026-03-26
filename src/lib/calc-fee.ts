/**
 * 单笔手续费与平台净收入
 * 手续费始终按「执行该笔交易的用户」的 VIP 等级；EdgeX 固定分成后为平台净收入。
 * 多層返傭分配以 feeUsd 為基數（階差模型）；platformNetUsd 仍供報表／平台淨收入欄位使用。
 */
import { getVIPTierByVolume, getVIPTierByLabel, type VIPTier } from "@/config/vip";
import { EDGEX_SHARE, type EdgexShare } from "@/config/edgex";
import type { OrderSide } from "@/types";

export interface FeeResult {
  feeUsd: number;
  edgexUsd: number;
  platformNetUsd: number;
  rateUsed: number;
  tier: VIPTier;
}

/**
 * 根据用户 30 日自身交易量或 Ambassador/Investor 的 Commission 档位得到 VIPTier
 */
export function resolveVIPTier(
  volume30dUsd: number,
  commissionVipLabel?: string,
  vipScheme?: VIPTier[]
): VIPTier {
  if (commissionVipLabel) {
    const tier = getVIPTierByLabel(commissionVipLabel, vipScheme);
    if (tier) return tier;
  }
  return getVIPTierByVolume(volume30dUsd, vipScheme);
}

/**
 * 单笔交易：fee = volume * rate；platform_net = fee - volume * edgex_rate
 */
export function calcFeeAndPlatformNet(
  volumeUsd: number,
  side: OrderSide,
  tier: VIPTier,
  edgexShare: EdgexShare = EDGEX_SHARE
): FeeResult {
  const rate = side === "maker" ? tier.makerBps / 10000 : tier.takerBps / 10000;
  const edgexRate =
    side === "maker" ? edgexShare.makerBps / 10000 : edgexShare.takerBps / 10000;
  const feeUsd = volumeUsd * rate;
  const edgexUsd = volumeUsd * edgexRate;
  const platformNetUsd = feeUsd - edgexUsd;
  return {
    feeUsd,
    edgexUsd,
    platformNetUsd,
    rateUsed: rate,
    tier,
  };
}
