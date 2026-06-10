// src/components/Dashboard.tsx
import React from 'react';
import { 
  FacilitySettings, 
  Staff, 
  ShiftCategory, 
  DailyComplianceResult, 
  MonthlyFteResult 
} from '../types';
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  FileSpreadsheet, 
  ShieldAlert, 
  PhoneCall, 
  Users, 
  FileText 
} from 'lucide-react';
import { formatYearMonthDisplay } from '../utils/dateUtils';

interface DashboardProps {
  settings: FacilitySettings;
  staffList: Staff[];
  complianceResults: DailyComplianceResult[];
  fteResult: MonthlyFteResult;
  setActiveTab: (tab: string) => void;
  isActualMode: boolean;
  setIsActualMode: (val: boolean) => void;
}

export default function Dashboard({
  settings,
  staffList,
  complianceResults,
  fteResult,
  setActiveTab,
  isActualMode,
  setIsActualMode
}: DashboardProps) {
  // 当月の各種データ算出
  const totalDays = complianceResults.length;
  const dayRequiredStaff = Math.ceil(settings.dayUtilizerCount / settings.dayStaffingRatio);
  
  // 日中不足、宿泊不足、オンコール未設定の日数を集計
  const dayDeficitDays = complianceResults.filter(r => r.dayCompliance === '不足').map(r => r.day);
  const nightDeficitDays = complianceResults.filter(r => r.nightCompliance === '不足').map(r => r.day);
  
  const anyDeficitDaysCount = complianceResults.filter(
    r => r.dayCompliance === '不足' || r.nightCompliance === '不足'
  ).length;

  const onCallUnassignedDays = complianceResults.filter(r => !r.onCallStaffId).length;
  const emergencyResponseCount = complianceResults.filter(
    r => r.onCallEmergency && r.onCallEmergency.active === 'あり'
  ).length;

  // 常勤換算の過不足
  const fteDiff = fteResult.totalActualFte - fteResult.totalRequiredFte;
  const isFteCompliant = fteDiff >= 0;

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* 状況切替ヘッダー */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-500" />
            <span>{formatYearMonthDisplay(settings.targetYearMonth)} 配置稼働サマリー</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            施設定員：日中 {settings.dayCapacity}名 / 宿泊 {settings.nightCapacity}名 | 配置計算用：日中 {settings.dayUtilizerCount}名(基準 {settings.dayStaffingRatio}:1) / 宿泊 {settings.nightUtilizerCount}名(基準 {settings.nightStaffingRatio}:1)
          </p>
        </div>
        
        <div className="flex items-center bg-slate-100/80 p-1 rounded-lg border border-slate-200 self-start">
          <button
            id="toggle-schedule-btn"
            onClick={() => setIsActualMode(false)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              !isActualMode 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            勤務予定 (計画判定)
          </button>
          <button
            id="toggle-actual-btn"
            onClick={() => setIsActualMode(true)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              isActualMode 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            勤務実績 (監査突合)
          </button>
        </div>
      </div>

      {/* KPIカードグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="kpi-grid">
        {/* カード1: 配置不備日数 */}
        <div 
          onClick={() => setActiveTab('daily-check')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-red-300 transition-all cursor-pointer group"
          id="kpi-compliance-card"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">配属配置 整合性</span>
            <div className={`p-1.5 rounded-md ${anyDeficitDaysCount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-3xl font-bold text-slate-900" id="deficit-days-count">
              {anyDeficitDaysCount}
            </span>
            <span className="text-xs font-medium text-slate-500 ml-1">日不備</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-50 text-xs text-slate-500 flex flex-col gap-1">
            <div className="flex justify-between">
              <span>日中人員不足:</span>
              <span className={dayDeficitDays.length > 0 ? 'text-red-650 font-bold' : 'text-green-650'}>
                {dayDeficitDays.length} 日
              </span>
            </div>
            <div className="flex justify-between">
              <span>宿泊人員不足:</span>
              <span className={nightDeficitDays.length > 0 ? 'text-red-650 font-bold' : 'text-green-650'}>
                {nightDeficitDays.length} 日
              </span>
            </div>
          </div>
        </div>

        {/* カード2: 月間常勤換算 (FTE) */}
        <div 
          onClick={() => setActiveTab('fte-calc')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all cursor-pointer group"
          id="kpi-fte-card"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">生活支援員 総FTE値</span>
            <div className={`p-1.5 rounded-md ${isFteCompliant ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-3xl font-bold text-slate-900">
              {fteResult.totalActualFte.toFixed(2)}
            </span>
            <span className="text-xs font-medium text-slate-500 ml-1">
              / 必要 {fteResult.totalRequiredFte.toFixed(2)}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-50 text-xs text-slate-500 flex flex-col gap-1">
            <div className="flex justify-between">
              <span>基準適合状況:</span>
              <span className={isFteCompliant ? 'text-green-600 font-bold' : 'text-amber-600 font-bold'}>
                {isFteCompliant ? '基準クリア' : '人員配置不足'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>日中必要換算:</span>
              <span>{fteResult.dayRequiredFte.toFixed(2)}人分</span>
            </div>
          </div>
        </div>

        {/* カード3: オンコール体制 */}
        <div 
          onClick={() => setActiveTab('oncall-log')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all cursor-pointer group"
          id="kpi-oncall-card"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">オンコール体制</span>
            <div className={`p-1.5 rounded-md ${onCallUnassignedDays > 0 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
              <PhoneCall className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-3xl font-bold text-slate-900">
              {totalDays - onCallUnassignedDays}
            </span>
            <span className="text-xs font-medium text-slate-500 ml-1">/ {totalDays}日 設定</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-50 text-xs text-slate-500 flex flex-col gap-1">
            <div className="flex justify-between">
              <span>緊急対応発生:</span>
              <span className={emergencyResponseCount > 0 ? 'text-red-600 font-bold' : 'text-slate-500'}>
                {emergencyResponseCount} 件対応
              </span>
            </div>
            <div className="flex justify-between">
              <span>未割当日数:</span>
              <span className={onCallUnassignedDays > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                {onCallUnassignedDays} 日
              </span>
            </div>
          </div>
        </div>

        {/* カード4: 職員在籍状況 */}
        <div 
          onClick={() => setActiveTab('staff-master')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-400 transition-all cursor-pointer group"
          id="kpi-staff-card"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">職員在籍状況</span>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-500 group-hover:bg-slate-200/60 transition-colors">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline">
            <span className="text-3xl font-bold text-slate-900">
              {staffList.filter(s => s.isActive).length}
            </span>
            <span className="text-xs font-medium text-slate-500 ml-1">名稼働</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-50 text-xs text-slate-500 flex flex-col gap-1">
            <div className="flex justify-between">
              <span>常勤職員:</span>
              <span>{staffList.filter(s => s.isFullTime && s.isActive).length} 名</span>
            </div>
            <div className="flex justify-between">
              <span>非常勤職員:</span>
              <span>{staffList.filter(s => !s.isFullTime && s.isActive).length} 名</span>
            </div>
          </div>
        </div>
      </div>

      {/* 不足日の詳細アラート */}
      {anyDeficitDaysCount > 0 && (
        <div className="bg-red-50/70 border border-red-100 rounded-xl p-5 text-red-900" id="dashboard-alerts">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-red-900 text-sm">人員配置基準の警告：当月に不備のある日があります ({anyDeficitDaysCount}日間)</h4>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">以下の時間帯において、指定された配置基準（日中 {settings.dayCapacity}名時は {dayRequiredStaff}名配置、宿泊時は 1名以上配置）を下回っています。早急に勤務区分の調整、または代理勤務を設定してください。</p>
              
              <div className="mt-3 flex flex-wrap gap-2">
                {complianceResults.filter(r => r.dayCompliance === '不足' || r.nightCompliance === '不足').slice(0, 10).map(r => (
                  <button
                    key={r.day}
                    onClick={() => setActiveTab('daily-check')}
                    className="bg-white hover:bg-slate-100 text-red-700 border border-slate-200 text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <span>{r.day}日 ({r.dayOfWeek}) :</span>
                    {r.dayCompliance === '不足' && <span className="bg-red-100 text-red-800 px-1 py-0.2 rounded text-[10px]">日中不足</span>}
                    {r.nightCompliance === '不足' && <span className="bg-amber-100 text-amber-800 px-1 py-0.2 rounded text-[10px]">宿泊不足</span>}
                  </button>
                ))}
                {anyDeficitDaysCount > 10 && (
                  <span className="text-xs text-red-700 self-center font-semibold">他 {anyDeficitDaysCount - 10}件</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 充足時のお知らせ */}
      {anyDeficitDaysCount === 0 && (
        <div className="bg-green-50 border border-green-150/10 rounded-xl p-5 text-green-950" id="dashboard-no-alerts">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-green-900 text-sm">人員配置基準はすべて適合しています</h4>
              <p className="text-xs text-green-700 mt-1 leading-relaxed font-medium">当月の全日程において、日中支援および宿泊支援の実配置条件を完全にクリアしています。このまま監査帳票として安全に出力可能です。</p>
            </div>
          </div>
        </div>
      )}

      {/* サンプルデータの案内ラベル */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 配置ロジックの説明パネル */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-slate-900 rounded-full"></span>
            実務用・配置基準ロジックの概要
          </h3>
          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div>
              <h4 className="font-semibold text-slate-800">1. 日中支援時間 (09:30 〜 15:30)</h4>
              <p className="text-slate-500 mt-0.5">
                必要人数基準：配置計算用利用者数 ÷ {settings.dayStaffingRatio} = <strong>{dayRequiredStaff} 名</strong>
              </p>
              <p className="text-slate-500 mt-0.5">
                30分単位のすべての時間枠において、算入可能な支援員が <strong>{dayRequiredStaff} 名以上</strong>必要です。1勤務区分の合計時間数だけでカウントせず、実際のカバー度を厳密に照合します。
              </p>
            </div>
            
            <div className="border-t border-slate-100 pt-3">
              <h4 className="font-semibold text-slate-800">2. 宿泊支援時間 (15:30 〜 21:00)</h4>
              <p className="text-slate-500 mt-0.5">
                必要人数基準：常勤換算上は利用者数÷10等で表されますが、実配置では最低 <strong>1 名</strong>必要。
              </p>
              <p className="text-slate-500 mt-0.5">
                15:30〜21:00の間、実際に職員（遅番など）が配置されているかが監査上の実質条件。0人となる抜け枠時間帯が1つでもあれば配置不足となります。
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3 bg-slate-50 p-3 rounded-lg text-[11px] leading-relaxed">
              <span className="font-semibold text-slate-800">💡 算入制御ルール</span>
              <ul className="list-disc list-inside mt-1 space-y-1 text-slate-500">
                <li>サービス管理責任者は算入外 (サビ管のまま支援員に算入する行為を防止)。</li>
                <li>「管理者兼生活支援員」は、生活支援員業務としての勤務記号(日, 遅, 出等)の時間だけが算入。管理者専任は除外。</li>
                <li>有休、代休などの時間は、日別の実配置実動人数からは外れますが、月間常勤換算(FTE)には加算可能。</li>
              </ul>
            </div>
          </div>
        </div>

        {/* クイックリンク・アクション */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-full"></span>
              業務機能ショートカット
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setActiveTab('roster-input')}
                className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 hover:border-slate-200 text-left transition-all cursor-pointer"
              >
                <FileText className="h-5 w-5 text-slate-600 mb-2" />
                <span className="block font-bold text-slate-900 text-xs">勤務予定・実績入力</span>
                <span className="text-[10px] text-slate-500 mt-1 block leading-normal">エクセルライクな予定・実績編集</span>
              </button>

              <button 
                onClick={() => setActiveTab('daily-check')}
                className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 hover:border-slate-200 text-left transition-all cursor-pointer"
              >
                <ShieldAlert className="h-5 w-5 text-slate-600 mb-2" />
                <span className="block font-bold text-slate-900 text-xs">日別実配置確認</span>
                <span className="text-[10px] text-slate-500 mt-1 block leading-normal">30分単位での充足・不足時間帯判定</span>
              </button>

              <button 
                onClick={() => setActiveTab('fte-calc')}
                className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 hover:border-slate-200 text-left transition-all cursor-pointer"
              >
                <CheckCircle className="h-5 w-5 text-slate-600 mb-2" />
                <span className="block font-bold text-slate-900 text-xs">月間常勤換算(FTE)</span>
                <span className="text-[10px] text-slate-500 mt-1 block leading-normal">非常勤・有休合算FTEの根拠監査</span>
              </button>

              <button 
                onClick={() => setActiveTab('oncall-report')}
                className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 hover:border-slate-200 text-left transition-all cursor-pointer"
              >
                <PhoneCall className="h-5 w-5 text-slate-600 mb-2" />
                <span className="block font-bold text-slate-900 text-xs">オンコール帳票</span>
                <span className="text-[10px] text-slate-500 mt-1 block leading-normal">総務提出用の緊急対応実績報告</span>
              </button>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <button
              onClick={() => setActiveTab('excel-export')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>監査・総務 提出用Excel帳票ダウンロード画面へ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
