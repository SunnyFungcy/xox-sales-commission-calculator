/**
 * 根据 30 日自身交易量、推荐人数解析每个用户的 VIP、Client Rebate Tier、Rebate%
 */
import { getVIPTierByVolume, getVIPTierById, type VIPTier } from "@/config/vip";
import { getClientRebateTierByVolumeOnly, rebatePercentFromTier } from "@/config/client-rebate";
import { getAmbassadorGradeById } from "@/config/ambassador";
import { getInvestorGradeById } from "@/config/investor";
import { getVIPTierByLabel } from "@/config/vip";
import type { UserInput } from "@/types";
import {
  getDefaultCalculatorRules,
  type CalculatorRules,
} from "@/lib/calculator-rules";

export interface ResolvedUser {
  id: string;
  type: UserInput["type"];
  ambassadorGradeId?: string;
  investorGradeId?: string;
  referrerId?: string;
  volume30dUsd: number;
  /** 本人 + 引薦及下線的 30 日交易量合計（僅用於報表顯示，不參與 VIP / Rebate Tier 判定） */
  volume30dSubtreeUsd: number;
  referralsWith100k: number;
  vipTier: VIPTier;
  clientRebateTier: number | null; // tier number or null
  rebatePercent: number;
  /** 僅當普通客戶且選「未達到」時：若達標後可得的 Rebate%（僅依交易量對照表） */
  rebatePercentIfQualified?: number;
  isAmbassadorOrInvestor: boolean;
}

/**
 * 计算每个用户自身 30 日交易量（不包含下线）
 */
export function computeOwnVolume30d(
  userId: string,
  trades: { userId: string; timestamp: string; volumeUsd: number }[],
  asOfDate: Date
): number {
  const cutoff = new Date(asOfDate);
  cutoff.setDate(cutoff.getDate() - 30);
  return trades
    .filter(
      (t) =>
        t.userId === userId &&
        new Date(t.timestamp) >= cutoff &&
        new Date(t.timestamp) <= asOfDate
    )
    .reduce((sum, t) => sum + t.volumeUsd, 0);
}

/**
 * 达标推荐人数：直接下线中 30 日内自身交易量 >= 100k 的人数
 */
export function computeReferralsWith100k(
  userId: string,
  users: UserInput[],
  trades: { userId: string; timestamp: string; volumeUsd: number }[],
  asOfDate: Date
): number {
  const directRefs = users.filter((u) => u.referrerId === userId);
  const cutoff = new Date(asOfDate);
  cutoff.setDate(cutoff.getDate() - 30);
  return directRefs.filter((ref) => {
    const vol = trades
      .filter(
        (t) =>
          t.userId === ref.id &&
          new Date(t.timestamp) >= cutoff &&
          new Date(t.timestamp) <= asOfDate
      )
      .reduce((sum, t) => sum + t.volumeUsd, 0);
    return vol >= 100_000;
  }).length;
}

/**
 * 某用户及其全部下线在 30 日内的交易量合计（用于 Ambassador Turnover Requirement）
 */
export function computeSubtreeVolume30d(
  userId: string,
  users: UserInput[],
  trades: { userId: string; timestamp: string; volumeUsd: number }[],
  asOfDate: Date
): number {
  const cutoff = new Date(asOfDate);
  cutoff.setDate(cutoff.getDate() - 30);
  const descendantIds = new Set<string>([userId]);
  let changed = true;
  while (changed) {
    changed = false;
    users.forEach((u) => {
      if (u.referrerId && descendantIds.has(u.referrerId) && !descendantIds.has(u.id)) {
        descendantIds.add(u.id);
        changed = true;
      }
    });
  }
  return trades
    .filter(
      (t) =>
        descendantIds.has(t.userId) &&
        new Date(t.timestamp) >= cutoff &&
        new Date(t.timestamp) <= asOfDate
    )
    .reduce((sum, t) => sum + t.volumeUsd, 0);
}

