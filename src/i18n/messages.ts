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
    "達標＝依 30 日交易量對照表給 Rebate%；不達標＝Rebate% 為 0。",
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
    "本人列顯示總返傭收入；下線列顯示該下線（及其下線）交易為本人帶來的返傭貢獻。",
  userTableHint2Bold: "如何解讀：",
  userTableHint2:
    "本人那一欄的數字即為您的總返傭收入。下線欄的數字表示「該下線及其下線的交易為您帶來的返傭」——例如若結構為 本人→b→c，則 b 的數字已包含來自 b 與 c 交易流入您口袋的總和，c 的數字僅來自 c 的交易。因此總收入請看本人列即可，不需將下線數字加總。",
  userTableWarnZero:
    "目前所有返傭為 0。請檢查下方「交易明細」：若每筆的「手續費」「平台淨收入」「返傭分配」皆為 0 或 —，表示該筆交易未產生可分配的平台淨收入（例如交易未正確對應到用戶、或資料有誤）。請確認已填寫交易且「執行交易的用戶」為上述用戶之一，並重新點擊「計算」。",

  thUserId: "用戶 ID",
  thType: "類型",
  thVol30d: "30 日交易量 (USD)",
  thVol30dTitle: "本人 + 引薦的人及下線的 30 日交易量合計",
  thVip: "VIP",
  thExtraReq: "額外要求",
  thRebatePct: "Rebate%",
  thRebateIncome: "返傭收入／對本人貢獻 (USD)",
  thRebateIncomeTitle: "本人列＝本人總返傭收入；下線列＝該下線對本人的返傭貢獻 (USD)",

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
    "Qualified: Rebate% from the 30-day volume table. Not qualified: Rebate% is 0.",
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
    "Self row shows total rebate income; downline rows show how much each downline (and their subtree) contributed to your rebates.",
  userTableHint2Bold: "How to read:",
  userTableHint2:
    "The Self column is your total rebate. A downline column is “rebates to you from that downline’s subtree.” Example Self→b→c: b’s number already includes flows from b and c; c’s number is only from c. Use the Self row for total income — do not sum all downline columns.",
  userTableWarnZero:
    "All rebates are 0. Check “Trade details” below: if fee, platform net, and allocations are 0 or —, that trade had no distributable platform net (wrong user mapping or bad data). Ensure trades use valid users and click Calculate again.",

  thUserId: "User ID",
  thType: "Type",
  thVol30d: "30d volume (USD)",
  thVol30dTitle: "Self + referred users and downlines, 30-day volume total",
  thVip: "VIP",
  thExtraReq: "Extra req.",
  thRebatePct: "Rebate%",
  thRebateIncome: "Rebate / contribution to you (USD)",
  thRebateIncomeTitle:
    "Self row = your total rebate; downline = that downline’s contribution to you (USD)",

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

  rulesVipHeading: "VIP tiers & Maker/Taker fees",
  rulesVipNoteOnlySelf: "30-day volume counts self only.",
  rulesThVipName: "VIP name",
  rulesThThreshold: "Threshold (USD)",
  rulesThMakerCfg: "Maker config",
  rulesThTakerCfg: "Taker config",
  rulesThMakerPct: "Maker (%)",
  rulesThTakerPct: "Taker (%)",

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
