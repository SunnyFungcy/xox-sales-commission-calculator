"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  runCalculator,
  type CalculatorResult,
} from "@/lib/calculator";
import { computeSubtreeVolume30d } from "@/lib/resolve-users";
import { getAmbassadorGradeById } from "@/config/ambassador";
import { getInvestorGradeById } from "@/config/investor";
import {
  getDefaultCalculatorRules,
  loadCalculatorRulesFromStorage,
  type CalculatorRules,
} from "@/lib/calculator-rules";
import { RulesReferenceSection } from "@/components/RulesReferenceSection";
import type { UserInput, TradeInput, RebateOverrideInput } from "@/types";
import { formatCount, type Locale } from "@/i18n/messages";
import { useDashboardLocale } from "@/i18n/useDashboardLocale";

const AMBASSADOR_GRADE_IDS = [
  { id: "star", name: "STAR Ambassador" },
  { id: "senior", name: "Senior Ambassador" },
  { id: "ambassador", name: "Ambassador" },
] as const;

const INVESTOR_GRADE_IDS = [
  { id: "s", name: "S" },
  { id: "a", name: "A" },
  { id: "b", name: "B" },
  { id: "c", name: "C" },
  { id: "ic", name: "Individual Contributor" },
] as const;

type UserType = UserInput["type"];
type OrderSide = TradeInput["side"];

interface UserRow {
  id: string;
  type: UserType;
  ambassadorGradeId: string;
  investorGradeId: string;
  referrerId: string;
  /** 普通客戶專用：VIP 檔位（對應 Maker/Taker 費率），空字串表示依 30 日交易量自動計算 */
  vipTierId: string;
  /** 普通客戶專用：達標／未達標；未達標 Rebate% = 0，達標則依 30 日交易量給 Rebate% */
  referral100kStatus: "" | "達到" | "未達到";
}

interface TradeRow {
  userId: string;
  volumeUsd: number;
  side: OrderSide;
  date: string;
}

interface OverrideRow {
  fromUserId: string;
  toUserId: string;
  rebatePercent: number;
}

function toIsoDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/** 是否 ancestor 為 node 的祖先（沿 referrerMap 向上） */
function isAncestor(
  ancestor: string,
  node: string,
  referrerMap: Map<string, string>
): boolean {
  let cur: string | undefined = node;
  while (cur) {
    if (cur === ancestor) return true;
    cur = referrerMap.get(cur);
  }
  return false;
}

const defaultUserRows: UserRow[] = [
  { id: "本人", type: "ambassador", ambassadorGradeId: "star", investorGradeId: "", referrerId: "", vipTierId: "", referral100kStatus: "" },
  { id: "b", type: "client", ambassadorGradeId: "", investorGradeId: "", referrerId: "本人", vipTierId: "", referral100kStatus: "達到" },
  { id: "c", type: "client", ambassadorGradeId: "", investorGradeId: "", referrerId: "b", vipTierId: "", referral100kStatus: "達到" },
];

function getDefaultTradeDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

const defaultTradeRows: TradeRow[] = [
  { userId: "b", volumeUsd: 10000, side: "taker", date: getDefaultTradeDate(2) },
  { userId: "c", volumeUsd: 10000, side: "taker", date: getDefaultTradeDate(1) },
  { userId: "b", volumeUsd: 50000, side: "maker", date: getDefaultTradeDate(0) },
];

