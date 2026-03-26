/**
 * 計算器「生效規則」快照：可與預設 config 合併、持久化至 localStorage。
 * 密碼僅用於前端防誤觸，非加密安全機制。
 */
import type { VIPTier } from "@/config/vip";
import { VIP_SCHEME } from "@/config/vip";
import type { EdgexShare } from "@/config/edgex";
import { EDGEX_SHARE } from "@/config/edgex";
import type { ClientRebateTier } from "@/config/client-rebate";
import { CLIENT_REBATE_SCHEME } from "@/config/client-rebate";
import type { AmbassadorGrade } from "@/config/ambassador";
import { AMBASSADOR_GRADES } from "@/config/ambassador";
import type { InvestorGrade } from "@/config/investor";
import { INVESTOR_GRADES } from "@/config/investor";

export type { EdgexShare } from "@/config/edgex";

export interface CalculatorRules {
  vipScheme: VIPTier[];
  edgexShare: EdgexShare;
  /** 普通客戶「返傭階梯」規則表（僅展示／匯入相容）；實際 Rebate% 以 VIP Commission 為準 */
  clientRebateScheme: ClientRebateTier[];
  ambassadorGrades: AmbassadorGrade[];
  investorGrades: InvestorGrade[];
}

export const CALCULATOR_RULES_STORAGE_KEY = "dex-whitelabel-calc-rules-v1";

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export function getDefaultCalculatorRules(): CalculatorRules {
  return {
    vipScheme: deepClone(VIP_SCHEME),
    edgexShare: { ...EDGEX_SHARE },
    clientRebateScheme: deepClone(CLIENT_REBATE_SCHEME),
    ambassadorGrades: deepClone(AMBASSADOR_GRADES),
    investorGrades: deepClone(INVESTOR_GRADES),
  };
}

function isFiniteNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function isVIPTier(x: unknown): x is VIPTier {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    isFiniteNum(o.minVolumeUsd) &&
    isFiniteNum(o.makerBps) &&
    isFiniteNum(o.takerBps)
  );
}

function isEdgexShare(x: unknown): x is EdgexShare {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return isFiniteNum(o.makerBps) && isFiniteNum(o.takerBps);
}

function isClientRebateTier(x: unknown): x is ClientRebateTier {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    isFiniteNum(o.tier) &&
    isFiniteNum(o.minVolumeUsd) &&
    isFiniteNum(o.rebatePercent) &&
    isFiniteNum(o.minReferrals100k)
  );
}

function isAmbassadorGrade(x: unknown): x is AmbassadorGrade {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    isFiniteNum(o.price) &&
    isFiniteNum(o.discountPercent) &&
    isFiniteNum(o.usdt) &&
    isFiniteNum(o.lockUpMonths) &&
    typeof o.commissionVip === "string" &&
    isFiniteNum(o.commissionRebatePercent) &&
    isFiniteNum(o.pointsMultiplier) &&
    typeof o.airdrop === "boolean" &&
    typeof o.turnoverRequirement === "string"
  );
}

function isInvestorGrade(x: unknown): x is InvestorGrade {
  return isAmbassadorGrade(x);
}

/**
 * 驗證並解析 localStorage 等來源的 JSON；失敗回 null。
 */
export function parseStoredCalculatorRules(raw: unknown): CalculatorRules | null {
  try {
    if (!raw || typeof raw !== "object") return null;
    const o = raw as Record<string, unknown>;
    if (!Array.isArray(o.vipScheme) || !o.vipScheme.every(isVIPTier)) return null;
    if (!isEdgexShare(o.edgexShare)) return null;
    if (!Array.isArray(o.clientRebateScheme) || !o.clientRebateScheme.every(isClientRebateTier))
      return null;
    if (!Array.isArray(o.ambassadorGrades) || !o.ambassadorGrades.every(isAmbassadorGrade))
      return null;
    if (!Array.isArray(o.investorGrades) || !o.investorGrades.every(isInvestorGrade))
      return null;
    return {
      vipScheme: deepClone(o.vipScheme),
      edgexShare: { ...o.edgexShare },
      clientRebateScheme: deepClone(o.clientRebateScheme),
      ambassadorGrades: deepClone(o.ambassadorGrades),
      investorGrades: deepClone(o.investorGrades),
    };
  } catch {
    return null;
  }
}

export function loadCalculatorRulesFromStorage(): CalculatorRules | null {
  if (typeof window === "undefined") return null;
  try {
    const s = window.localStorage.getItem(CALCULATOR_RULES_STORAGE_KEY);
    if (!s) return null;
    return parseStoredCalculatorRules(JSON.parse(s));
  } catch {
    return null;
  }
}

export function saveCalculatorRulesToStorage(rules: CalculatorRules): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CALCULATOR_RULES_STORAGE_KEY, JSON.stringify(rules));
  } catch {
    /* ignore quota */
  }
}

export function clearCalculatorRulesStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CALCULATOR_RULES_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
