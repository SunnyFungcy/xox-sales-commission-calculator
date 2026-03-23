/**
 * Ambassador 表：Grade, Price, Discount, USDT, Lock-Up, Commission (VIP), Commission Rebate%, Points, Airdrop, Turnover Requirement
 */
export interface AmbassadorGrade {
  id: string;
  name: string;
  price: number;
  discountPercent: number;
  usdt: number;
  lockUpMonths: number;
  commissionVip: string; // e.g. "VIP 5"
  commissionRebatePercent: number;
  pointsMultiplier: number;
  airdrop: boolean;
  turnoverRequirement: string; // e.g. "100M (30 Active Users)"
}

export const AMBASSADOR_GRADES: AmbassadorGrade[] = [
  {
    id: "star",
    name: "STAR Ambassador",
    price: 0.002,
    discountPercent: 33.3,
    usdt: 38_000,
    lockUpMonths: 1,
    commissionVip: "VIP 5",
    commissionRebatePercent: 50,
    pointsMultiplier: 1.4,
    airdrop: false,
    turnoverRequirement: "100M (30 Active Users)",
  },
  {
    id: "senior",
    name: "Senior Ambassador",
    price: 0.0022,
    discountPercent: 26.7,
    usdt: 20_000,
    lockUpMonths: 1,
    commissionVip: "VIP 4",
    commissionRebatePercent: 45,
    pointsMultiplier: 1.3,
    airdrop: false,
    turnoverRequirement: "50M (30 Active Users)",
  },
  {
    id: "ambassador",
    name: "Ambassador",
    price: 0.0025,
    discountPercent: 16.7,
    usdt: 5_000,
    lockUpMonths: 1,
    commissionVip: "VIP 3",
    commissionRebatePercent: 40,
    pointsMultiplier: 1.2,
    airdrop: false,
    turnoverRequirement: "5M",
  },
];

export function getAmbassadorGradeById(
  id: string,
  grades: AmbassadorGrade[] = AMBASSADOR_GRADES
): AmbassadorGrade | undefined {
  return grades.find((g) => g.id === id);
}
