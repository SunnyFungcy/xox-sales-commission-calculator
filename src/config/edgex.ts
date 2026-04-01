/**
 * EdgeX 固定分成（平台成本）
 * 與 VIP 表相同：`顯示 % = makerBps ÷ 100`（見 RulesReferenceSection）；實際費率 = makerBps ÷ 10_000
 */
export type EdgexShare = { makerBps: number; takerBps: number };

export const EDGEX_SHARE: EdgexShare = {
  makerBps: 0.6, // 0.006%
  takerBps: 1.9, // 0.019%
} as const;

export function edgexMakerRate(): number {
  return EDGEX_SHARE.makerBps / 10000;
}
export function edgexTakerRate(): number {
  return EDGEX_SHARE.takerBps / 10000;
}
