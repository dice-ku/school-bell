// src/types/index.ts

export type UserRole = 'Admin' | 'Manager' | 'Staff' | 'Viewer';

export type StaffRole =
  | '生活支援員'
  | '管理者'
  | '管理者兼生活支援員'
  | 'サービス管理責任者'
  | '管理者兼サービス管理責任者'
  | 'その他';

export interface FacilitySettings {
  facilityName: string;
  dayCapacity: number;         // 日中定員 (20)
  nightCapacity: number;       // 宿泊定員 (10)
  dayUtilizerCount: number;    // 日中配置計算用利用者数 (初期 18)
  nightUtilizerCount: number;  // 宿泊配置計算用利用者数 (初期 9)
  dayStaffingRatio: number;    // 日中配置基準 (6:1 の場合は 6)
  nightStaffingRatio: number;  // 宿泊配置基準 (10:1 の場合は 10)
  daySupportStart: string;     // 日中支援開始時刻 (09:30)
  daySupportEnd: string;       // 日中支援終了時刻 (15:30)
  nightSupportStart: string;   // 宿泊支援開始時刻 (15:30)
  nightSupportEnd: string;     // 宿泊支援終了時刻 (21:00)
  weeklyFteHours: number;      // 常勤換算1.0の週基準時間 (36.5)
  targetYearMonth: string;     // 対象年月 (YYYY-MM)
}

export interface Staff {
  id: string;                  // 職員ID
  name: string;                // 氏名
  isFullTime: boolean;         // 常勤／非常勤 (true=常勤, false=非常勤)
  role: StaffRole;             // 役割
  includeInStaffing: boolean;  // 生活支援員として算入可能か
  isSeki: boolean;             // サービス管理責任者か
  isManager: boolean;          // 管理者か
  weeklyContractedHours: number; // 週所定時間
  monthlyContractedHours: number; // 月所定時間
  isActive: boolean;           // 有効／無効
  preferredOffDays?: number[]; // 希望休 (日付 [5, 10] など)
  availableDaysOfWeek?: string[]; // 非常勤などの勤務可能曜日 (例: ['火', '木', '金'])
  appointmentReason?: string;  // 採用理由 / 算入要件 (監査における算定根拠)
}

export interface ShiftCategory {
  symbol: string;             // 勤務記号 (e.g. 日, 遅, 休, 専)
  name: string;               // 名称 (e.g. 日勤, 遅番, 休み)
  startTime: string;          // 開始時刻 (HH:MM)
  endTime: string;            // 終了時刻 (HH:MM)
  breakHours: number;         // 休憩時間 (時間、e.g. 1.0)
  workHours: number;          // 勤務時間 (時間、e.g. 7.0)
  isDaySupport: boolean;      // 日中支援に算入するか
  isNightSupport: boolean;    // 宿泊支援に算入するか
  isSupportStaffWork: boolean;// 生活支援員勤務として算入するか (管理者専任やサビ管専任は除外するため)
  isManagerOnly: boolean;     // 管理業務専任か
  isSekiOnly: boolean;        // サビ管業務専任か
  isOnCall: boolean;          // オンコールか
  isHoliday: boolean;         // 休日扱いか
  isPaidLeave: boolean;       // 有休扱いか
  isCompLeave: boolean;       // 代休扱いか
}

// 突発的な休日や代理勤務、手動変更を柔軟に行うため、勤務予定や勤務実績は「勤務記号」で保持します。
export interface MonthlyRosterData {
  yearMonth: string; // YYYY-MM
  staffId: string;
  // キーは日付 (1〜31の数字の文字列、"1", "2" など)、値は勤務記号
  schedule: Record<string, string>; 
  actual: Record<string, string>;
}

export interface OnCallEmergencyLog {
  active: 'あり' | 'なし' | '未記入';
  startTime: string; // e.g. "20:00"
  endTime: string;   // e.g. "21:30"
  content: string;   // 対応内容
}

export interface OnCallDayData {
  staffId: string;    // 空文字の場合は「未登録」（主担当）
  subStaffId?: string; // 副担当
  setupPattern?: '1人体制' | '2人体制'; // 待機体制
  dutyType?: 'oncall' | 'night_duty'; // 待機区分 (オンコール待機'oncall' または 宿直待機'night_duty')
  emergency: OnCallEmergencyLog;
  notes: string;
}