function parseJsonOrCsv<T>(text: string, type: "users" | "trades" | "overrides"): T[] {
  const trimmed = text.trim();
  if (trimmed.startsWith("[")) {
    return JSON.parse(trimmed) as T[];
  }
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });
    rows.push(row);
  }
  if (type === "users") {
    return rows.map((r) => ({
      id: r.id ?? r.userid ?? "",
      type: (r.type ?? "client") as UserInput["type"],
      ambassadorGradeId: r.ambassadorgradeid || r.ambassador_grade_id || undefined,
      investorGradeId: r.investorgradeid || r.investor_grade_id || undefined,
      referrerId: r.referrerid || r.referrer_id || undefined,
    })) as unknown as T[];
  }
  if (type === "trades") {
    return rows.map((r, i) => ({
      id: String(i + 1),
      timestamp: r.timestamp ?? r.date ?? new Date().toISOString(),
      userId: r.userid ?? r.user_id ?? "",
      side: (r.side ?? r.maker_taker ?? "taker") as "maker" | "taker",
      volumeUsd: Number(r.volumeusd ?? r.volume_usd ?? r.volume ?? 0) || 0,
    })) as unknown as T[];
  }
  if (type === "overrides") {
    return rows.map((r) => ({
      fromUserId: r.fromuserid ?? r.from_user_id ?? "",
      toUserId: r.touserid ?? r.to_user_id ?? "",
      rebatePercent: Number(r.rebatepercent ?? r.rebate_percent ?? 0) || 0,
    })) as unknown as T[];
  }
  return [];
}

function toUserInputs(rows: UserRow[]): UserInput[] {
  return rows
    .filter((r) => r.id.trim() !== "")
    .map((r) => ({
      id: r.id.trim(),
      type: r.type,
      ambassadorGradeId: r.type === "ambassador" && r.ambassadorGradeId ? r.ambassadorGradeId : undefined,
      investorGradeId: r.type === "investor" && r.investorGradeId ? r.investorGradeId : undefined,
      referrerId: r.referrerId.trim() || undefined,
      vipTierId: r.type === "client" && r.vipTierId ? r.vipTierId : undefined,
      referral100kStatus:
        r.type === "client" && (r.referral100kStatus === "達到" || r.referral100kStatus === "未達到")
          ? r.referral100kStatus
          : undefined,
    }));
}

function toTradeInputs(rows: TradeRow[], userIds: string[]): TradeInput[] {
  return rows
    .filter((r) => r.userId && r.volumeUsd > 0)
    .map((r, i) => ({
      id: String(i + 1),
      timestamp: toIsoDate(r.date),
      userId: r.userId,
      side: r.side,
      volumeUsd: Number(r.volumeUsd),
    }));
}

function toOverrideInputs(rows: OverrideRow[]): RebateOverrideInput[] {
  return rows
    .filter((r) => r.fromUserId.trim() && r.toUserId.trim())
    .map((r) => ({
      fromUserId: r.fromUserId.trim(),
      toUserId: r.toUserId.trim(),
      rebatePercent: Number(r.rebatePercent) || 0,
    }));
}

