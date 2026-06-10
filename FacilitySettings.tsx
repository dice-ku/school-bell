// src/utils/staffingCalc.ts
import { 
  FacilitySettings, 
  Staff, 
  ShiftCategory, 
  MonthlyRosterData, 
  MonthlyOnCallData, 
  DailyComplianceResult, 
  OnCallEmergencyLog
} from '../types';
import { getDaysInMonth, getDayOfWeekJapanese, isWeekend, getDateString } from './dateUtils';

/**
 * タイムリープを含む時刻文字列を「0時からの経過分数」に変換する
 */
export function timeToMin(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

/**
 * 指定の勤務時間帯が、対象とする30分枠を完全にカバーしているか判定する
 */
export function isSlotCovered(shiftStart: string, shiftEnd: string, slotStart: string, slotEnd: string): boolean {
  const startMin = timeToMin(shiftStart);
  let endMin = timeToMin(shiftEnd);
  const sMin = timeToMin(slotStart);
  let eMin = timeToMin(slotEnd);
  
  // 翌日にまたがる場合
  if (endMin < startMin) {
    endMin += 24 * 60;
  }
  
  // スロットが翌日にまたがる場合（通常は15:30〜21:00や09:30〜15:30なので跨がないが念のため）
  if (eMin < sMin) {
    eMin += 24 * 60;
  }
  
  // もしスロットの確認において、勤務時間がスロットを完全に覆っている（あるいはスロット内に収まる）か
  // ここでは完全にカバーしている（勤務の開始がスロットの開始以下、かつ勤務の終了がスロットの終了以上）かを判定します
  return startMin <= sMin && endMin >= eMin;
}

/**
 * 開始時刻と終了時刻から、30分単位の枠（スロット）のリストを生成する
 */
export function generateTimeSlots(start: string, end: string): { start: string; end: string; display: string }[] {
  const slots: { start: string; end: string; display: string }[] = [];
  const startMin = timeToMin(start);
  let endMin = timeToMin(end);
  if (endMin < startMin) {
    endMin += 24 * 60; // 翌日にまたがる場合
  }

  for (let min = startMin; min < endMin; min += 30) {
    const sH = Math.floor((min % (24 * 60)) / 60);
    const sM = min % 60;
    const nextMin = min + 30;
    const eH = Math.floor((nextMin % (24 * 60)) / 60);
    const eM = nextMin % 60;

    const sStr = `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`;
    const eStr = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;
    slots.push({
      start: sStr,
      end: eStr,
      display: `${sStr}-${eStr}`
    });
  }
  return slots;
}

/**
 * ある職員が当日に生活支援員として実配置に算入可能かを判定する
 */
export function isEligibleSupportStaff(staff: Staff, shift: ShiftCategory): boolean {
  if (!staff.isActive) return false;
  
  // サビ管（専任・兼務）は生活支援員配置に算入しない
  if (staff.isSeki || staff.role === 'サービス管理責任者' || staff.role === '管理者兼サービス管理責任者') {
    return false;
  }
  
  // 管理者兼生活支援員、または生活支援員として算入可能か
  if (!staff.includeInStaffing) {
    return false;
  }

  // 勤務記号が生活支援員勤務として算入可能か
  if (!shift.isSupportStaffWork) {
    return false;
  }

  return true;
}

/**
 * 1日分の配置確認、判定を行う
 */
export function calculateDailyCompliance(
  day: number,
  settings: FacilitySettings,
  staffList: Staff[],
  shifts: ShiftCategory[],
  rosters: Record<string, MonthlyRosterData>, // staffId -> MonthlyRosterData
  onCallData: MonthlyOnCallData,
  isActual: boolean // trueなら実績、falseなら予定で計算
): DailyComplianceResult {
  const dateStr = getDateString(settings.targetYearMonth, day);
  const dayOfWeek = getDayOfWeekJapanese(settings.targetYearMonth, day);
  const isSaturOrSun = isWeekend(settings.targetYearMonth, day);
  
  const daySlots = generateTimeSlots(settings.daySupportStart, settings.daySupportEnd);
  const nightSlots = generateTimeSlots(settings.nightSupportStart, settings.nightSupportEnd);
  
  // 日中定員と配置計算用利用者数をもとに必要人数を算出
  const dayRequiredStaff = Math.ceil(settings.dayUtilizerCount / settings.dayStaffingRatio);
  // 宿泊の配置基準は、最低でも夜間は1名以上（宿泊日別必要人数は1名）
  const nightRequiredStaff = 1;

  const dayStaffListBySlot: Record<string, string[]> = {};
  const nightStaffListBySlot: Record<string, string[]> = {};
  
  // スロット初期化
  daySlots.forEach(slot => { dayStaffListBySlot[slot.display] = []; });
  nightSlots.forEach(slot => { nightStaffListBySlot[slot.display] = []; });

  // 職員ごとにその日の勤務区分を確認してスロットに充当
  staffList.forEach(staff => {
    const staffRoster = rosters[staff.id];
    if (!staffRoster) return;
    
    const shiftSymbol = isActual ? staffRoster.actual[String(day)] : staffRoster.schedule[String(day)];
    if (!shiftSymbol) return;

    const shift = shifts.find(s => s.symbol === shiftSymbol);
    if (!shift) return;

    // 生活支援員として算入可能か確認
    if (isEligibleSupportStaff(staff, shift)) {
      // 日中スロット判定 (シフトが日中スロットをカバーし、かつシフトが日中支援に算入可能な場合)
      if (shift.isDaySupport) {
        daySlots.forEach(slot => {
          if (isSlotCovered(shift.startTime, shift.endTime, slot.start, slot.end)) {
            dayStaffListBySlot[slot.display].push(staff.name);
          }
        });
      }

      // 宿泊スロット判定 (シフトが宿泊スロットをカバーし、かつシフトが宿泊支援に算入可能な場合)
      if (shift.isNightSupport) {
        nightSlots.forEach(slot => {
          if (isSlotCovered(shift.startTime, shift.endTime, slot.start, slot.end)) {
            nightStaffListBySlot[slot.display].push(staff.name);
          }
        });
      }
    }
  });

  // 日中の実配置不足判定
  let dayActualMinStaff = 999;
  const dayDeficitSlots: string[] = [];
  daySlots.forEach(slot => {
    const count = dayStaffListBySlot[slot.display].length;
    if (count < dayActualMinStaff) {
      dayActualMinStaff = count;
    }
    if (count < dayRequiredStaff) {
      dayDeficitSlots.push(slot.display);
    }
  });
  if (daySlots.length === 0) dayActualMinStaff = 0;

  const dayCompliance = dayDeficitSlots.length === 0 ? '充足' : '不足';

  // 宿泊の実配置不足判定
  let nightActualMinStaff = 999;
  const nightDeficitSlots: string[] = [];
  nightSlots.forEach(slot => {
    const count = nightStaffListBySlot[slot.display].length;
    if (count < nightActualMinStaff) {
      nightActualMinStaff = count;
    }
    if (count < nightRequiredStaff) {
      nightDeficitSlots.push(slot.display);
    }
  });
  if (nightSlots.length === 0) nightActualMinStaff = 0;

  const nightCompliance = nightDeficitSlots.length === 0 ? '充足' : '不足';

  // オンコール情報の取得
  const dayOnCall = onCallData?.days?.[String(day)] || {
    staffId: '',
    emergency: { active: 'なし', startTime: '', endTime: '', content: '' },
    notes: ''
  };
  
  const onCallStaff = staffList.find(s => s.id === dayOnCall.staffId);
  const onCallStaffName = onCallStaff ? onCallStaff.name : (dayOnCall.staffId ? '未登録' : '');

  return {
    day,
    dateStr,
    dayOfWeek,
    isHoliday: isSaturOrSun,
    dayUtilizerCount: settings.dayUtilizerCount,
    dayRequiredStaff,
    dayActualMinStaff: dayActualMinStaff === 999 ? 0 : dayActualMinStaff,
    dayCompliance,
    dayDeficitSlots,
    dayStaffListBySlot,
    nightUtilizerCount: settings.nightUtilizerCount,
    nightRequiredStaff,
    nightActualMinStaff: nightActualMinStaff === 999 ? 0 : nightActualMinStaff,
    nightCompliance,
    nightDeficitSlots,
    nightStaffListBySlot,
    onCallStaffId: dayOnCall.staffId,
    onCallStaffName,
    onCallEmergency: dayOnCall.emergency,
    remarks: dayOnCall.notes || ''
  };
}

/**
 * 1ヶ月全体の配置確認、判定を行う
 */
export function calculateMonthlyCompliance(
  settings: FacilitySettings,
  staffList: Staff[],
  shifts: ShiftCategory[],
  rosters: Record<string, MonthlyRosterData>,
  onCallData: MonthlyOnCallData,
  isActual: boolean
): DailyComplianceResult[] {
  const daysInMonth = getDaysInMonth(settings.targetYearMonth);
  const results: DailyComplianceResult[] = [];
  
  for (let d = 1; d <= daysInMonth; d++) {
    results.push(calculateDailyCompliance(d, settings, staffList, shifts, rosters, onCallData, isActual));
  }
  
  return results;
}
