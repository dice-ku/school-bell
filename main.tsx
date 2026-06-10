// src/components/FTECalculation.tsx
import React from 'react';
import { FacilitySettings, MonthlyFteResult } from '../types';
import { getDaysInMonth } from '../utils/dateUtils';
import { CheckCircle2, ShieldAlert, BadgeInfo, HelpCircle, Printer } from 'lucide-react';

interface FTECalculationProps {
  settings: FacilitySettings;
  fteResult: MonthlyFteResult;
  isActualMode: boolean;
}

export default function FTECalculation({
  settings,
  fteResult,
  isActualMode
}: FTECalculationProps) {
  const daysInMonth = getDaysInMonth(settings.targetYearMonth);
  // 当月における 1.0 FTE に相当する総労働時間数 = weeklyFteHours * (当月日数 / 7)
  const monthlyStandardHours = parseFloat((settings.weeklyFteHours * (daysInMonth / 7)).toFixed(2));

  const isCompliant = fteResult.totalActualFte >= fteResult.totalRequiredFte;

  return (
    <div className="space-y-6" id="fte-calc shadow-xs">
      {/* 適合評価ダッシュボード */}
      <div className={`p-6 bg-white rounded-xl border grid grid-cols-1 md:grid-cols-3 gap-6 items-center ${
        isCompliant ? 'border-green-200 bg-green-50/10' : 'border-amber-200 bg-amber-50/10'
      }`}>
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            {isCompliant ? (
              <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-green-200/50">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                <span>常勤換算 人員配置基準 適合判定：【 適 合 】</span>
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-amber-200/50">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
                <span>常勤換算 人員配置基準 適合判定：【 不適合・配置不足 】</span>
              </span>
            )}
            
            <span className="text-[10px] text-slate-400 font-medium font-mono">({isActualMode ? '実績値集計' : '予定値集計'})</span>
          </div>

          <p className="text-sm text-slate-700 font-bold mt-3 leading-relaxed">
            生活支援員の必要常勤換算合計: <span className="text-xl font-extrabold font-mono text-slate-900">{fteResult.totalRequiredFte}人分</span> に対して、<br className="hidden md:inline" />
            当月実績 生活支援員配置FTE合計: <span className={`text-2xl font-extrabold font-mono ${isCompliant ? 'text-green-700' : 'text-amber-700'}`}>{fteResult.totalActualFte.toFixed(3)}人分</span> 配置されています。
          </p>
          
          <div className="text-[11px] text-slate-500 mt-2 flex flex-col gap-1">
            <div>・日中必要: {settings.dayUtilizerCount}人 ÷ 6 = <strong>{fteResult.dayRequiredFte.toFixed(3)}人分</strong> (日中配置計算用利用者数 {settings.dayUtilizerCount}名に対して)</div>
            <div>・宿泊必要: {settings.nightUtilizerCount}人 ÷ 10 = <strong>{fteResult.nightRequiredFte.toFixed(3)}人分</strong> (宿泊配置計算用利用者数 {settings.nightUtilizerCount}名に対して)</div>
          </div>
        </div>

        {/* 算定の基準公式説明 */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-1 text-slate-600">
          <span className="font-bold text-slate-900 block mb-1 flex items-center gap-1">
            <HelpCircle className="h-4 w-4 text-blue-605 shrink-0" />
            <span>常勤換算 1.0人 の所定月時間</span>
          </span>
          <div>・週基準: <strong>{settings.weeklyFteHours}時間</strong> / 週</div>
          <div>・当月日数: <strong>{daysInMonth}日間</strong></div>
          <div className="border-t border-slate-200 mt-2 pt-1 font-mono text-slate-800">
            当月基準時間 = {settings.weeklyFteHours}h × {daysInMonth}日 ÷ 7日 = <strong className="text-blue-700">{monthlyStandardHours} 時間</strong>
          </div>
          <p className="text-[9px] text-slate-400 pt-1 leading-relaxed">常勤は所定契約時間を満たしていれば1.0（上限）、非常勤は [算入充当時間 ÷ {monthlyStandardHours}h] で按分算出します。超過残業はFTE加算しません。</p>
        </div>
      </div>

      <div className="bg-slate-50 text-slate-950 border border-slate-205 rounded-lg p-3 text-xs leading-relaxed flex items-start gap-2">
        <BadgeInfo className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong>常勤職員の1.0固定判定の透明化:</strong> 制度運用上、常勤職員は単純に1.0と表記するだけでなく、有休取得・実務実績の内訳時間数を明記して、監査官に証明することが義務づけられています。（サビ管、および未兼務の完全管理者登録職員は算入FTEから完全に除外されています）
        </div>
      </div>

      {/* 職員別詳細内訳テーブル */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none print:overflow-visible">
        <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900 flex justify-between items-center gap-4">
          <span>職員別常勤換算(FTE)・実働内訳一覧</span>
          <button
            onClick={() => window.print()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-sm transition-all cursor-pointer print:hidden"
            title="常勤換算(FTE)算定基礎一覧表をA4横サイズで印刷します"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>FTE計算報告印刷 (A4横)</span>
          </button>
        </div>
        
        <table className="min-w-full divide-y divide-slate-200 text-xs text-left print:w-full print:table-fixed print:min-w-0" id="fte-calc-details-table">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3 print:px-1.5 print:py-1.5 print:text-[8px] print:w-24 border-b border-slate-200">氏名</th>
              <th className="px-5 py-3 print:px-1.5 print:py-1.5 print:text-[8px] print:w-28 border-b border-slate-200">雇用/役割</th>
              <th className="px-5 py-3 print:px-1.5 print:py-1.5 print:text-[8px] print:w-20 border-b border-slate-200 text-center">支援員算入</th>
              <th className="px-5 py-3 print:px-1.5 print:py-1.5 print:text-[8px] print:w-24 border-b border-slate-200 text-right">月実労働時間</th>
              <th className="px-5 py-3 print:px-1.5 print:py-1.5 print:text-[8px] print:w-28 border-b border-slate-200 text-right bg-green-50/20">生活支援員対象時間</th>
              <th className="px-5 py-3 print:px-1.5 print:py-1.5 print:text-[8px] print:w-24 border-b border-slate-200 text-right text-rose-700">内 専任除外時間</th>
              <th className="px-5 py-3 print:px-1.5 print:py-1.5 print:text-[8px] print:w-20 border-b border-slate-200 text-right">オンコール数</th>
              <th className="px-5 py-3 print:px-1.5 print:py-1.5 print:text-[8px] print:w-24 border-b border-slate-200 text-right bg-blue-50/15 text-slate-900 font-bold">算出FTE値</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {fteResult.staffResults.map(res => {
              const eligible = res.includeInStaffing && res.role !== 'サービス管理責任者' && res.role !== '管理者兼サービス管理責任者';

              return (
                <tr 
                  key={res.staffId} 
                  className={`hover:bg-slate-50/50 transition-colors ${
                    !eligible ? 'bg-slate-50/30 text-slate-400' : ''
                  }`}
                >
                  {/* 名前 */}
                  <td className="px-5 py-3.5 print:px-1.5 print:py-1 print:text-[8px] font-bold text-slate-950">
                    <div>{res.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal print:hidden">ID: {res.staffId}</div>
                  </td>

                  {/* 区分・役 */}
                  <td className="px-5 py-3.5 print:px-1.5 print:py-1 print:text-[8px]">
                    <div className="font-semibold">{res.role}</div>
                    <div className="text-[10px] print:text-[7px]">{res.isFullTime ? '常勤' : '非常勤'} (週{res.weeklyContractedHours}h)</div>
                  </td>

                  {/* 支援員算入 */}
                  <td className="px-5 py-3.5 print:px-1.5 print:py-1 print:text-[8px] text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] print:text-[7px] font-semibold border ${
                      eligible 
                        ? 'bg-green-50 text-green-800 border-green-150/15' 
                        : 'bg-slate-100 text-slate-400 border-transparent'
                    }`}>
                      {eligible ? '算入可能' : '除外対象'}
                    </span>
                  </td>

                  {/* 月実労働時間 */}
                  <td className="px-5 py-3.5 print:px-1.5 print:py-1 print:text-[8px] text-right font-mono font-medium text-slate-900">
                    {res.totalActualWorkHours} 時間
                  </td>

                  {/* 生活支援員対象時間 (有休含む) */}
                  <td className="px-5 py-3.5 print:px-1.5 print:py-1 print:text-[8px] text-right font-mono font-bold text-green-700 bg-green-50/10">
                    {eligible ? `${res.supportWorkHours} 時間` : '-'}
                  </td>

                  {/* 内 管理/サビ専任時間 */}
                  <td className="px-5 py-3.5 print:px-1.5 print:py-1 print:text-[8px] text-right text-rose-700 font-semibold font-mono">
                    {res.exclusiveManagerHours > 0 && <div>管: {res.exclusiveManagerHours}h</div>}
                    {res.exclusiveSekiHours > 0 && <div>責: {res.exclusiveSekiHours}h</div>}
                    {res.exclusiveManagerHours === 0 && res.exclusiveSekiHours === 0 && <span>-</span>}
                  </td>

                  {/* オンコール回数 */}
                  <td className="px-5 py-3.5 print:px-1.5 print:py-1 print:text-[8px] text-right font-mono font-medium text-slate-500">
                    {res.onCallCount} 日
                  </td>

                  {/* 算出FTE値 */}
                  <td className="px-5 py-3.5 print:px-1.5 print:py-1 print:text-[8px] text-right font-mono font-extrabold bg-blue-50/10 text-slate-950 text-sm border-l border-slate-100">
                    {eligible ? (
                      <div>
                        <span>{res.fteValue.toFixed(3)}</span>
                        {res.fteValue >= 1.0 && <span className="text-[10px] text-slate-400 font-normal ml-0.5 print:hidden">(上限)</span>}
                      </div>
                    ) : (
                      <span className="text-slate-300 font-normal">0.000</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