export function resolveUsers(
  users: UserInput[],
  trades: { userId: string; timestamp: string; volumeUsd: number }[],
  asOfDate: Date = new Date(),
  rules: CalculatorRules = getDefaultCalculatorRules()
): Map<string, ResolvedUser> {
  const userMap = new Map<string, UserInput>();
  users.forEach((u) => userMap.set(u.id, u));

  const vipScheme = rules.vipScheme;
  const clientScheme = rules.clientRebateScheme;
  const ambGrades = rules.ambassadorGrades;
  const invGrades = rules.investorGrades;

  const result = new Map<string, ResolvedUser>();
  for (const u of users) {
    const volume30dUsd = computeOwnVolume30d(u.id, trades, asOfDate);
    const volume30dSubtreeUsd = computeSubtreeVolume30d(u.id, users, trades, asOfDate);
    const referralsWith100k = computeReferralsWith100k(
      u.id,
      users,
      trades,
      asOfDate
    );

    let vipTier: VIPTier;
    let rebatePercent: number;
    let clientRebateTier: number | null = null;
    const isAmbassador = u.type === "ambassador" && u.ambassadorGradeId;
    const isInvestor = u.type === "investor" && u.investorGradeId;

    if (isAmbassador && u.ambassadorGradeId) {
      const grade = getAmbassadorGradeById(u.ambassadorGradeId, ambGrades);
      vipTier = grade
        ? getVIPTierByLabel(grade.commissionVip, vipScheme) ??
          getVIPTierByVolume(volume30dUsd, vipScheme)
        : getVIPTierByVolume(volume30dUsd, vipScheme);
      rebatePercent = grade?.commissionRebatePercent ?? 0;
    } else if (isInvestor && u.investorGradeId) {
      const grade = getInvestorGradeById(u.investorGradeId, invGrades);
      vipTier = grade
        ? getVIPTierByLabel(grade.commissionVip, vipScheme) ??
          getVIPTierByVolume(volume30dUsd, vipScheme)
        : getVIPTierByVolume(volume30dUsd, vipScheme);
      rebatePercent = grade?.commissionRebatePercent ?? 0;
    } else {
      const overrideTier = u.vipTierId ? getVIPTierById(u.vipTierId, vipScheme) : undefined;
      vipTier = overrideTier ?? getVIPTierByVolume(volume30dUsd, vipScheme);
      let rebatePercentIfQualified: number | undefined;
      if (u.referral100kStatus === "未達到") {
        rebatePercent = 0;
        clientRebateTier = null;
        const tierByVolume = getClientRebateTierByVolumeOnly(volume30dUsd, clientScheme);
        rebatePercentIfQualified = tierByVolume ? tierByVolume.rebatePercent : undefined;
      } else {
        const tierByVolume = getClientRebateTierByVolumeOnly(volume30dUsd, clientScheme);
        clientRebateTier = tierByVolume?.tier ?? null;
        rebatePercent = rebatePercentFromTier(tierByVolume);
      }
      result.set(u.id, {
        id: u.id,
        type: u.type,
        ambassadorGradeId: u.ambassadorGradeId,
        investorGradeId: u.investorGradeId,
        referrerId: u.referrerId,
        volume30dUsd,
        volume30dSubtreeUsd,
        referralsWith100k,
        vipTier,
        clientRebateTier,
        rebatePercent,
        ...(rebatePercentIfQualified !== undefined && { rebatePercentIfQualified }),
        isAmbassadorOrInvestor: !!(isAmbassador || isInvestor),
      });
      continue;
    }

    result.set(u.id, {
      id: u.id,
      type: u.type,
      ambassadorGradeId: u.ambassadorGradeId,
      investorGradeId: u.investorGradeId,
      referrerId: u.referrerId,
      volume30dUsd,
      volume30dSubtreeUsd,
      referralsWith100k,
      vipTier,
      clientRebateTier,
      rebatePercent,
      isAmbassadorOrInvestor: !!(isAmbassador || isInvestor),
    });
  }
  return result;
}
