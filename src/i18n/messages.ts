/**
 * UI copy for DEX commission calculator. Add a locale + matching keys to extend.
 * Internal data values (e.g. referral100kStatus "達到"|"未達到", user id "本人") stay in Chinese for calculator logic.
 */

export type Locale = "zh-TW" | "en";

/** localStorage key for persisted UI language */
export const LOCALE_STORAGE_KEY = "dex-calc-locale-v1" as const;

const zhTW = {
  pageTitle: "DEX 銷售獲益（提成）計算器",
  languageSelectAria: "介面語言",
  langZhTw: "繁體中文",
  langEn: "English",

  sectionUsers: "用戶",
  sectionSelfBadge: "本人 (Sales)",
  sectionTeamLabel: "我的團隊／被推薦人",
  labelUserId: "用戶 ID",
  selfIdDisplay: "本人",
  labelType: "類型",
  typeClient: "普通客戶",
  typeAmbassador: "Ambassador",
  typeInvestor: "Investor",
  labelAmbassadorGrade: "Ambassador 等級",
  labelInvestorGrade: "Investor 等級",
  labelVipTier: "VIP 檔位（Maker/Taker 費率）",
  labelVipTierTitle:
    "決定該客戶的 Maker/Taker 手續費率；選「自動」則依 30 日交易量計算",
  vipAuto: "自動（依 30 日交易量）",
  labelExtraReq: "額外要求",
  labelExtraReqTitle:
    "達標／不達標由銷售手動勾選。達標＝依當前 VIP 檔位之 Commission Rebate 全額；不達標＝依 VIP 階序降一級（Non VIP 不達標或已最低階則 0%）。",
  extraQualified: "達標",
  extraNotQualified: "不達標",
  labelReferrer: "推薦人",
  optionSelf: "本人",
  placeholderUserExample: "例: b",
  btnDelete: "刪除",
  btnAddUser: "新增一筆用戶",

  sectionTrades: "交易",
  labelTradeUser: "執行交易的用戶",
  optionAddUsersFirst: "— 請先添加用戶 —",
  labelVolumeUsd: "交易量 (USD)",
  labelSide: "方向",
  labelDate: "日期",
  btnAddTrade: "新增一筆交易",

  sectionOverrides: "手動返傭覆蓋（可選）",
  overridesDesc:
    "當上線與下線同為大使／投資者時，可指定上線從下線手續費中拿到的比例 %",
  labelFromUser: "從用戶（產生返傭）",
  labelToUser: "給用戶",
  labelPercent: "比例 %",
  btnAddOverride: "新增一筆覆蓋",

  btnCalculate: "立即計算",

  sectionImport: "或從檔案匯入",
  importDesc:
    "可選：上傳 JSON/CSV 覆蓋目前表單中的用戶、交易或手動返傭覆蓋",
  importUsers: "用戶列表 (JSON/CSV)",
  importTrades: "交易流水 (JSON/CSV)",
  importOverrides: "手動返傭覆蓋 (JSON/CSV)",

  errMinUsers: "請至少添加一個用戶（並填寫用戶 ID）",
  errMinTrades:
    "請至少添加一筆交易：選擇「執行交易的用戶」且「交易量 (USD)」大於 0",

  resultDone: "計算完成，以下為結果",
  summaryTitle: "匯總",
  summaryPlatformNet: "平台總淨收入 (USD)",
  summaryRebateTotal: "返傭支出合計 (USD)",
  summaryRebateTotalTitle:
    "給銷售／推薦鏈的分成總額：包含大使、投資者、客戶返傭層級等從其下線交易中獲得的返傭合計",
  summarySelfRebate: "本人返傭收入 (USD)",

  userTableTitle: "用戶等級與返傭匯總",
  userTableHint1:
    "本人列為您的返傭總額。其餘用戶列顯示：本人因「該用戶作為交易者」的成交所獲得之返傭（例如 b 成交對應上線第 1 層那份、c 成交對應上線第 2 層那份）。",
  rebateEquationSummary: "返傭計算公式（點開展開）",
  rebateEquationBody: `【單筆返傭基數】與「平台淨收入」欄位一致（已先扣 EdgeX）：
rebateBase = 成交量 × (VIP Maker 或 Taker 費率) − 成交量 × (EdgeX Maker 或 Taker 固定分成)
         = feeUsd − edgexUsd = platformNetUsd

若 rebateBase ≤ 0，該筆不分配返傭。

【多層階差】沿推薦鏈 [交易者, 上線1, 上線2, …]（至多三層），對每一對相鄰 (下線, 上線)：
上線金額 = rebateBase × max(0, Commission Rebate%(上線) − Commission Rebate%(下線)) ÷ 100

【手動覆蓋】若設定「從用戶（產生者）→ 給用戶」的覆蓋比例，則該邊以覆蓋% 取代階差%。
【雙大使】若交易者與該上線同為大使／投資者，該邊階差視為 0（除非覆蓋另有指定）。`,
  userTableWarnZero:
    "目前所有返傭為 0。請檢查下方「交易明細」：若每筆「手續費」為 0 或「返傭分配」皆為 —，表示無可分配之階差返傭（例如無上線、階差皆 ≤0、或交易未對應到用戶）。請確認推薦鏈與資料後重新點擊「計算」。",

  thUserId: "用戶 ID",
  thType: "類型",
  thVol30d: "30 日交易量 (USD)",
  thVol30dTitle: "本人 + 引薦的人及下線的 30 日交易量合計",
  thVip: "VIP",
  thExtraReq: "額外要求",
  thRebatePct: "Rebate%",
  thRebateIncome: "返傭收入／對本人貢獻 (USD)",
  thRebateIncomeTitle:
    "本人列＝返傭總額；其他列＝本人因該用戶執行交易而獲得的返傭 (USD)。",

  tableSelf: "本人",
  statusQualified: "達標",
  statusNotQualified: "不達標",
  statusDash: "—",
  rebateIfQualified: "若達標可得：",

  tradeDetailTitle: "交易明細（前 50 筆）",
  thTime: "時間",
  thTradeUserCol: "用戶",
  thDirection: "方向",
  thVolume: "交易量 (USD)",
  thFee: "手續費 (USD)",
  thPlatformNet: "平台淨收入 (USD)",
  thAllocations: "返傭分配",
  tradeAllocEmpty: "-",

  tradeShowFirst: "僅顯示前 50 筆，共 {count} 筆",

  progressTitle: "大使／投資者達標進度",
  progressNote: "Turnover = 本人 + 下線 30 日交易量合計",
  thIdentity: "身份",
  thGrade: "等級",
  thTurnoverReq: "Turnover 要求",
  thCurrentTurnover: "目前 Turnover (USD)",
  progressEmpty: "目前無大使／投資者",

  // RulesReferenceSection
  rulesTitle: "費率與規則參考",
  rulesEditWithPass: "編輯規則（需密碼）",
  rulesResetWithPass: "還原預設（需密碼）",
  rulesSaveWithPass: "儲存並套用（需密碼）",
  rulesCancel: "取消",
  rulesP1:
    "以下數值與計算器邏輯一致；修改後請按「儲存並套用」，並重新檢查下方計算結果。",
  rulesP2: "密碼僅用於防誤觸，非加密安全機制。",
  rulesEditHintBefore:
    "平時僅顯示百分比 (%)。進入編輯後會出現",
  rulesEditHintStrong: "設定值",
  rulesEditHintAfter:
    "欄，請填設定檔數值（手續費＝交易量 × 數值 ÷ 10,000）。",

  rulesVipHeading: "VIP 等級與 Maker／Taker 費率",
  rulesVipNoteOnlySelf: "30 日交易量僅計本人。",
  rulesThVipName: "VIP 名稱",
  rulesThThreshold: "門檻 (USD)",
  rulesThMakerCfg: "Maker 設定值",
  rulesThTakerCfg: "Taker 設定值",
  rulesThMakerPct: "Maker (%)",
  rulesThTakerPct: "Taker (%)",
  rulesThCommissionRebate: "Commission Rebate",

  rulesEdgexHeading: "EdgeX 固定分成",
  rulesThDirection: "方向",
  rulesThCfgValue: "設定值",
  rulesThPct: "(%)",

  rulesClientRebateHeading: "普通客戶返傭階梯",
  rulesThTier: "階梯",
  rulesThVolThreshold: "交易量門檻",
  rulesThRefCount: "推薦人數",

  rulesAmbHeading: "Ambassador 等級（摘要）",
  rulesThTurnover: "Turnover",
  rulesThCommVip: "Commission VIP",

  rulesContribHeading: "Contributor 等級（摘要）",
  rulesContribNotePrefix: "對應表單類型「Investor」；檔名 ",
  rulesContribNoteSuffix: "。",

  rulesWrongPassword: "密碼錯誤",
  rulesModalUnlockTitle: "輸入密碼以編輯規則",
  rulesModalSaveTitle: "輸入密碼以儲存並套用",
  rulesModalResetTitle: "輸入密碼以還原預設規則",
  rulesModalPlaceholder: "密碼",
  rulesModalCancel: "取消",
  rulesModalConfirm: "確認",

  sideMaker: "Maker",
  sideTaker: "Taker",
};

