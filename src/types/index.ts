/**
 * 用户类型与输入数据
 */
export type UserType = "client" | "ambassador" | "investor";

export interface UserInput {
  id: string;
  type: UserType;
  /** 仅当 type 为 ambassador 时 */
  ambassadorGradeId?: string;
  /** 仅当 type 为 investor 时 */
  investorGradeId?: string;
  /** 推荐人 id（直接上线） */
  referrerId?: string;
  /** 仅当 type 为 client 时：手動指定 VIP 檔位（對應 Maker/Taker 費率），不填則依 30 日交易量自動計算 */
  vipTierId?: string;
  /** 仅当 type 为 client 时：達標／未達標；未達標則 Rebate% = 0；達標則依 30 日交易量對照表給 Rebate%（不計推薦人數） */
  referral100kStatus?: "達到" | "未達到";
}

export type OrderSide = "maker" | "taker";

export interface TradeInput {
  id?: string;
  timestamp: string; // ISO or date string
  userId: string;
  side: OrderSide;
  volumeUsd: number;
}

/**
 * 手动返佣覆盖：从 B 产生的返佣中，给 A 的比例 0–100
 */
export interface RebateOverrideInput {
  fromUserId: string; // 产生交易/返佣的用户 B
  toUserId: string;   // 获得额外比例的用户 A
  rebatePercent: number; // 0–100
}
