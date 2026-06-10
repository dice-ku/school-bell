// src/utils/excelExport.ts
import * as XLSX from 'xlsx';
import { 
  FacilitySettings, 
  Staff, 
  ShiftCategory, 
  DailyComplianceResult, 
  MonthlyFteResult, 
  MonthlyRosterData, 
  MonthlyOnCallData,
  ShiftRequest
} from '../types';
import { getDaysInMonth, getDayOfWeekJapanese } from './dateUtils';

const timeToMin = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return (isNaN(h) || isNaN(m)) ? 0 : h * 60 + m;
};

/**
 * 共通ヘッダー作成用のヘルパー
 */
function createTitleRows(title: string, settings: FacilitySettings, colSpan: number): string[][] {
  return [
    [title],
    [`施設名: ${settings.facilityName || '宿泊型自立訓練施設'}`, '', `対象年月: ${settings.targetYearMonth}`, '', `出力日: ${new Date().toLocaleDateString('ja-JP')}`],
    [] // 空白行
  ];
}

/**
 * 1. 勤務予定・実績表のExcel出力
 */
export function exportMonthlyRoster(
  settings: FacilitySettings,
  staffList: Staff[],
  shifts: ShiftCategory[],
  rosters: Record<string, MonthlyRosterData>,
  isActual: boolean
) {
  const title = isActual ? '月間勤務実績表 (監査確認用)' : '月間勤務予定表 (配置計画用)';
  const fileName = isActual 
    ? `勤務実績表_${settings.targetYearMonth}.xlsx` 
    : `勤務予定表_${settings.targetYearMonth}.xlsx`;

  const daysInMonth = getDaysInMonth(settings.targetYearMonth);
  const wb = XLSX.utils.book_new();

  // ヘッダー行1: 日付
  const dateHeader = ['職員ID', '氏名', '区分', '役割'];
  for (let d = 1; d <= daysInMonth; d++) {
    dateHeader.push(`${d}日`);
  }
  
  // ヘッダー行2: 曜日
  const dayHeader = ['', '', '', ''];
  for (let d = 1; d <= daysInMonth; d++) {
    dayHeader.push(getDayOfWeekJapanese(settings.targetYearMonth, d));
  }

  const rows: any[] = [];
  
  // タイトル行を挿入
  rows.push([title]);
  rows.push([`施設名: ${settings.facilityName}`, '', `対象年月: ${settings.targetYearMonth}`]);
  rows.push([]);
  rows.push(dateHeader);
  rows.push(dayHeader);

  // 職員データ
  staffList.forEach(staff => {
    const r = rosters[staff.id];
    const staffRow = [
      staff.id,
      staff.name,
      staff.isFullTime ? '常勤' : '非常勤',
      staff.role
    ];

    for (let d = 1; d <= daysInMonth; d++) {
      const shiftSymbol = r 
        ? (isActual ? r.actual[String(d)] : r.schedule[String(d)]) 
        : '';
      staffRow.push(shiftSymbol || '-');
    }
    rows.push(staffRow);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 簡易セル結合 (タイトル行を横いっぱいに結合)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: daysInMonth + 3 } }
  ];

  XLSX.utils.book_append_sheet(wb, ws, isActual ? '勤務実績' : '勤務予定');
  XLSX.writeFile(wb, fileName);
}

/**
 * 2. 日別配置確認表のExcel出力 (監査確認用)
 */