export type MessageKey = keyof typeof zhTW;

const en: Record<MessageKey, string> = {
  pageTitle: "DEX Sales Commission Calculator",
  languageSelectAria: "Interface language",
  langZhTw: "繁體中文",
  langEn: "English",

  sectionUsers: "Users",
  sectionSelfBadge: "Self (Sales)",
  sectionTeamLabel: "My team / referred users",
  labelUserId: "User ID",
  selfIdDisplay: "Self",
  labelType: "Type",
  typeClient: "Retail client",
  typeAmbassador: "Ambassador",
  typeInvestor: "Investor",
  labelAmbassadorGrade: "Ambassador tier",
  labelInvestorGrade: "Investor tier",
  labelVipTier: "VIP tier (Maker/Taker fee)",
  labelVipTierTitle:
    "Sets this client’s Maker/Taker fee rates; “Auto” derives fees from 30-day volume.",
  vipAuto: "Auto (from 30-day volume)",
  labelExtraReq: "Extra requirement",
  labelExtraReqTitle:
    "Qualified / not qualified is set manually by sales. Qualified: full Commission Rebate for the current VIP tier. Not qualified: one VIP tier lower (Non VIP or lowest → 0%).",
  extraQualified: "Qualified",
  extraNotQualified: "Not qualified",
  labelReferrer: "Referrer",
  optionSelf: "Self",
  placeholderUserExample: "e.g. b",
  btnDelete: "Remove",
  btnAddUser: "Add user",

  sectionTrades: "Trades",
  labelTradeUser: "Trading user",
  optionAddUsersFirst: "— Add users first —",
  labelVolumeUsd: "Volume (USD)",
  labelSide: "Side",
  labelDate: "Date",
  btnAddTrade: "Add trade",

  sectionOverrides: "Manual rebate overrides (optional)",
  overridesDesc:
    "When both upline and downline are ambassadors or investors, set the % of fees the upline takes from the downline.",
  labelFromUser: "From user (rebate source)",
  labelToUser: "To user",
  labelPercent: "Percent %",
  btnAddOverride: "Add override",

  btnCalculate: "Calculate",

  sectionImport: "Or import from file",
  importDesc:
    "Optional: upload JSON/CSV to replace users, trades, or manual rebate overrides in the form.",
  importUsers: "Users (JSON/CSV)",
  importTrades: "Trades (JSON/CSV)",
  importOverrides: "Manual overrides (JSON/CSV)",

  errMinUsers: "Add at least one user (with a user ID).",
  errMinTrades:
    "Add at least one trade: pick a trading user and set volume (USD) greater than 0.",

  resultDone: "Done — results below",
  summaryTitle: "Summary",
  summaryPlatformNet: "Platform net revenue (USD)",
  summaryRebateTotal: "Total rebates paid (USD)",
  summaryRebateTotalTitle:
    "Total paid to sales / referral chain: ambassadors, investors, client rebate tiers, etc., from downline trades.",
  summarySelfRebate: "Your rebate income (USD)",

  userTableTitle: "Users, tiers & rebate summary",
  userTableHint1:
    "Self row is your total rebate. Other rows show rebate you earned from trades executed by that user (e.g. b’s trades vs c’s trades in a Self→b→c chain).",
  rebateEquationSummary: "Rebate calculation formula (click to expand)",
  rebateEquationBody: `Per-trade rebate base (same as “Platform net”; EdgeX already deducted):
rebateBase = volume × (VIP Maker or Taker rate) − volume × (EdgeX Maker or Taker fixed share)
         = feeUsd − edgexUsd = platformNetUsd

If rebateBase ≤ 0, no rebate is allocated for that trade.

Multi-level tier delta along [trader, upline1, upline2, …] (up to 3 hops). For each adjacent pair (downline, upline):
upline amount = rebateBase × max(0, Commission Rebate%(upline) − Commission Rebate%(downline)) ÷ 100

Manual override: if a row sets from-user → to-user percent, that percent replaces the tier-delta slice on that edge.
Dual ambassador: if both trader and that upline are ambassador/investor, that edge’s slice is 0 unless override says otherwise.`,
  userTableWarnZero:
    "All rebates are 0. In “Trade details”, if fee is 0 or allocations are —, there is no fee-based tier-delta rebate (no upline, non-positive deltas, or bad user mapping). Fix the referral chain or data and click Calculate again.",

  thUserId: "User ID",
  thType: "Type",
  thVol30d: "30d volume (USD)",
  thVol30dTitle: "Self + referred users and downlines, 30-day volume total",
  thVip: "VIP",
  thExtraReq: "Extra req.",
  thRebatePct: "Rebate%",
  thRebateIncome: "Rebate / contribution to you (USD)",
  thRebateIncomeTitle:
    "Self row = total rebate; other rows = rebate from trades where that user was the trader (USD).",

  tableSelf: "Self",
  statusQualified: "Qualified",
  statusNotQualified: "Not qualified",
  statusDash: "—",
  rebateIfQualified: "If qualified:",

  tradeDetailTitle: "Trade details (first 50)",
  thTime: "Time",
  thTradeUserCol: "User",
  thDirection: "Side",
  thVolume: "Volume (USD)",
  thFee: "Fee (USD)",
  thPlatformNet: "Platform net (USD)",
  thAllocations: "Rebate split",
  tradeAllocEmpty: "-",

  tradeShowFirst: "Showing first 50 of {count} trades",

  progressTitle: "Ambassador / investor qualification",
  progressNote: "Turnover = self + downline 30-day volume",
  thIdentity: "Role",
  thGrade: "Tier",
  thTurnoverReq: "Turnover requirement",
  thCurrentTurnover: "Current turnover (USD)",
  progressEmpty: "No ambassadors or investors",

  rulesTitle: "Fees & rules reference",
  rulesEditWithPass: "Edit rules (password)",
  rulesResetWithPass: "Reset to defaults (password)",
  rulesSaveWithPass: "Save & apply (password)",
  rulesCancel: "Cancel",
  rulesP1:
    "These values match the calculator logic; after changes use Save & apply and re-check results below.",
  rulesP2:
    "The password only prevents accidental edits; it is not encryption or a security control.",
  rulesEditHintBefore:
    "Normally only percentages (%) are shown. In edit mode a ",
  rulesEditHintStrong: "config value",
  rulesEditHintAfter:
    " column appears: fee = volume × value ÷ 10,000.",

  rulesVipHeading: "VIP tiers & Maker/Taker fees/Commission Rebate",
  rulesVipNoteOnlySelf: "30-day volume counts self only.",
  rulesThVipName: "VIP name",
  rulesThThreshold: "Threshold (USD)",
  rulesThMakerCfg: "Maker config",
  rulesThTakerCfg: "Taker config",
  rulesThMakerPct: "Maker (%)",
  rulesThTakerPct: "Taker (%)",
  rulesThCommissionRebate: "Commission Rebate",

  rulesEdgexHeading: "EdgeX fixed share",
  rulesThDirection: "Side",
  rulesThCfgValue: "Config value",
  rulesThPct: "(%)",

  rulesClientRebateHeading: "Retail client rebate ladder",
  rulesThTier: "Tier",
  rulesThVolThreshold: "Volume threshold",
  rulesThRefCount: "Referrals",

  rulesAmbHeading: "Ambassador tiers (summary)",
  rulesThTurnover: "Turnover",
  rulesThCommVip: "Commission VIP",

  rulesContribHeading: "Contributor tiers (summary)",
  rulesContribNotePrefix: "Maps to form type “Investor”; file ",
  rulesContribNoteSuffix: ".",

  rulesWrongPassword: "Incorrect password",
  rulesModalUnlockTitle: "Enter password to edit rules",
  rulesModalSaveTitle: "Enter password to save and apply",
  rulesModalResetTitle: "Enter password to restore default rules",
  rulesModalPlaceholder: "Password",
  rulesModalCancel: "Cancel",
  rulesModalConfirm: "Confirm",

  sideMaker: "Maker",
  sideTaker: "Taker",
};

export const messages: Record<Locale, Record<MessageKey, string>> = {
  "zh-TW": zhTW,
  en,
};

export function getT(locale: Locale): (key: MessageKey) => string {
  const pack = messages[locale];
  return (key: MessageKey) => pack[key];
}

/** Replace a single {count} placeholder (for trade table footer). */
export function formatCount(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

/**
 * Number/date locale: zh-TW UI uses zh-TW grouping; en uses en-US.
 * (Keep consistent with toLocaleString for money and volumes.)
 */
export function getNumberLocale(locale: Locale): string {
  return locale === "zh-TW" ? "zh-TW" : "en-US";
}
