/**
 * Investor 表：Grade, Price, Discount, USDT, Lock-Up, Commission (VIP), Commission Rebate%, Points, Airdrop, Turnover Requirement
 */
export interface InvestorGrade {
  id: string;
  name: string;
  price: number;
  discountPercent: number;
  usdt: number;
  lockUpMonths: number;
  commissionVip: string;
  commissionRebatePercent: number;
  pointsMultiplier: number;
  airdrop: boolean;
  turnoverRequirement: string;
}

export const INVESTOR_GRADES: InvestorGrade[] = [
  {
    id: "s",
    name: "S",
    price: 0.0015,
    discountPercent: 50,
    usdt: 200_000,
    lockUpMonths: 24,
    commissionVip: "VIP 5",
    commissionRebatePercent: 50,
    pointsMultiplier: 1.5,
    airdrop: true,
    turnoverRequirement: "-",
  },
  {
    id: "a",
    name: "A",
    price: 0.0018,
    discountPercent: 40,
    usdt: 100_000,
    lockUpMonths: 12,
    commissionVip: "VIP 4",
    commissionRebatePercent: 45,
    pointsMultiplier: 1.4,
    airdrop: true,
    turnoverRequirement: "-",
  },
  {
    id: "b",
    name: "B",
    price: 0.0021,
    discountPercent: 30,
    usdt: 38_000,
    lockUpMonths: 6,
    commissionVip: "VIP 3",
    commissionRebatePercent: 40,
    pointsMultiplier: 1.3,
    airdrop: true,
    turnoverRequirement: "-",
  },
  {
    id: "c",
    name: "C",
    price: 0.0023,
    discountPercent: 23.3,
    usdt: 10_000,
    lockUpMonths: 3,
    commissionVip: "VIP 2",
    commissionRebatePercent: 35,
    pointsMultiplier: 1.2,
    airdrop: true,
    turnoverRequirement: "-",
  },
  {
    id: "ic",
    name: "Individual Contributor",
    price: 0.0026,
    discountPercent: 13.3,
    usdt: 3_000,
    lockUpMonths: 1,
    commissionVip: "VIP 1",
    commissionRebatePercent: 25,
    pointsMultiplier: 1.1,
    airdrop: true,
    turnoverRequirement: "-",
  },
];

export function getInvestorGradeById(
  id: string,
  grades: InvestorGrade[] = INVESTOR_GRADES
): InvestorGrade | undefined {
  return grades.find((g) => g.id === id);
}
