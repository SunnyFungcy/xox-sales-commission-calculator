/**
 * EdgeX 固定分成（平台成本）
 */
export type EdgexShare = { makerBps: number; takerBps: number };

export const EDGEX_SHARE: EdgexShare = {
  makerBps: 0.06,   // 0.006% = 0.06 bps (basis points, 1 bps = 0.01%)
  takerBps: 0.19,   // 0.019%
} as const;

export function edgexMakerRate(): number {
  return EDGEX_SHARE.makerBps / 10000;
}
export function edgexTakerRate(): number {
  return EDGEX_SHARE.takerBps / 10000;
}
