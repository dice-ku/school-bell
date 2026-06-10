// src/utils/fteCalc.ts
import { 
  FacilitySettings, 
  Staff, 
  ShiftCategory, 
  MonthlyRosterData, 
  MonthlyOnCallData, 
  MonthlyFteResult, 
  StaffFteResult 
} from '../types';
import { getDaysInMonth } from './dateUtils';

/**
 * 月間常勤換算の計算を行う
 */
export function calculateMonthlyFte(
  settings: FacilitySettings,
  staffList: Staff[],
  shifts: ShiftCategory[],
  rosters: Record<string, MonthlyRosterData>,
  onCallData: MonthlyOnCallData
): MonthlyFteResult {
  const yearMonth = settings.targetYearMonth;
  const daysInMonth = getDaysInMonth(yearMonth);
  // 週36.5時間を常勤換算1.0の基準とする。
  // 月間の基準時間 = 週基準時間 * (当月日数 / 7)
  const monthlyStandardHours = settings.weeklyFteHours * (daysInMonth / 7);

  const staffResults: StaffFteResult[] = staffList.map(staff => {
    const staffRoster = rosters[staff.id];
    let totalActualWorkHours = 0;
    let supportWorkHours = 0;
    let exclusiveManagerHours = 0;
    let exclusiveSekiHours = 0;
    let paidLeaveHours = 0;
    let compLeaveHours = 0;
    let onCallCount = 0;

    // オンコールのカウント
    if (onCallData && onCallData.days) {
      Object.keys(onCallData.days).forEach(dayKey => {
        if (onCallData.days[dayKey].staffId === staff.id) {
          onCallCount++;
        }
      });
    }

    if (staffRoster) {
      for (let day = 1; day <= daysInMonth; day++) {
        const symbol = staffRoster.actual[String(day)];
        if (!symbol) continue;

        const shift = shifts.find(s => s.symbol === symbol);
        if (!shift) continue;

        // 基準時間の集計
        if (!shift.isHoliday && !shift.isPaidLeave && !shift.isCompLeave) {
          totalActualWorkHours += shift.workHours;
        }

        // 有休・代休の時間加算 (常勤換算上は所定働いたものとみなす)
        if (shift.isPaidLeave) {
          paidLeaveHours += shift.workHours || 7.5; // デフォルト 7.5時間など
        }
        if (shift.isCompLeave) {
          compLeaveHours += shift.workHours || 7.5;
        }

        // 役割に応じた算入対象時間
        if (staff.includeInStaffing && shift.isSupportStaffWork) {
          supportWorkHours += shift.workHours;
        }

        if (shift.isManagerOnly) {
          exclusiveManagerHours += shift.workHours;
        }

        if (shift.isSekiOnly) {
          exclusiveSekiHours += shift.workHours;
        }
      }
    }

    // 常勤換算上の算入時間 = 生活支援員としての実務時間 + 有休時間 + 代休時間
    // (サビ管業務や専任管理業務は除外されている)
    const creditedHours = supportWorkHours + paidLeaveHours + compLeaveHours;
    
    // FTEの算出。上限は1.0。生活支援員に算入不可のスタッフ（専任サビ管など）は 0.0 とする。
    let fteValue = 0;
    if (staff.includeInStaffing && staff.role !== 'サービス管理責任者' && staff.role !== '管理者兼サービス管理責任者') {
      fteValue = Math.min(1.0, creditedHours / monthlyStandardHours);
    }

    return {
      staffId: staff.id,
      name: staff.name,
      isFullTime: staff.isFullTime,
      role: staff.role,
      includeInStaffing: staff.includeInStaffing,
      weeklyContractedHours: staff.weeklyContractedHours,
      monthlyContractedHours: staff.monthlyContractedHours,
      totalActualWorkHours,
      supportWorkHours: creditedHours, // 有休等を含む
      exclusiveManagerHours,
      exclusiveSekiHours,
      fteValue: parseFloat(fteValue.toFixed(3)),
      onCallCount
    };
  });

  // 日中の必要常勤換算 = 日中配置計算用利用者数 / 6
  const dayRequiredFte = parseFloat((settings.dayUtilizerCount / settings.dayStaffingRatio).toFixed(3));
  
  // 宿泊の必要常勤換算 = 宿泊配置計算用利用者数 / 10
  const nightRequiredFte = parseFloat((settings.nightUtilizerCount / settings.nightStaffingRatio).toFixed(3));

  // 支援員のFTE合計
  const dayActualFteTotal = parseFloat(
    staffResults
      .filter(r => r.includeInStaffing && r.role !== 'サービス管理責任者' && r.role !== '管理者兼サービス管理責任者')
      .reduce((sum, r) => sum + r.fteValue, 0)
      .toFixed(3)
  );

  // 宿泊に直接アタッチされた支援員FTE比率の算定 (遅番などisNightSupport=trueのシフト比率)
  let totalNightHoursSum = 0;
  staffList.forEach(s => {
    const r = rosters[s.id];
    if (r && s.includeInStaffing && s.role !== 'サービス管理責任者' && s.role !== '管理者兼サービス管理責任者') {
      for (let day = 1; day <= daysInMonth; day++) {
        const sym = r.actual[String(day)];
        const sh = shifts.find(item => item.symbol === sym);
        if (sh && sh.isNightSupport && sh.isSupportStaffWork) {
          totalNightHoursSum += sh.workHours;
        }
      }
    }
  });

  const nightActualFteTotal = parseFloat(Math.min(dayActualFteTotal, totalNightHoursSum / monthlyStandardHours).toFixed(3));

  const totalRequiredFte = parseFloat((dayRequiredFte + nightRequiredFte).toFixed(3));
  const totalActualFte = dayActualFteTotal;

  const dayFteCompliance = totalActualFte >= totalRequiredFte ? '充足' : '不足';

  return {
    yearMonth,
    staffResults,
    dayUtilizerCount: settings.dayUtilizerCount,
    dayRequiredFte,
    dayActualFteTotal,
    dayFteCompliance,
    nightUtilizerCount: settings.nightUtilizerCount,
    nightRequiredFte,
    nightActualFteTotal, // 充当FTE
    totalRequiredFte,
    totalActualFte,
  };
}