export function exportDailyCompliance(
  settings: FacilitySettings,
  complianceResults: DailyComplianceResult[]
) {
  const title = '日別配置確認・適格判定表 (監査確認用)';
  const fileName = `日別配置確認表_${settings.targetYearMonth}.xlsx`;
  const wb = XLSX.utils.book_new();

  const headers = [
    '日付', '曜日', 
    '日中利用者数', '日中必要枠人数(基準)', '日中実配置(最小)', '日中判定', '日中不足時間帯',
    '宿泊利用者数', '宿泊常勤必要量(FTE)', '宿泊日別必要数', '宿泊実配置(最小)', '宿泊判定', '宿泊不足時間帯',
    'オンコール担当者', '備考'
  ];

  const rows: any[] = [];
  rows.push([title]);
  rows.push([
    `施設名: ${settings.facilityName}`, 
    '', 
    `対象年月: ${settings.targetYearMonth}`, 
    '', 
    `基準: 日中[${settings.dayStaffingRatio}:1] / 宿泊[${settings.nightStaffingRatio}:1]`
  ]);
  rows.push([]);
  rows.push(headers);

  complianceResults.forEach(res => {
    rows.push([
      `${res.day}日`,
      res.dayOfWeek,
      res.dayUtilizerCount,
      res.dayRequiredStaff,
      res.dayActualMinStaff,
      res.dayCompliance,
      res.dayDeficitSlots.join(', ') || 'なし',
      res.nightUtilizerCount,
      `${res.nightUtilizerCount / settings.nightStaffingRatio}人`,
      res.nightRequiredStaff,
      res.nightActualMinStaff,
      res.nightCompliance,
      res.nightDeficitSlots.join(', ') || 'なし',
      res.onCallStaffName || '未登録',
      res.remarks
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } }
  ];

  // 列の幅自動調整
  const colWidths = headers.map(() => ({ wch: 15 }));
  colWidths[4] = { wch: 18 }; // 日中実配置
  colWidths[6] = { wch: 25 }; // 日中不足時間帯
  colWidths[12] = { wch: 25 }; // 宿泊不足時間帯
  colWidths[14] = { wch: 20 }; // 備考
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, '日別配置判定');
  XLSX.writeFile(wb, fileName);
}

/**
 * 3. 月間常勤換算確認表のExcel出力 (監査確認用)
 */