export default function DashboardPage() {
  const { locale, setLocale, t, numberLocale } = useDashboardLocale();
  const [userRows, setUserRows] = useState<UserRow[]>(defaultUserRows);
  const [tradeRows, setTradeRows] = useState<TradeRow[]>(defaultTradeRows);
  const [overrideRows, setOverrideRows] = useState<OverrideRow[]>([]);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calculatorRules, setCalculatorRules] = useState<CalculatorRules>(() =>
    getDefaultCalculatorRules()
  );
  const resultSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = loadCalculatorRulesFromStorage();
    if (stored) setCalculatorRules(stored);
  }, []);

  const userIds = userRows.map((r) => r.id.trim()).filter(Boolean);

  const addUser = useCallback(() => {
    setUserRows((prev) => [
      ...prev,
      { id: "", type: "client", ambassadorGradeId: "", investorGradeId: "", referrerId: "", vipTierId: "", referral100kStatus: "達到" },
    ]);
  }, []);

  const updateUser = useCallback((index: number, field: keyof UserRow, value: string | number) => {
    setUserRows((prev) => {
      const next = [...prev];
      (next[index] as unknown as Record<string, string | number>)[field] = value;
      return next;
    });
  }, []);

  const removeUser = useCallback((index: number) => {
    setUserRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addTrade = useCallback(() => {
    setTradeRows((prev) => [
      ...prev,
      { userId: userIds[0] ?? "", volumeUsd: 0, side: "taker", date: new Date().toISOString().slice(0, 10) },
    ]);
  }, [userIds]);

  const updateTrade = useCallback((index: number, field: keyof TradeRow, value: string | number) => {
    setTradeRows((prev) => {
      const next = [...prev];
      (next[index] as unknown as Record<string, string | number>)[field] = value;
      return next;
    });
  }, []);

  const removeTrade = useCallback((index: number) => {
    setTradeRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addOverride = useCallback(() => {
    setOverrideRows((prev) => [
      ...prev,
      { fromUserId: userIds[0] ?? "", toUserId: userIds[0] ?? "", rebatePercent: 0 },
    ]);
  }, [userIds]);

  const updateOverride = useCallback((index: number, field: keyof OverrideRow, value: string | number) => {
    setOverrideRows((prev) => {
      const next = [...prev];
      (next[index] as unknown as Record<string, string | number>)[field] = value;
      return next;
    });
  }, []);

  const removeOverride = useCallback((index: number) => {
    setOverrideRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const run = useCallback(() => {
    setError(null);
    setResult(null);
    const users = toUserInputs(userRows);
    const trades = toTradeInputs(tradeRows, userIds);
    const overrides = toOverrideInputs(overrideRows);
    if (!users.length) {
      setError(t("errMinUsers"));
      return;
    }
    const validTrades = tradeRows.filter((r) => r.userId && r.volumeUsd > 0);
    if (!validTrades.length) {
      setError(t("errMinTrades"));
      return;
    }
    try {
      const res = runCalculator({ users, trades, overrides, rules: calculatorRules });
      setResult(res);
      setTimeout(() => {
        resultSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(String(err));
      setResult(null);
    }
  }, [userRows, tradeRows, overrideRows, userIds, calculatorRules, t]);

  const handleApplyRules = useCallback(
    (next: CalculatorRules) => {
      setCalculatorRules(next);
      const users = toUserInputs(userRows);
      const trades = toTradeInputs(tradeRows, userIds);
      const overrides = toOverrideInputs(overrideRows);
      const validTrades = tradeRows.filter((r) => r.userId && r.volumeUsd > 0);
      if (!users.length || !validTrades.length) return;
      try {
        setError(null);
        const res = runCalculator({ users, trades, overrides, rules: next });
        setResult(res);
      } catch (err) {
        setError(String(err));
      }
    },
    [userRows, tradeRows, overrideRows, userIds]
  );

  const handleFile = useCallback(
    (type: "users" | "trades" | "overrides", e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result);
          if (type === "users") {
            const list = parseJsonOrCsv<UserInput>(text, "users");
            setUserRows(
              list.map((u) => ({
                id: u.id,
                type: u.type,
                ambassadorGradeId: u.ambassadorGradeId ?? "",
                investorGradeId: u.investorGradeId ?? "",
                referrerId: u.referrerId ?? "",
                vipTierId: u.vipTierId ?? "",
                referral100kStatus: (u.referral100kStatus === "達到" || u.referral100kStatus === "未達到") ? u.referral100kStatus : "達到",
              }))
            );
          }
          if (type === "trades") {
            const list = parseJsonOrCsv<TradeInput>(text, "trades");
            setTradeRows(
              list.map((t) => ({
                userId: t.userId,
                volumeUsd: t.volumeUsd,
                side: t.side,
                date: t.timestamp ? t.timestamp.slice(0, 10) : new Date().toISOString().slice(0, 10),
              }))
            );
          }
          if (type === "overrides") {
            const list = parseJsonOrCsv<RebateOverrideInput>(text, "overrides");
            setOverrideRows(
              list.map((o) => ({
                fromUserId: o.fromUserId,
                toUserId: o.toUserId,
                rebatePercent: o.rebatePercent,
              }))
            );
          }
          setError(null);
        } catch (err) {
          setError(String(err));
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    []
  );

  const users = toUserInputs(userRows);
  const trades = toTradeInputs(tradeRows, userIds);
  const overrides = toOverrideInputs(overrideRows);

  const selfUserIdForLabels =
    userRows.find((r) => !r.referrerId?.trim())?.id ?? "";

  const labelForUserOption = (id: string) =>
    id && id === selfUserIdForLabels ? t("optionSelf") : id;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">{t("pageTitle")}</h1>
        <label className="flex items-center gap-2 text-sm text-slate-600 shrink-0">
          <span className="sr-only">{t("languageSelectAria")}</span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="border border-slate-300 rounded px-2 py-1.5 bg-white text-slate-800 min-w-[9rem]"
            aria-label={t("languageSelectAria")}
          >
            <option value="zh-TW">{t("langZhTw")}</option>
            <option value="en">{t("langEn")}</option>
          </select>
        </label>
      </div>

      <RulesReferenceSection
        rules={calculatorRules}
        onApplyRules={handleApplyRules}
        t={t}
        numberLocale={numberLocale}
      />

      {/* 用戶 */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">{t("sectionUsers")}</h2>
        <div className="space-y-4">
          {(() => {
            const selfIdx = userRows.findIndex((r) => !r.referrerId?.trim());
            const ordered: { row: UserRow; i: number; isSelf: boolean }[] = [];
            if (selfIdx >= 0) ordered.push({ row: userRows[selfIdx], i: selfIdx, isSelf: true });
            userRows.forEach((row, i) => {
              if (i !== selfIdx) ordered.push({ row, i, isSelf: false });
            });
            return ordered.map(({ row, i, isSelf }, idx) => {
              const showTeamLabel = !isSelf && (idx === 0 || ordered[idx - 1].isSelf);
              return (
              <div key={i} className="space-y-2">
                {isSelf && (
                  <span className="inline-block text-sm font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    {t("sectionSelfBadge")}
                  </span>
                )}
                {showTeamLabel && (
                  <h3 className="text-sm font-medium text-slate-600">{t("sectionTeamLabel")}</h3>
                )}
                <div
                  className={
                    isSelf
                      ? "flex flex-wrap items-end gap-3 p-3 rounded border-2 border-amber-300 bg-amber-50/60"
                      : "flex flex-wrap items-end gap-3 p-3 bg-slate-50 rounded border border-slate-100"
                  }
                >
                  {isSelf ? (
                    <label className="flex flex-col gap-1">
                      <span className="text-sm text-slate-600">{t("labelUserId")}</span>
                      <span className="font-medium text-amber-800 py-1.5">{t("selfIdDisplay")}</span>
                    </label>
                  ) : (
                    <label className="flex flex-col gap-1">
                      <span className="text-sm text-slate-600">{t("labelUserId")}</span>
                      <input
                        type="text"
                        value={row.id}
                        onChange={(e) => updateUser(i, "id", e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1.5 w-32 font-mono"
                        placeholder={t("placeholderUserExample")}
                      />
                    </label>
                  )}
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-slate-600">{t("labelType")}</span>
                    <select
                      value={row.type}
                      onChange={(e) => updateUser(i, "type", e.target.value as UserType)}
                      className="border border-slate-300 rounded px-2 py-1.5 w-36"
                    >
                      <option value="client">{t("typeClient")}</option>
                      <option value="ambassador">{t("typeAmbassador")}</option>
                      <option value="investor">{t("typeInvestor")}</option>
                    </select>
                  </label>
                  {row.type === "ambassador" && (
                    <label className="flex flex-col gap-1">
                      <span className="text-sm text-slate-600">{t("labelAmbassadorGrade")}</span>
                      <select
                        value={row.ambassadorGradeId}
                        onChange={(e) => updateUser(i, "ambassadorGradeId", e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1.5 w-44"
                      >
                        <option value="">—</option>
                        {AMBASSADOR_GRADE_IDS.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  {row.type === "investor" && (
                    <label className="flex flex-col gap-1">
                      <span className="text-sm text-slate-600">{t("labelInvestorGrade")}</span>
                      <select
                        value={row.investorGradeId}
                        onChange={(e) => updateUser(i, "investorGradeId", e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1.5 w-44"
                      >
                        <option value="">—</option>
                        {INVESTOR_GRADE_IDS.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  {row.type === "client" && (
                    <label
                      className="flex flex-col gap-1"
                      title={t("labelVipTierTitle")}
                    >
                      <span className="text-sm text-slate-600">{t("labelVipTier")}</span>
                      <select
                        value={row.vipTierId}
                        onChange={(e) => updateUser(i, "vipTierId", e.target.value)}
                        className="border border-slate-300 rounded px-2 py-1.5 w-48"
                      >
                        <option value="">{t("vipAuto")}</option>
                    {calculatorRules.vipScheme.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                      </select>
                    </label>
                  )}
                  {row.type === "client" && (
                    <label
                      className="flex flex-col gap-1"
                      title={t("labelExtraReqTitle")}
                    >
                      <span className="text-sm text-slate-600">{t("labelExtraReq")}</span>
                      <select
                        value={row.referral100kStatus || "達到"}
                        onChange={(e) => updateUser(i, "referral100kStatus", e.target.value as "" | "達到" | "未達到")}
                        className="border border-slate-300 rounded px-2 py-1.5 w-36"
                      >
                        <option value="達到">{t("extraQualified")}</option>
                        <option value="未達到">{t("extraNotQualified")}</option>
                      </select>
                    </label>
                  )}
                  {!isSelf && (
                    <>
                      <label className="flex flex-col gap-1">
                        <span className="text-sm text-slate-600">{t("labelReferrer")}</span>
                        <select
                          value={row.referrerId}
                          onChange={(e) => updateUser(i, "referrerId", e.target.value)}
                          className="border border-slate-300 rounded px-2 py-1.5 w-32"
                        >
                          <option value="">—</option>
                          {userIds
                            .filter((id) => id && id !== row.id)
                            .map((id) => (
                              <option key={id} value={id}>
                                {labelForUserOption(id)}
                              </option>
                            ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeUser(i)}
                        className="px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        {t("btnDelete")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
            });
          })()}
        </div>
        <button
          type="button"
          onClick={addUser}
          className="mt-3 px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50"
        >
          {t("btnAddUser")}
        </button>
      </section>

      {/* 交易 */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">{t("sectionTrades")}</h2>
        <div className="space-y-4">
          {tradeRows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3 p-3 bg-slate-50 rounded border border-slate-100">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600">{t("labelTradeUser")}</span>
                <select
                  value={row.userId}
                  onChange={(e) => updateTrade(i, "userId", e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1.5 w-32"
                >
                  {userIds.length === 0 ? (
                    <option value="">{t("optionAddUsersFirst")}</option>
                  ) : (
                    userIds.map((id) => (
                      <option key={id} value={id}>
                        {labelForUserOption(id)}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600">{t("labelVolumeUsd")}</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={row.volumeUsd || ""}
                  onChange={(e) => updateTrade(i, "volumeUsd", e.target.value === "" ? 0 : Number(e.target.value))}
                  className="border border-slate-300 rounded px-2 py-1.5 w-28"
                  placeholder="0"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600">{t("labelSide")}</span>
                <select
                  value={row.side}
                  onChange={(e) => updateTrade(i, "side", e.target.value as OrderSide)}
                  className="border border-slate-300 rounded px-2 py-1.5 w-24"
                >
                  <option value="maker">{t("sideMaker")}</option>
                  <option value="taker">{t("sideTaker")}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600">{t("labelDate")}</span>
                <input
                  type="date"
                  value={row.date}
                  onChange={(e) => updateTrade(i, "date", e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1.5 w-36"
                />
              </label>
              <button
                type="button"
                onClick={() => removeTrade(i)}
                className="px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                {t("btnDelete")}
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addTrade}
          className="mt-3 px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50"
        >
          {t("btnAddTrade")}
        </button>
      </section>

      {/* 手動返傭覆蓋（可選） */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">{t("sectionOverrides")}</h2>
        <p className="text-sm text-slate-500 mb-3">{t("overridesDesc")}</p>
        <div className="space-y-4">
          {overrideRows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3 p-3 bg-slate-50 rounded border border-slate-100">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600">{t("labelFromUser")}</span>
                <select
                  value={row.fromUserId}
                  onChange={(e) => updateOverride(i, "fromUserId", e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1.5 w-32"
                >
                  <option value="">—</option>
                  {userIds.map((id) => (
                    <option key={id} value={id}>
                      {labelForUserOption(id)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600">{t("labelToUser")}</span>
                <select
                  value={row.toUserId}
                  onChange={(e) => updateOverride(i, "toUserId", e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1.5 w-32"
                >
                  <option value="">—</option>
                  {userIds.map((id) => (
                    <option key={id} value={id}>
                      {labelForUserOption(id)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600">{t("labelPercent")}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={row.rebatePercent || ""}
                  onChange={(e) => updateOverride(i, "rebatePercent", e.target.value === "" ? 0 : Number(e.target.value))}
                  className="border border-slate-300 rounded px-2 py-1.5 w-20"
                />
              </label>
              <button
                type="button"
                onClick={() => removeOverride(i)}
                className="px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                {t("btnDelete")}
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOverride}
          className="mt-3 px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50"
        >
          {t("btnAddOverride")}
        </button>
      </section>

      {/* 計算 */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <button
          type="button"
          onClick={run}
          className="px-5 py-2.5 bg-slate-800 text-white rounded hover:bg-slate-700 font-medium"
        >
          {t("btnCalculate")}
        </button>
        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}
      </section>

      {/* 或從檔案匯入 */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700 mb-2">{t("sectionImport")}</h2>
        <p className="text-sm text-slate-500 mb-4">{t("importDesc")}</p>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-slate-600 mb-1">{t("importUsers")}</label>
            <input
              type="file"
              accept=".json,.csv,.txt"
              onChange={(e) => handleFile("users", e)}
              className="block text-sm text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border file:border-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">{t("importTrades")}</label>
            <input
              type="file"
              accept=".json,.csv,.txt"
              onChange={(e) => handleFile("trades", e)}
              className="block text-sm text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border file:border-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">{t("importOverrides")}</label>
            <input
              type="file"
              accept=".json,.csv,.txt"
              onChange={(e) => handleFile("overrides", e)}
              className="block text-sm text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border file:border-slate-300"
            />
          </div>
        </div>
      </section>

      {result && (
        <div ref={resultSectionRef} className="space-y-8">
          <p className="text-sm font-medium text-green-700 bg-green-50 px-3 py-2 rounded border border-green-200">
            {t("resultDone")}
          </p>
          <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">{t("summaryTitle")}</h2>
            {(() => {
              const selfUserId =
                Array.from(result.resolvedUsers.values()).find((u) => !u.referrerId)?.id ?? null;
              const selfRebateUsd = selfUserId ? (result.userRebateTotalUsd.get(selfUserId) ?? 0) : 0;
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded border border-slate-200">
                    <div className="text-sm text-slate-500">{t("summaryPlatformNet")}</div>
                    <div className="text-xl font-semibold text-slate-800">
                      {result.platformTotalNetUsd.toLocaleString(numberLocale, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded border border-slate-200">
                    <div
                      className="text-sm text-slate-500 cursor-help"
                      title={t("summaryRebateTotalTitle")}
                    >
                      {t("summaryRebateTotal")}
                    </div>
                    <div className="text-xl font-semibold text-slate-800">
                      {Array.from(result.userRebateTotalUsd.values())
                        .reduce((a, b) => a + b, 0)
                        .toLocaleString(numberLocale, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded border border-amber-200">
                    <div className="text-sm text-slate-500">{t("summarySelfRebate")}</div>
                    <div className="text-xl font-semibold text-slate-800">
                      {selfRebateUsd.toLocaleString(numberLocale, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>

          <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm overflow-x-auto">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">{t("userTableTitle")}</h2>
            <p className="text-sm text-slate-500 mb-3">{t("userTableHint1")}</p>
            <p className="text-sm text-slate-500 mb-3">
              <strong>{t("userTableHint2Bold")}</strong>
              {t("userTableHint2")}
            </p>
            {result.tradeResults.length > 0 &&
              Array.from(result.userRebateTotalUsd.values()).every((v) => v === 0) && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
                {t("userTableWarnZero")}
              </p>
            )}
            {(() => {
              const selfUserId =
                Array.from(result.resolvedUsers.values()).find((u) => !u.referrerId)?.id ?? null;
              const referrerMap = new Map<string, string>();
              users.forEach((u) => {
                if (u.referrerId) referrerMap.set(u.id, u.referrerId);
              });
              const contributionToSelfByUser = new Map<string, number>();
              if (selfUserId) {
                for (const tr of result.tradeResults) {
                  const selfAlloc =
                    tr.allocations.find((a) => a.userId === selfUserId)?.amountUsd ?? 0;
                  if (selfAlloc <= 0) continue;
                  for (const u of Array.from(result.resolvedUsers.values())) {
                    if (u.id === selfUserId) continue;
                    if (
                      tr.trade.userId === u.id ||
                      isAncestor(u.id, tr.trade.userId, referrerMap)
                    ) {
                      contributionToSelfByUser.set(
                        u.id,
                        (contributionToSelfByUser.get(u.id) ?? 0) + selfAlloc
                      );
                    }
                  }
                }
              }
              const sortedUsers = Array.from(result.resolvedUsers.values()).sort((a, b) => {
                if (a.id === selfUserId) return -1;
                if (b.id === selfUserId) return 1;
                return 0;
              });
              return (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-2">{t("thUserId")}</th>
                      <th className="text-left py-2 px-2">{t("thType")}</th>
                      <th
                        className="text-right py-2 px-2 cursor-help"
                        title={t("thVol30dTitle")}
                      >
                        {t("thVol30d")}
                      </th>
                      <th className="text-left py-2 px-2">{t("thVip")}</th>
                      <th className="text-right py-2 px-2">{t("thExtraReq")}</th>
                      <th className="text-right py-2 px-2">{t("thRebatePct")}</th>
                      <th
                        className="text-right py-2 px-2 cursor-help"
                        title={t("thRebateIncomeTitle")}
                      >
                        {t("thRebateIncome")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((u) => {
                      const isSelf = u.id === selfUserId;
                      const amount =
                        isSelf
                          ? (result.userRebateTotalUsd.get(u.id) ?? 0)
                          : (contributionToSelfByUser.get(u.id) ?? 0);
                      return (
                        <tr
                          key={u.id}
                          className={
                            isSelf
                              ? "border-b border-slate-100 bg-amber-50/70"
                              : "border-b border-slate-100"
                          }
                        >
                          <td className="py-2 px-2 font-mono">
                            {isSelf ? t("tableSelf") : u.id}
                          </td>
                          <td className="py-2 px-2">
                            {u.type === "client"
                              ? t("typeClient")
                              : u.type === "ambassador"
                                ? t("typeAmbassador")
                                : t("typeInvestor")}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {u.volume30dSubtreeUsd.toLocaleString(numberLocale, {
                              maximumFractionDigits: 0,
                            })}
                          </td>
                          <td className="py-2 px-2">{u.vipTier.name}</td>
                          <td className="py-2 px-2 text-right">
                            {u.type === "client"
                              ? u.rebatePercentIfQualified != null
                                ? t("statusNotQualified")
                                : t("statusQualified")
                              : t("statusDash")}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {u.rebatePercent}%
                            {u.rebatePercentIfQualified != null && (
                              <span className="block text-xs text-slate-500 mt-0.5">
                                {t("rebateIfQualified")}
                                {u.rebatePercentIfQualified}%
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {amount.toLocaleString(numberLocale, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </section>

          <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm overflow-x-auto">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">{t("tradeDetailTitle")}</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2">{t("thTime")}</th>
                  <th className="text-left py-2 px-2">{t("thTradeUserCol")}</th>
                  <th className="text-left py-2 px-2">{t("thDirection")}</th>
                  <th className="text-right py-2 px-2">{t("thVolume")}</th>
                  <th className="text-right py-2 px-2">{t("thFee")}</th>
                  <th className="text-right py-2 px-2">{t("thPlatformNet")}</th>
                  <th className="text-left py-2 px-2">{t("thAllocations")}</th>
                </tr>
              </thead>
              <tbody>
                {result.tradeResults.slice(0, 50).map((tr, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 px-2">
                      {new Date(tr.trade.timestamp).toLocaleDateString(numberLocale)}
                    </td>
                    <td className="py-2 px-2 font-mono">{tr.trade.userId}</td>
                    <td className="py-2 px-2">
                      {tr.trade.side === "maker" ? t("sideMaker") : t("sideTaker")}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {tr.trade.volumeUsd.toLocaleString(numberLocale, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2 px-2 text-right">{tr.feeUsd.toFixed(4)}</td>
                    <td className="py-2 px-2 text-right">{tr.platformNetUsd.toFixed(4)}</td>
                    <td className="py-2 px-2 text-left align-top">
                      {tr.allocations.length
                        ? tr.allocations.map((a, j) => (
                            <div key={j} className="leading-tight py-0.5">
                              {a.userId}: {a.amountUsd.toFixed(4)} ({a.rebatePercent}%)
                            </div>
                          ))
                        : t("tradeAllocEmpty")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.tradeResults.length > 50 && (
              <p className="text-sm text-slate-500 mt-2">
                {formatCount(t("tradeShowFirst"), result.tradeResults.length)}
              </p>
            )}
          </section>

          <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm overflow-x-auto">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">{t("progressTitle")}</h2>
            <p className="text-sm text-slate-500 mb-3">{t("progressNote")}</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2">{t("thUserId")}</th>
                  <th className="text-left py-2 px-2">{t("thIdentity")}</th>
                  <th className="text-left py-2 px-2">{t("thGrade")}</th>
                  <th className="text-left py-2 px-2">{t("thTurnoverReq")}</th>
                  <th className="text-right py-2 px-2">{t("thCurrentTurnover")}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(result.resolvedUsers.values())
                  .filter((u) => u.isAmbassadorOrInvestor)
                  .map((u) => {
                    const asOf =
                      trades.length > 0
                        ? new Date(Math.max(...trades.map((t) => new Date(t.timestamp).getTime())))
                        : new Date();
                    const subtreeVol = computeSubtreeVolume30d(
                      u.id,
                      users,
                      trades.map((t) => ({ userId: t.userId, timestamp: t.timestamp, volumeUsd: t.volumeUsd })),
                      asOf
                    );
                    const gradeName =
                      u.type === "ambassador" && u.ambassadorGradeId
                        ? getAmbassadorGradeById(
                            u.ambassadorGradeId,
                            calculatorRules.ambassadorGrades
                          )?.name ?? u.ambassadorGradeId
                        : u.type === "investor" && u.investorGradeId
                          ? getInvestorGradeById(
                              u.investorGradeId,
                              calculatorRules.investorGrades
                            )?.name ?? u.investorGradeId
                          : "-";
                    const requirement =
                      u.type === "ambassador" && u.ambassadorGradeId
                        ? getAmbassadorGradeById(
                            u.ambassadorGradeId,
                            calculatorRules.ambassadorGrades
                          )?.turnoverRequirement ?? "-"
                        : u.type === "investor" && u.investorGradeId
                          ? getInvestorGradeById(
                              u.investorGradeId,
                              calculatorRules.investorGrades
                            )?.turnoverRequirement ?? "-"
                          : "-";
                    return (
                      <tr key={u.id} className="border-b border-slate-100">
                        <td className="py-2 px-2 font-mono">{u.id}</td>
                        <td className="py-2 px-2">
                          {u.type === "client"
                            ? t("typeClient")
                            : u.type === "ambassador"
                              ? t("typeAmbassador")
                              : t("typeInvestor")}
                        </td>
                        <td className="py-2 px-2">{gradeName}</td>
                        <td className="py-2 px-2">{requirement}</td>
                        <td className="py-2 px-2 text-right">
                          {subtreeVol.toLocaleString(numberLocale, { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {Array.from(result.resolvedUsers.values()).filter((u) => u.isAmbassadorOrInvestor).length === 0 && (
              <p className="text-sm text-slate-500 py-2">{t("progressEmpty")}</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
