"use client";

/**
 * 費率與規則參考：可摺疊、可編輯（密碼 XOX，僅防誤觸非安全機制）。
 */
import { useCallback, useState } from "react";
import type { CalculatorRules } from "@/lib/calculator-rules";
import {
  getDefaultCalculatorRules,
  saveCalculatorRulesToStorage,
  clearCalculatorRulesStorage,
} from "@/lib/calculator-rules";
import type { MessageKey } from "@/i18n/messages";

const RULES_EDIT_PASSWORD = "XOX";

function formatFeePercentLabel(configValue: number): string {
  const pct = (configValue / 10_000) * 100;
  const dec =
    Math.abs(pct) >= 0.01 || pct === 0
      ? parseFloat(pct.toFixed(6))
      : parseFloat(pct.toFixed(8));
  return `${dec}%`;
}

function cloneRules(r: CalculatorRules): CalculatorRules {
  return JSON.parse(JSON.stringify(r)) as CalculatorRules;
}

type PasswordMode = "unlock" | "save" | "reset" | null;

interface Props {
  rules: CalculatorRules;
  onApplyRules: (next: CalculatorRules) => void;
  t: (key: MessageKey) => string;
  /** toLocaleString locale for thresholds (e.g. zh-TW / en-US) */
  numberLocale: string;
}