export function exportMonthlyFte(
  settings: FacilitySettings,
  fteResult: MonthlyFteResult
) {
  const title = '月間常勤換算確認表 (監査確認用)';
  const fileName = `月間常勤換算表_${settings.targetYearMonth}.xlsx`;
  const wb = XLSX.utils.book_new();

  const rows: any[] = [];
  rows.push([title]);
  rows.push([
    `施設名: ${settings.facilityName}`, 
    '', 
    `対象年月: ${settings.targetYearMonth}`, 
    '', 
    `常勤換算基準時間: 週 ${settings.weeklyFteHours}時間`
  ]);
  rows.push([]);

  // 要約セクション
  rows.push(['【配置確認サマリー】']);
  rows.push(['項目', '必要常勤換算(A)', '実働常勤換算合計(B)', '判定 (B >= A)']);
  rows.push([
    '生活支援員全体 (日中＋宿泊)', 
    `${fteResult.totalRequiredFte} 人`, 
    `${fteResult.totalActualFte} 人`, 
    fteResult.dayFteCompliance
  ]);
  rows.push([
    '(内訳) 日中支援分', 
    `${fteResult.dayRequiredFte} 人`, 
    '-', 
    '-'
  ]);
  rows.push([
    '(内訳) 宿泊支援分', 
    `${fteResult.nightRequiredFte} 人`, 
    '-', 
    '-'
  ]);
  rows.push([]);

  // 詳細テーブル
  const headers = [
    '職員ID', '氏名', '常用区分', '役割', '生活支援員算入', 
    '契約週時間', '月所定時間', '月実労働時間', '生活支援員対象時間(有休等含む)', 
    '内 管理業務専任時間', '内 サビ管専任時間', '常勤換算FTE値', 'オンコール担当数'
  ];
  rows.push(['【職員別詳細】']);
  rows.push(headers);

  fteResult.staffResults.forEach(res => {
    rows.push([
      res.staffId,
      res.name,
      res.isFullTime ? '常勤' : '非常勤',
      res.role,
      res.includeInStaffing ? '対象' : '非対象',
      res.weeklyContractedHours,
      res.monthlyContractedHours,
      res.totalActualWorkHours,
      res.supportWorkHours,
      res.exclusiveManagerHours,
      res.exclusiveSekiHours,
      res.fteValue,
      res.onCallCount
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }
  ];

  XLSX.utils.book_append_sheet(wb, ws, '常勤換算確認');
  XLSX.writeFile(wb, fileName);
}

/**
 * 4. 総務課提出用オンコール勤務確認表 (総務課提出用)
 */
export function exportOnCallReport(
  settings: FacilitySettings,
  staffList: Staff[],
  onCallData: MonthlyOnCallData
) {
  const title = 'オンコール及び夜間緊急対応実績報告書 (月間)';
  const fileName = `オンコール夜間実績報告_${settings.targetYearMonth}.xlsx`;
  const wb = XLSX.utils.book_new();

  const headers = [
    '日付', '曜日', '待機区分', '体制クラス', '待機・対応職員', '連絡先確認事項', 
    '緊急対応有無', '対応時間帯', '対応時間(h)', '対応内容 / 摘要ログ', '備考/引継ぎ',
    '担当当事者印', '施設長確認印', '作成報告印'
  ];

  const rows: any[] = [];
  rows.push([title]);
  rows.push([
    `施設名: ${settings.facilityName}`, 
    '', 
    `対象年月: ${settings.targetYearMonth}`, 
    '', 
    '提出先: 総務管理課 御中', 
    '', 
    `作成日: ${new Date().toLocaleDateString('ja-JP')}`
  ]);
  rows.push([]);
  rows.push(headers);

  const daysInMonth = getDaysInMonth(settings.targetYearMonth);

  for (let d = 1; d <= daysInMonth; d++) {
    const dayData = onCallData?.days?.[String(d)];
    const staff = dayData ? staffList.find(s => s.id === dayData.staffId) : null;
    const subStaff = (dayData && dayData.subStaffId) ? staffList.find(s => s.id === dayData.subStaffId) : null;
    
    let staffName = staff ? staff.name : (dayData?.staffId ? '外部委託等' : '未登録');
    if (dayData?.setupPattern === '2人体制' && subStaff) {
      staffName += ` (副: ${subStaff.name})`;
    }

    const contactInfo = staff ? (staff.isFullTime ? '事務所PHS携帯' : '個人事前届出緊急連絡') : '-';
    const dutyType = dayData?.dutyType === 'night_duty' ? '宿直' : 'オンコール';
    const classType = dayData?.setupPattern === '2人体制' ? '2人体制 (主・副)' : '1人体制 (主のみ)';

    const emergency = dayData?.emergency || { active: 'なし', startTime: '', endTime: '', content: '' };
    
    // 時間計算
    let calcDurationStr = '';
    if (emergency.active === 'あり' && emergency.startTime && emergency.endTime) {
      const sMin = timeToMin(emergency.startTime);
      let eMin = timeToMin(emergency.endTime);
      if (eMin < sMin) eMin += 24 * 60; // 翌日に跨る
      const durationHours = ((eMin - sMin) / 60).toFixed(1);
      calcDurationStr = `${durationHours}時間 (${emergency.startTime}〜${emergency.endTime})`;
    }

    rows.push([
      `${d}日`,
      getDayOfWeekJapanese(settings.targetYearMonth, d),
      dutyType,
      classType,
      staffName,
      contactInfo,
      emergency.active || 'なし',
      emergency.active === 'あり' ? `${emergency.startTime}〜${emergency.endTime}` : '-',
      calcDurationStr || '-',
      emergency.active === 'あり' ? emergency.content : '-',
      dayData?.notes || '',
      '', // 担当者印
      '', // 総務確認欄
      ''  // 決裁者承認
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // レイアウト装飾用に列幅を設定
  const colWidths = [
    { wch: 8 },  // 日付
    { wch: 6 },  // 曜日
    { wch: 10 }, // 待機区分
    { wch: 18 }, // 体制クラス
    { wch: 22 }, // 待機・対応職員
    { wch: 18 }, // 連絡先
    { wch: 14 }, // 対応有無
    { wch: 16 }, // 対応時間帯
    { wch: 22 }, // 対応時間算出
    { wch: 35 }, // 対応内容 / 摘要ログ
    { wch: 15 }, // 備考
    { wch: 12 }, // 担当印
    { wch: 12 }, // 確認欄
    { wch: 12 }  // 承認欄
  ];
  ws['!cols'] = colWidths;
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }
  ];

  XLSX.utils.book_append_sheet(wb, ws, '実績報告書');
  XLSX.writeFile(wb, fileName);
}

/**
 * 5. 全てを1ファイルにパッキング（監査確認一括出力）
 */
export function exportBundleAuditingWorkbook(
  settings: FacilitySettings,
  staffList: Staff[],
  shifts: ShiftCategory[],
  rosters: Record<string, MonthlyRosterData>,
  onCallData: MonthlyOnCallData,
  complianceResults: DailyComplianceResult[],
  fteResult: MonthlyFteResult
) {
  const fileName = `宿泊型自立訓練_監査確認一括請求書類_${settings.targetYearMonth}.xlsx`;
  const wb = XLSX.utils.book_new();

  // 1. 常勤換算シート
  const fteRows: any[] = [];
  fteRows.push(['常勤換算確認表 (法廷監査用)']);
  fteRows.push([`対象年月: ${settings.targetYearMonth}`, '', `施設名: ${settings.facilityName}`]);
  fteRows.push([]);
  fteRows.push(['■ 常勤基準時間:', `週 ${settings.weeklyFteHours}時間`]);
  fteRows.push(['■ 必要常勤換算合計:', `${fteResult.totalRequiredFte} 人`]);
  fteRows.push(['■ 実常勤換算配置合計:', `${fteResult.totalActualFte} 人`]);
  fteRows.push(['■ 基準充足判定:', fteResult.dayFteCompliance]);
  fteRows.push([]);

  const fteHeaders = [
    '職員ID', '氏名', '常用区分', '役割', '生活支援員算入', 
    '月実労働時間', '算入時間(有休合算)', '常勤換算FTE'
  ];
  fteRows.push(fteHeaders);
  fteResult.staffResults.forEach(res => {
    fteRows.push([
      res.staffId,
      res.name,
      res.isFullTime ? '常勤' : '非常勤',
      res.role,
      res.includeInStaffing ? '算入' : '除外',
      res.totalActualWorkHours,
      res.supportWorkHours,
      res.fteValue
    ]);
  });
  const fteWs = XLSX.utils.aoa_to_sheet(fteRows);
  XLSX.utils.book_append_sheet(wb, fteWs, '常勤換算確認');

  // 2. 日別実配置監査シート
  const complianceRows: any[] = [];
  complianceRows.push(['日別実配置基準確認表']);
  complianceRows.push([`対象年月: ${settings.targetYearMonth}`, '', `施設名: ${settings.facilityName}`]);
  complianceRows.push([]);
  const complianceHeaders = [
    '日付', '曜日', '日中利用者', '日中必要(1/6)', '日中実配置(最小)', '日中判定', '日中不足箇所',
    '宿泊利用者', '宿泊必要(最低1)', '宿泊実配置(最小)', '宿泊判定', '宿泊不足箇所'
  ];
  complianceRows.push(complianceHeaders);
  complianceResults.forEach(res => {
    complianceRows.push([
      `${res.day}日`,
      res.dayOfWeek,
      res.dayUtilizerCount,
      res.dayRequiredStaff,
      res.dayActualMinStaff,
      res.dayCompliance,
      res.dayDeficitSlots.join(', ') || 'なし',
      res.nightUtilizerCount,
      res.nightRequiredStaff,
      res.nightActualMinStaff,
      res.nightCompliance,
      res.nightDeficitSlots.join(', ') || 'なし'
    ]);
  });
  const compWs = XLSX.utils.aoa_to_sheet(complianceRows);
  XLSX.utils.book_append_sheet(wb, compWs, '日別実配置確認');

  XLSX.writeFile(wb, fileName);
}

/**
 * 4. 希望申請に関する帳票類一括Excel出力 (5つのタブを網羅解説)
 */
export function exportShiftRequests(
  settings: FacilitySettings,
  staffList: Staff[],
  requests: ShiftRequest[],
  rosters: Record<string, MonthlyRosterData>,
  onCallData: MonthlyOnCallData
) {
  const targetYearMonth = settings.targetYearMonth;
  const fileName = `シフト希望申請及び衝突調査書_${targetYearMonth}.xlsx`;
  const wb = XLSX.utils.book_new();

  // ヘルパー：日本語曜日の取得
  const getDayAndW = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const dNum = Number(parts[parts.length - 1]);
      const wName = getDayOfWeekJapanese(targetYearMonth, dNum);
      return { day: `${dNum}日`, weekday: wName };
    } catch {
      return { day: dateStr, weekday: '-' };
    }
  };

  // 1. スタッフ希望申請一覧 シート
  const sheet1Data: any[] = [
    ['【そよかぜ自立支援ホーム】 スタッフ希望申請一覧 (一括データ)'],
    [`対象年月: ${targetYearMonth}`, `施設名: ${settings.facilityName}`, `出力日時: ${new Date().toLocaleString()}`],
    [],
    ['ID', '職員名', '希望対象日', '曜日', '申請区分', '条件区分', '優先度', '承認状況', '理由・メモ', '管理者コメント', '申請日']
  ];

  requests.forEach(req => {
    const staff = staffList.find(s => s.id === req.staffId);
    const { day, weekday } = getDayAndW(req.targetDate);
    sheet1Data.push([
      req.id,
      staff?.name || '不明',
      req.targetDate,
      weekday,
      req.requestType,
      req.conditionType === 'absolute' ? '絶対条件' : '努力条件',
      req.priority === 'high' ? '高' : req.priority === 'medium' ? '中' : '低',
      req.status === 'approved' ? '承認' : req.status === 'rejected' ? '却下' : req.status === 'needs_discussion' ? '要相談' : '未確認',
      req.reason || '',
      req.managerComment || '',
      req.requestDate || ''
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  XLSX.utils.book_append_sheet(wb, ws1, 'スタッフ希望申請一覧');

  // 2. 職員別希望申請表 シート
  const sheet2Data: any[] = [
    ['【そよかぜ自立支援ホーム】 職員別希望申請集計表'],
    [`対象年月: ${targetYearMonth}`, `施設名: ${settings.facilityName}`],
    [],
    ['職員ID', '職員名', '職務タイプ', '申請総数', 'うち絶対条件', 'うち努力条件', '承認数', '要相談・保留数', '却下数']
  ];

  staffList.forEach(st => {
    const stReqs = requests.filter(r => r.staffId === st.id);
    if (stReqs.length === 0) return; // 申請がない職員はスキップしてスッキリ

    const absoluteCount = stReqs.filter(r => r.conditionType === 'absolute').length;
    const preferenceCount = stReqs.filter(r => r.conditionType === 'preference').length;
    const approvedCount = stReqs.filter(r => r.status === 'approved').length;
    const deniedCount = stReqs.filter(r => r.status === 'rejected').length;
    const pendingCount = stReqs.filter(r => r.status === 'pending' || r.status === 'needs_discussion').length;

    sheet2Data.push([
      st.id,
      st.name,
      st.role,
      stReqs.length,
      absoluteCount,
      preferenceCount,
      approvedCount,
      pendingCount,
      deniedCount
    ]);

    // 内訳をネスト行として追加
    sheet2Data.push(['', 'ㄴ 対象日', '申請タイプ', '条件区分', '理由内容', '承認状況', '管理者コメント']);
    stReqs.forEach(r => {
      const { weekday } = getDayAndW(r.targetDate);
      sheet2Data.push([
        '',
        `${r.targetDate} (${weekday})`,
        r.requestType,
        r.conditionType === 'absolute' ? '絶対' : '努力',
        r.reason || '',
        r.status === 'approved' ? '承認' : r.status === 'rejected' ? '却下' : '要確認',
        r.managerComment || ''
      ]);
    });
    sheet2Data.push([]); // 空行
  });

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  XLSX.utils.book_append_sheet(wb, ws2, '職員別希望申請表');

  // 3. 日付別希望申請表 シート
  const sheet3Data: any[] = [
    ['【そよかぜ自立支援ホーム】 日付別希望申請連絡票'],
    [`対象年月: ${targetYearMonth}`, `施設名: ${settings.facilityName}`],
    [],
    ['希望日', '曜日', '職員名', '申請区分', '条件タイプ', '理由・希望内容', '承認状況', '管理者コメント']
  ];

  // 日付順にソート
  const sortedReqs = [...requests].sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  sortedReqs.forEach(req => {
    const staff = staffList.find(s => s.id === req.staffId);
    const { weekday } = getDayAndW(req.targetDate);
    sheet3Data.push([
      req.targetDate,
      weekday,
      staff?.name || '不明',
      req.requestType,
      req.conditionType === 'absolute' ? '絶対' : '努力',
      req.reason || '',
      req.status === 'approved' ? '承認' : req.status === 'rejected' ? '却下' : '要確認',
      req.managerComment || ''
    ]);
  });

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  XLSX.utils.book_append_sheet(wb, ws3, '日付別希望申請表');

  // 4. 希望申請・勤務予定衝突一覧 シート
  const sheet4Data: any[] = [
    ['【そよかぜ自立支援ホーム】 勤務希望申請と実際の勤務予定・待機配置との衝突(コンフリクト)監査表'],
    [`対象年月: ${targetYearMonth}`, `分析日: ${new Date().toLocaleDateString('ja-JP')}`],
    [],
    ['日付', '曜日', '職員名', '希望申請区分', '希望条件', '承認状況', '現在の勤務計画', 'コンフリクト判定・警告内容']
  ];

  requests.forEach(req => {
    const staff = staffList.find(s => s.id === req.staffId);
    if (!staff) return;

    const { day, weekday } = getDayAndW(req.targetDate);
    const dayStr = req.targetDate.split('-')[2]; // "10"
    const dNum = Number(dayStr);

    // ロスターから現在の勤務記号
    const rosterObj = rosters[req.staffId];
    const assignedCode = rosterObj?.schedule?.[String(dNum)] || '';

    // オンコール待機状況
    const onCallOnDay = onCallData?.days?.[String(dNum)];
    const isOnCallAssigned = onCallOnDay && (onCallOnDay.staffId === req.staffId || onCallOnDay.subStaffId === req.staffId);

    let conflictExplain = '';
    let hasConflict = false;

    if (req.status === 'rejected') {
      // 却下された希望は考慮しないため衝突なし
      return;
    }

    if (req.requestType === '希望休' || req.requestType === '有休希望' || req.requestType === '代休希望' || req.requestType === '勤務不可') {
      // 休み希望なのに勤務が入っている場合（'休'や'ホ'や'代'や'公'以外）
      const isOffSymbol = ['休', 'ホ', '代', '公', '有'].includes(assignedCode);
      if (assignedCode && !isOffSymbol) {
        hasConflict = true;
        conflictExplain = `【警告】休み希望日に "${assignedCode}" が割り当てされています（重複出勤）`;
      }
    } else if (req.requestType === '遅番不可') {
      if (assignedCode === '遅') {
        hasConflict = true;
        conflictExplain = `【警告】遅番不可日に 「遅番」 が割り当てられています`;
      }
    } else if (req.requestType === 'オンコール不可') {
      if (isOnCallAssigned) {
        hasConflict = true;
        conflictExplain = `【指示違反】オンコール不可日に オンコール/宿直待機アサイン が設定されています`;
      }
    } else if (req.requestType === '遅番希望') {
      if (assignedCode && assignedCode !== '遅' && assignedCode !== '休') {
        hasConflict = true;
        conflictExplain = `【未達】遅番希望日ですが、"${assignedCode}" が割り当てられています`;
      }
    } else if (req.requestType === '日勤希望') {
      if (assignedCode && assignedCode !== '日' && assignedCode !== '休') {
        hasConflict = true;
        conflictExplain = `【未達】日勤希望日ですが、"${assignedCode}" が割り当てられています`;
      }
    }

    if (hasConflict) {
      sheet4Data.push([
        req.targetDate,
        weekday,
        staff.name,
        req.requestType,
        req.conditionType === 'absolute' ? '絶対条件' : '努力条件',
        req.status === 'approved' ? '承認' : '未確認',
        assignedCode || '(未定)',
        conflictExplain
      ]);
    }
  });

  if (sheet4Data.length === 4) {
    sheet4Data.push(['', '', 'コンフリクトはありません', '', '', '', '', 'すべての承認済み/申請中希望は勤務に調和しています。']);
  }

  const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data);
  XLSX.utils.book_append_sheet(wb, ws4, '希望申請・予定衝突一覧');

  // 5. 希望申請確認表（署名台帳） シート
  const sheet5Data: any[] = [
    ['【そよかぜ自立支援ホーム】 希望申請確認表及び決裁署名台帳'],
    [`対象年月: ${targetYearMonth}`, `施設名: ${settings.facilityName}`],
    [],
    ['申請者氏名', '日付', '曜日', '申請区分', '優先度', '理由内容', '承認ステータス', '確認日', '施設長署名捺印', 'サビ管署名捺印']
  ];

  requests.forEach(req => {
    const staff = staffList.find(s => s.id === req.staffId);
    const { weekday } = getDayAndW(req.targetDate);
    sheet5Data.push([
      staff?.name || '不明',
      req.targetDate,
      weekday,
      req.requestType,
      req.priority === 'high' ? '高' : '通常',
      req.reason || '',
      req.status === 'approved' ? '済：承認' : req.status === 'rejected' ? '済：却下' : '未審議',
      req.reviewedAt || '',
      ' (印) ',
      ' (印) '
    ]);
  });

  const ws5 = XLSX.utils.aoa_to_sheet(sheet5Data);
  XLSX.utils.book_append_sheet(wb, ws5, '希望申請確認表');

  XLSX.writeFile(wb, fileName);
}