// キーは日付 ("1"〜"31")
export interface MonthlyOnCallData {
  yearMonth: string; // YYYY-MM
  days: Record<string, OnCallDayData>;
}

// 日別配置計算結果
export interface DailyStaffingSlot {
  timeSlot: string; // e.g. "09:30-10:00"
  assignedStaffNames: string[];
  count: number;
}

export interface DailyComplianceResult {
  day: number;
  dateStr: string;     // YYYY-MM-DD
  dayOfWeek: string;   // 月, 火, 水, 木, 金, 土, 日
  isHoliday: boolean;  // 土日祝判定
  
  // 日中
  dayUtilizerCount: number;
  dayRequiredStaff: number; // 利用者数 / 6 の切り上げ
  dayActualMinStaff: number; // 勤務時間帯の30分枠ごとの中での最小重なり人数
  dayCompliance: '充足' | '不足' | '要確認';
  dayDeficitSlots: string[]; // 不足している時間帯 e.g. ["09:30-10:00"]
  dayStaffListBySlot: Record<string, string[]>; // 各時間枠の職員名リスト

  // 宿泊
  nightUtilizerCount: number;
  nightRequiredStaff: number; // 宿泊は最低1名 (宿泊日別必要人数)
  nightActualMinStaff: number; // 15:30〜21:00 内で最小の重なり人数
  nightCompliance: '充足' | '不足' | '要確認';
  nightDeficitSlots: string[];
  nightStaffListBySlot: Record<string, string[]>; // 各時間枠の職員名リスト

  onCallStaffId: string;
  onCallStaffName: string;
  onCallEmergency: OnCallEmergencyLog;
  remarks: string;
}

// 月間常勤換算の職員ごとの計算結果
export interface StaffFteResult {
  staffId: string;
  name: string;
  isFullTime: boolean;
  role: StaffRole;
  includeInStaffing: boolean;
  weeklyContractedHours: number;
  monthlyContractedHours: number;
  
  // 勤務実績から集計
  totalActualWorkHours: number;    // 実勤務時間
  supportWorkHours: number;        // 生活支援員としての算入対象時間 (サビ管、管理専任、休日、有休などを除外)
  exclusiveManagerHours: number;   // 管理業務専任時間
  exclusiveSekiHours: number;      // サビ管業務専任時間
  
  fteValue: number;                // 算出FTE値 (上限1.0、超過勤務は除外)
  onCallCount: number;             // オンコール担当日数
}

export interface MonthlyFteResult {
  yearMonth: string;
  staffResults: StaffFteResult[];
  
  // 日中全体
  dayUtilizerCount: number;
  dayRequiredFte: number;  // 必要常勤換算 (日中配置計算用利用者数 / 6)
  dayActualFteTotal: number; // 職員の生活支援員FTEの合計
  dayFteCompliance: '充足' | '不足';

  // 宿泊全体
  nightUtilizerCount: number;
  nightRequiredFte: number; // 必要常勤換算 (宿泊配置計算用利用者数 / 10)
  nightActualFteTotal: number; // 宿泊は生活支援員のFTEのうち、どの程度を充てているか。
  // 注：制度上、生活支援員全体の常勤換算合計(合計FTE)が必要常勤換算合計(日中必要量 + 宿泊必要量)を上回っているかが監査上重要。
  totalRequiredFte: number; // 日中必要 + 宿泊必要
  totalActualFte: number;   // 生活支援員FTEの総和
}

export interface ShiftRequest {
  id: string;                  // 申請ID
  staffId: string;             // 職員ID
  targetMonth: string;         // YYYY-MM
  requestDate: string;         // 申請日 YYYY-MM-DD
  requestType: string;         // 申請区分 (希望休, 有休希望, 代休希望, 勤務不可, etc.)
  conditionType: 'absolute' | 'preference'; // 条件区分
  targetDate: string;          // 対象日 YYYY-MM-DD
  preferredShiftCode?: string; // 希望勤務記号 (e.g. "休", "遅", "日")
  reason?: string;             // 理由・メモ
  priority?: 'high' | 'medium' | 'low'; // 優先度
  status: 'pending' | 'approved' | 'rejected' | 'needs_discussion'; // 承認状況
  managerComment?: string;     // 管理者コメント
  reviewedBy?: string;         // 確認者
  reviewedAt?: string;         // 確認日
}