export function RulesReferenceSection({
  rules,
  onApplyRules,
  t,
  numberLocale,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CalculatorRules | null>(null);
  const [passwordMode, setPasswordMode] = useState<PasswordMode>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const display = editing && draft ? draft : rules;

  const openPassword = useCallback((mode: PasswordMode) => {
    setPasswordMode(mode);
    setPasswordInput("");
    setPasswordError("");
  }, []);

  const verifyPassword = useCallback(() => {
    if (passwordInput !== RULES_EDIT_PASSWORD) {
      setPasswordError(t("rulesWrongPassword"));
      return false;
    }
    return true;
  }, [passwordInput, t]);

  const handlePasswordSubmit = useCallback(() => {
    if (!verifyPassword()) return;
    if (passwordMode === "unlock") {
      setDraft(cloneRules(rules));
      setEditing(true);
    } else if (passwordMode === "save" && draft) {
      saveCalculatorRulesToStorage(draft);
      onApplyRules(draft);
      setEditing(false);
      setDraft(null);
    } else if (passwordMode === "reset") {
      const def = getDefaultCalculatorRules();
      clearCalculatorRulesStorage();
      onApplyRules(def);
      setEditing(false);
      setDraft(null);
    }
    setPasswordMode(null);
    setPasswordInput("");
  }, [passwordMode, draft, rules, onApplyRules, verifyPassword]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setDraft(null);
  }, []);

  return (
    <>
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-2 text-left text-lg font-semibold text-slate-700 hover:text-slate-900"
          >
            <span className="text-slate-500 w-6">{expanded ? "▼" : "▶"}</span>
            {t("rulesTitle")}
          </button>
          <div className="flex flex-wrap gap-2">
            {!editing ? (
              <>
                <button
                  type="button"
                  onClick={() => openPassword("unlock")}
                  className="px-3 py-1.5 text-sm border border-amber-300 bg-amber-50 text-amber-900 rounded hover:bg-amber-100"
                >
                  {t("rulesEditWithPass")}
                </button>
                <button
                  type="button"
                  onClick={() => openPassword("reset")}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50"
                >
                  {t("rulesResetWithPass")}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openPassword("save")}
                  className="px-3 py-1.5 text-sm bg-slate-800 text-white rounded hover:bg-slate-700"
                >
                  {t("rulesSaveWithPass")}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded hover:bg-slate-50"
                >
                  {t("rulesCancel")}
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-2">{t("rulesP1")}</p>
        <p className="text-xs text-slate-400 mb-4">{t("rulesP2")}</p>

        {expanded && (
          <div className="space-y-8 pt-2 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              {t("rulesEditHintBefore")}
              <strong>{t("rulesEditHintStrong")}</strong>
              {t("rulesEditHintAfter")}
            </p>

            {/* VIP */}
            <div>
              <h3 className="text-base font-medium text-slate-700 mb-2">
                {t("rulesVipHeading")}
              </h3>
              <p className="text-sm text-slate-500 mb-3">
                {t("rulesVipNoteOnlySelf")}
              </p>
              <div className="overflow-x-auto rounded border border-slate-200">
                <table
                  className={`w-full text-sm border-collapse ${editing && draft ? "min-w-[720px]" : "min-w-[520px]"}`}
                >
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-2 px-3">{t("rulesThVipName")}</th>
                      <th className="text-right py-2 px-3">{t("rulesThThreshold")}</th>
                      {editing && draft && (
                        <>
                          <th className="text-right py-2 px-3">{t("rulesThMakerCfg")}</th>
                          <th className="text-right py-2 px-3">{t("rulesThTakerCfg")}</th>
                        </>
                      )}
                      <th className="text-right py-2 px-3">{t("rulesThMakerPct")}</th>
                      <th className="text-right py-2 px-3">{t("rulesThTakerPct")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {display.vipScheme.map((vipRow, i) => (
                      <tr key={vipRow.id} className="border-b border-slate-100">
                        <td className="py-2 px-3">{vipRow.name}</td>
                        <td className="py-2 px-3 text-right">
                          {editing && draft ? (
                            <input
                              type="number"
                              className="w-28 border rounded px-1 py-0.5 text-right font-mono"
                              value={draft.vipScheme[i].minVolumeUsd}
                              onChange={(e) => {
                                const v = Number(e.target.value) || 0;
                                setDraft((d) => {
                                  if (!d) return d;
                                  const next = cloneRules(d);
                                  next.vipScheme[i].minVolumeUsd = v;
                                  return next;
                                });
                              }}
                            />
                          ) : (
                            vipRow.minVolumeUsd.toLocaleString(numberLocale)
                          )}
                        </td>
                        {editing && draft && (
                          <>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="any"
                                className="w-20 border rounded px-1 py-0.5 text-right font-mono"
                                value={draft.vipScheme[i].makerBps}
                                onChange={(e) => {
                                  const v = Number(e.target.value) || 0;
                                  setDraft((d) => {
                                    if (!d) return d;
                                    const next = cloneRules(d);
                                    next.vipScheme[i].makerBps = v;
                                    return next;
                                  });
                                }}
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="any"
                                className="w-20 border rounded px-1 py-0.5 text-right font-mono"
                                value={draft.vipScheme[i].takerBps}
                                onChange={(e) => {
                                  const v = Number(e.target.value) || 0;
                                  setDraft((d) => {
                                    if (!d) return d;
                                    const next = cloneRules(d);
                                    next.vipScheme[i].takerBps = v;
                                    return next;
                                  });
                                }}
                              />
                            </td>
                          </>
                        )}
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {formatFeePercentLabel(vipRow.makerBps)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {formatFeePercentLabel(vipRow.takerBps)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* EdgeX */}
            <div>
              <h3 className="text-base font-medium text-slate-700 mb-2">
                {t("rulesEdgexHeading")}
              </h3>
              <div className="overflow-x-auto rounded border border-slate-200">
                <table
                  className={`w-full text-sm border-collapse ${editing && draft ? "min-w-[360px]" : "min-w-[240px]"}`}
                >
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-2 px-3">{t("rulesThDirection")}</th>
                      {editing && draft && (
                        <th className="text-right py-2 px-3">{t("rulesThCfgValue")}</th>
                      )}
                      <th className="text-right py-2 px-3">{t("rulesThPct")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 px-3">{t("sideMaker")}</td>
                      {editing && draft && (
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="any"
                            className="w-24 border rounded px-1 py-0.5 text-right font-mono"
                            value={draft.edgexShare.makerBps}
                            onChange={(e) => {
                              const v = Number(e.target.value) || 0;
                              setDraft((d) =>
                                d ? { ...d, edgexShare: { ...d.edgexShare, makerBps: v } } : d
                              );
                            }}
                          />
                        </td>
                      )}
                      <td className="py-2 px-3 text-right font-mono">
                        {formatFeePercentLabel(display.edgexShare.makerBps)}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 px-3">{t("sideTaker")}</td>
                      {editing && draft && (
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="any"
                            className="w-24 border rounded px-1 py-0.5 text-right font-mono"
                            value={draft.edgexShare.takerBps}
                            onChange={(e) => {
                              const v = Number(e.target.value) || 0;
                              setDraft((d) =>
                                d ? { ...d, edgexShare: { ...d.edgexShare, takerBps: v } } : d
                              );
                            }}
                          />
                        </td>
                      )}
                      <td className="py-2 px-3 text-right font-mono">
                        {formatFeePercentLabel(display.edgexShare.takerBps)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Client rebate */}
            <div>
              <h3 className="text-base font-medium text-slate-700 mb-2">
                {t("rulesClientRebateHeading")}
              </h3>
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="w-full text-sm border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-2 px-3">{t("rulesThTier")}</th>
                      <th className="text-right py-2 px-3">{t("rulesThVolThreshold")}</th>
                      <th className="text-right py-2 px-3">{t("rulesThRefCount")}</th>
                      <th className="text-right py-2 px-3">{t("thRebatePct")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {display.clientRebateScheme.map((tierRow, i) => (
                      <tr key={tierRow.id} className="border-b border-slate-100">
                        <td className="py-2 px-3">
                          {t("rulesThTier")} {tierRow.tier}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {editing && draft ? (
                            <input
                              type="number"
                              className="w-28 border rounded px-1 text-right font-mono"
                              value={draft.clientRebateScheme[i].minVolumeUsd}
                              onChange={(e) => {
                                const v = Number(e.target.value) || 0;
                                setDraft((d) => {
                                  if (!d) return d;
                                  const next = cloneRules(d);
                                  next.clientRebateScheme[i].minVolumeUsd = v;
                                  return next;
                                });
                              }}
                            />
                          ) : (
                            tierRow.minVolumeUsd.toLocaleString(numberLocale)
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {editing && draft ? (
                            <input
                              type="number"
                              className="w-16 border rounded px-1 text-right"
                              value={draft.clientRebateScheme[i].minReferrals100k}
                              onChange={(e) => {
                                const v = Number(e.target.value) || 0;
                                setDraft((d) => {
                                  if (!d) return d;
                                  const next = cloneRules(d);
                                  next.clientRebateScheme[i].minReferrals100k = v;
                                  return next;
                                });
                              }}
                            />
                          ) : (
                            tierRow.minReferrals100k
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {editing && draft ? (
                            <input
                              type="number"
                              className="w-16 border rounded px-1 text-right"
                              value={draft.clientRebateScheme[i].rebatePercent}
                              onChange={(e) => {
                                const v = Number(e.target.value) || 0;
                                setDraft((d) => {
                                  if (!d) return d;
                                  const next = cloneRules(d);
                                  next.clientRebateScheme[i].rebatePercent = v;
                                  return next;
                                });
                              }}
                            />
                          ) : (
                            <span className="font-mono">{tierRow.rebatePercent}%</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ambassador */}
            <div>
              <h3 className="text-base font-medium text-slate-700 mb-2">
                {t("rulesAmbHeading")}
              </h3>
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="w-full text-sm border-collapse min-w-[720px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-2 px-3">{t("thGrade")}</th>
                      <th className="text-left py-2 px-3">{t("rulesThTurnover")}</th>
                      <th className="text-left py-2 px-3">{t("rulesThCommVip")}</th>
                      <th className="text-right py-2 px-3">{t("thRebatePct")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {display.ambassadorGrades.map((g, i) => (
                      <tr key={g.id} className="border-b border-slate-100">
                        <td className="py-2 px-3">{g.name}</td>
                        <td className="py-2 px-3">
                          {editing && draft ? (
                            <input
                              type="text"
                              className="w-full min-w-[120px] border rounded px-1 text-sm"
                              value={draft.ambassadorGrades[i].turnoverRequirement}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDraft((d) => {
                                  if (!d) return d;
                                  const next = cloneRules(d);
                                  next.ambassadorGrades[i].turnoverRequirement = v;
                                  return next;
                                });
                              }}
                            />
                          ) : (
                            g.turnoverRequirement
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {editing && draft ? (
                            <input
                              type="text"
                              className="w-24 border rounded px-1"
                              value={draft.ambassadorGrades[i].commissionVip}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDraft((d) => {
                                  if (!d) return d;
                                  const next = cloneRules(d);
                                  next.ambassadorGrades[i].commissionVip = v;
                                  return next;
                                });
                              }}
                            />
                          ) : (
                            g.commissionVip
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {editing && draft ? (
                            <input
                              type="number"
                              className="w-16 border rounded px-1 text-right"
                              value={draft.ambassadorGrades[i].commissionRebatePercent}
                              onChange={(e) => {
                                const v = Number(e.target.value) || 0;
                                setDraft((d) => {
                                  if (!d) return d;
                                  const next = cloneRules(d);
                                  next.ambassadorGrades[i].commissionRebatePercent = v;
                                  return next;
                                });
                              }}
                            />
                          ) : (
                            <span className="font-mono">{g.commissionRebatePercent}%</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contributor */}
            <div>
              <h3 className="text-base font-medium text-slate-700 mb-2">
                {t("rulesContribHeading")}
              </h3>
              <p className="text-sm text-slate-500 mb-2">
                {t("rulesContribNotePrefix")}
                <code className="text-xs bg-slate-100 px-1 rounded">investor.ts</code>
                {t("rulesContribNoteSuffix")}
              </p>
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="w-full text-sm border-collapse min-w-[480px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-2 px-3">{t("thGrade")}</th>
                      <th className="text-left py-2 px-3">{t("rulesThCommVip")}</th>
                      <th className="text-right py-2 px-3">{t("thRebatePct")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {display.investorGrades.map((g, i) => (
                      <tr key={g.id} className="border-b border-slate-100">
                        <td className="py-2 px-3">{g.name}</td>
                        <td className="py-2 px-3">
                          {editing && draft ? (
                            <input
                              type="text"
                              className="w-24 border rounded px-1"
                              value={draft.investorGrades[i].commissionVip}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDraft((d) => {
                                  if (!d) return d;
                                  const next = cloneRules(d);
                                  next.investorGrades[i].commissionVip = v;
                                  return next;
                                });
                              }}
                            />
                          ) : (
                            g.commissionVip
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {editing && draft ? (
                            <input
                              type="number"
                              className="w-16 border rounded px-1 text-right"
                              value={draft.investorGrades[i].commissionRebatePercent}
                              onChange={(e) => {
                                const v = Number(e.target.value) || 0;
                                setDraft((d) => {
                                  if (!d) return d;
                                  const next = cloneRules(d);
                                  next.investorGrades[i].commissionRebatePercent = v;
                                  return next;
                                });
                              }}
                            />
                          ) : (
                            <span className="font-mono">{g.commissionRebatePercent}%</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      {passwordMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-lg max-w-sm w-full p-5 space-y-3">
            <h4 className="font-semibold text-slate-800">
              {passwordMode === "unlock" && t("rulesModalUnlockTitle")}
              {passwordMode === "save" && t("rulesModalSaveTitle")}
              {passwordMode === "reset" && t("rulesModalResetTitle")}
            </h4>
            <input
              type="password"
              autoFocus
              className="w-full border border-slate-300 rounded px-3 py-2"
              placeholder={t("rulesModalPlaceholder")}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
            />
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-3 py-1.5 text-sm border rounded"
                onClick={() => {
                  setPasswordMode(null);
                  setPasswordInput("");
                  setPasswordError("");
                }}
              >
                {t("rulesModalCancel")}
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-sm bg-slate-800 text-white rounded"
                onClick={handlePasswordSubmit}
              >
                {t("rulesModalConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
