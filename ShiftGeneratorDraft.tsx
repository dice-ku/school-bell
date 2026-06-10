// src/components/OnCallLog.tsx
import React, { useState } from 'react';
import { FacilitySettings, Staff, MonthlyOnCallData, OnCallDayData, OnCallEmergencyLog } from '../types';
import { getDaysInMonth, getDayOfWeekJapanese, isWeekend } from '../utils/dateUtils';
import { PhoneCall, Moon, AlertTriangle, Save, RefreshCw, CheckCircle, Clock } from 'lucide-react';

interface OnCallLogProps {
  settings: FacilitySettings;
  staffList: Staff[];
  onCallData: MonthlyOnCallData;
  onUpdateOnCall: (newData: MonthlyOnCallData) => void;
  userRole?: string;
}

export default function OnCallLog({
  settings,
  staffList,
  onCallData,
  onUpdateOnCall,
  userRole
}: OnCallLogProps) {
  const yearMonth = settings.targetYearMonth;
  const daysInMonth = getDaysInMonth(yearMonth);
  const activeStaff = staffList.filter(s => s.isActive);

  // オンコール待機('oncall') / 宿直待機('night_duty') アサインの表示切り替え
  const [activeTabAssign, setActiveTabAssign] = useState<'oncall' | 'night_duty'>('oncall');
  
  // カレンダー上で選択されている日 (デフォルト 1日)
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const [yStr, mStr] = yearMonth.split('-');
  const [year, month] = [Number(yStr), Number(mStr)];
  
  // カレンダーの1日の開始曜日
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=日 〜 6=土

  // 空白セル数
  const blankCells = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 読み取り専用権限判定
  const isReadOnly = userRole === 'Staff' || userRole === 'Viewer';

  // 選択日の待機データを安全に取得 (無ければデフォルト値)
  const getSelectedDayData = (): OnCallDayData => {
    const dayKey = String(selectedDay);
    if (onCallData?.days?.[dayKey]) {
      return onCallData.days[dayKey];
    }
    return {
      staffId: '',
      subStaffId: '',
      setupPattern: '1人体制',
      dutyType: activeTabAssign,
      emergency: { active: 'なし', startTime: '', endTime: '', content: '' },
      notes: ''
    };
  };

  const selectedDayData = getSelectedDayData();

  // 単一フィールド更新＆親への反映
  const updateSelectedDayField = (updates: Partial<OnCallDayData>) => {
    if (isReadOnly) return;
    const dayKey = String(selectedDay);
    const updated = { ...onCallData };
    if (!updated.days) updated.days = {};
    
    const existing = updated.days[dayKey] || {
      staffId: '',
      subStaffId: '',
      setupPattern: '1人体制',
      dutyType: activeTabAssign,
      emergency: { active: 'なし', startTime: '', endTime: '', content: '' },
      notes: ''
    };

    updated.days[dayKey] = {
      ...existing,
      ...updates
    };

    onUpdateOnCall(updated);
  };

  // 緊急対応ログの更新
  const updateSelectedDayEmergency = (updates: Partial<OnCallEmergencyLog>) => {
    if (isReadOnly) return;
    const dayKey = String(selectedDay);
    const updated = { ...onCallData };
    if (!updated.days) updated.days = {};
    
    const existing = updated.days[dayKey] || {
      staffId: '',
      subStaffId: '',
      setupPattern: '1人体制',
      dutyType: activeTabAssign,
      emergency: { active: 'なし', startTime: '', endTime: '', content: '' },
      notes: ''
    };

    updated.days[dayKey] = {
      ...existing,
      emergency: {
        ...existing.emergency,
        ...updates
      }
    };

    onUpdateOnCall(updated);
  };

  // 選択日のアサインを全クリア
  const handleClearSelectedDay = () => {
    if (isReadOnly) return;
    if (confirm(`${selectedDay}日の配置およびアサイン情報をクリアします。よろしいですか？`)) {
      updateSelectedDayField({
        staffId: '',
        subStaffId: '',
        setupPattern: '1人体制',
        notes: '',
        emergency: { active: 'なし', startTime: '', endTime: '', content: '' }
      });
    }
  };

  // 一括自動割り当て (おまかせシャッフル)
  const handleAutoRotation = () => {
    if (isReadOnly) return;
    const modeName = activeTabAssign === 'oncall' ? 'オンコール夜間待機' : '宿直手配';
    if (confirm(`アクティブな支援員を基準にして、今月の全日程に ${modeName} を自動ローテーション割り当て（1日交代）します。上書きしてもよろしいですか？`)) {
      // サービス管理責任者や算入除外を除く、アクティブな支援員
      const eligible = activeStaff.filter(s => s.role !== 'サービス管理責任者' && s.includeInStaffing);
      if (eligible.length === 0) {
        alert('配置可能な対象生活支援員が見つかりません。');
        return;
      }

      const updated = { ...onCallData };
      if (!updated.days) updated.days = {};

      for (let d = 1; d <= daysInMonth; d++) {
        const staffIndex = (d - 1) % eligible.length;
        const dayKey = String(d);
        const existing = updated.days[dayKey] || {
          staffId: '',
          subStaffId: '',
          setupPattern: '1人体制',
          dutyType: activeTabAssign,
          emergency: { active: 'なし', startTime: '', endTime: '', content: '' },
          notes: ''
        };

        updated.days[dayKey] = {
          ...existing,
          staffId: eligible[staffIndex].id,
          dutyType: activeTabAssign,
          setupPattern: '1人体制'
        };
      }

      onUpdateOnCall(updated);
      alert(`${modeName}の自動一括アサインを反映しました！`);
    }
  };

  return (
    <div className="space-y-6" id="oncall-dashboard-container">
      
      {/* 1. アシンスタブ（オンコール待機アサイン / 宿直待機アサイン 切替）とクリアボタン */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 p-2 border border-slate-200/60 rounded-xl">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTabAssign('oncall')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              activeTabAssign === 'oncall'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm font-semibold'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-250/80 shadow-3xs'
            }`}
          >
            <PhoneCall className={`h-3.5 w-3.5 ${activeTabAssign === 'oncall' ? 'text-amber-300' : 'text-slate-500'}`} />
            <span>オンコール待機アサイン</span>
          </button>
          
          <button
            onClick={() => setActiveTabAssign('night_duty')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              activeTabAssign === 'night_duty'
                ? 'bg-slate-700 text-white border-slate-800 shadow-sm font-semibold'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-250/80 shadow-3xs'
            }`}
          >
            <Moon className={`h-3.5 w-3.5 ${activeTabAssign === 'night_duty' ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>宿直待機アサイン</span>
          </button>
        </div>

        {!isReadOnly && (
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleAutoRotation}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="h-3 w-3 animate-spin duration-3000" />
              <span>おまかせ一括アサイン</span>
            </button>
            <button
              onClick={handleClearSelectedDay}
              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] py-1.5 px-3 border border-red-250/50 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              title="現在選択中している日のアサイン構成を全リセットします"
            >
              <span>選択中の配置を全クリア</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. カレンダーと詳細パネルの2カラム */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 左側カラム：詳細および即時アサイントリガー (35%相当) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs p-4 space-y-4">
          <div className="border-b border-slate-150 pb-3">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>日別体制の詳細・呼出実績登録</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                {year}年{month}月{selectedDay}日 ({getDayOfWeekJapanese(yearMonth, selectedDay)})
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                selectedDayData.dutyType === 'night_duty' 
                  ? 'bg-slate-100 text-slate-800 border border-slate-200' 
                  : 'bg-indigo-50 text-indigo-800 border border-indigo-150'
              }`}>
                {selectedDayData.dutyType === 'night_duty' ? '宿直対応' : 'オンコール'}
              </span>
            </div>
          </div>

          {/* 待機管理・体制パターンの設定 */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">▼ 待機管理・体制パターンの設定</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isReadOnly}
                onClick={() => updateSelectedDayField({ setupPattern: '1人体制', subStaffId: '' })}
                className={`py-2 px-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  selectedDayData.setupPattern === '1人体制' || !selectedDayData.setupPattern
                    ? 'bg-slate-900 text-white border-slate-950 font-bold shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-705 border-slate-200 text-xs'
                }`}
              >
                <div className="text-xs font-bold">1人体制</div>
                <div className={`text-[9px] ${selectedDayData.setupPattern === '1人体制' ? 'text-slate-300' : 'text-slate-400'}`}>(主担当のみ)</div>
              </button>

              <button
                disabled={isReadOnly}
                onClick={() => updateSelectedDayField({ setupPattern: '2人体制' })}
                className={`py-2 px-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  selectedDayData.setupPattern === '2人体制'
                    ? 'bg-indigo-900 text-white border-indigo-950 font-bold shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-705 border-slate-200 text-xs'
                }`}
              >
                <div className="text-xs font-bold">2人体制</div>
                <div className={`text-[9px] ${selectedDayData.setupPattern === '2人体制' ? 'text-indigo-200' : 'text-slate-400'}`}>(主・副 2人待機)</div>
              </button>
            </div>
          </div>

          {/* 主担当スタッフの選択 */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">
              👤 主担当スタッフを選択 (クリックで即時変更)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                disabled={isReadOnly}
                onClick={() => updateSelectedDayField({ staffId: '' })}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                  !selectedDayData.staffId
                    ? 'bg-amber-655 bg-indigo-50 text-indigo-700 border-indigo-300 font-bold'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-250'
                }`}
              >
                未配置 (なし)
              </button>

              {activeStaff.map(s => {
                const isSelected = selectedDayData.staffId === s.id;
                // 常勤職員に★マークを付与して監査・責任格として識別しやすく
                const isFt = s.isFullTime; 
                return (
                  <button
                    key={s.id}
                    disabled={isReadOnly || selectedDayData.subStaffId === s.id}
                    onClick={() => updateSelectedDayField({ staffId: s.id, dutyType: activeTabAssign })}
                    className={`py-1.5 px-2 rounded-lg text-xs transition-all border text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 font-bold shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-250 disabled:opacity-40'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    {isFt && <span className={`text-[9px] ${isSelected ? 'text-amber-300' : 'text-blue-500'}`}>★</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 副担当スタッフの選択 (2人体制の時のみアクティブ) */}
          {selectedDayData.setupPattern === '2人体制' && (
            <div className="space-y-1.5 border-t border-slate-100 pt-2.5 animate-fade-in">
              <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight block">
                👥 副担当スタッフを選択
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  disabled={isReadOnly}
                  onClick={() => updateSelectedDayField({ subStaffId: '' })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    !selectedDayData.subStaffId
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-250'
                  }`}
                >
                  副未配置 (なし)
                </button>

                {activeStaff.map(s => {
                  const isSelected = selectedDayData.subStaffId === s.id;
                  const isMainSelected = selectedDayData.staffId === s.id;
                  const isFt = s.isFullTime;
                  return (
                    <button
                      key={s.id}
                      disabled={isReadOnly || isMainSelected}
                      onClick={() => updateSelectedDayField({ subStaffId: s.id })}
                      className={`py-1.5 px-2 rounded-lg text-xs transition-all border text-left flex items-center justify-between ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-700 font-bold shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-705 border-slate-250 disabled:opacity-40'
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {isFt && <span className={`text-[9px] ${isSelected ? 'text-amber-200' : 'text-teal-600'}`}>★</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 緊急対応用、実績記述 */}
          <div className="border-t border-slate-150 pt-3 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className={`h-4 w-4 ${selectedDayData.emergency?.active === 'あり' ? 'text-red-500 animate-bounce' : 'text-slate-400'}`} />
              <label className="text-[10px] font-bold text-slate-700 uppercase">🚨 深夜帯の緊急呼出・対応記録</label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isReadOnly}
                onClick={() => updateSelectedDayEmergency({ active: 'なし', startTime: '', endTime: '', content: '' })}
                className={`py-1 text-center text-xs border rounded transition-all cursor-pointer ${
                  selectedDayData.emergency?.active === 'なし' || !selectedDayData.emergency?.active
                    ? 'bg-slate-100 border-slate-300 font-bold text-slate-800'
                    : 'bg-white hover:bg-slate-55 text-slate-500 border-slate-200'
                }`}
              >
                対応なし
              </button>
              <button
                disabled={isReadOnly}
                onClick={() => updateSelectedDayEmergency({ active: 'あり' })}
                className={`py-1 text-center text-xs border rounded transition-all cursor-pointer ${
                  selectedDayData.emergency?.active === 'あり'
                    ? 'bg-red-50 border-red-300 font-bold text-red-700'
                    : 'bg-white hover:bg-slate-55 text-slate-500 border-slate-200'
                }`}
              >
                あり (対応ログ記入)
              </button>
            </div>

            {selectedDayData.emergency?.active === 'あり' && (
              <div className="space-y-2 bg-rose-50/20 p-2.5 border border-rose-200/50 rounded-lg animate-fade-in text-xs">
                {/* 時間帯 */}
                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold mb-1">対応時間帯:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      disabled={isReadOnly}
                      type="time"
                      value={selectedDayData.emergency.startTime || ''}
                      onChange={e => updateSelectedDayEmergency({ startTime: e.target.value })}
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-xs focus:outline-none focus:border-blue-500 bg-white"
                    />
                    <span className="text-slate-450 font-mono">~</span>
                    <input
                      disabled={isReadOnly}
                      type="time"
                      value={selectedDayData.emergency.endTime || ''}
                      onChange={e => updateSelectedDayEmergency({ endTime: e.target.value })}
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-xs focus:outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                {/* 記述内容 */}
                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold mb-1">対応記述ログ:</span>
                  <textarea
                    disabled={isReadOnly}
                    rows={2}
                    placeholder="例: 深夜に利用者の発熱について居室支援。氷枕などの対処、翌朝安定を確認。"
                    value={selectedDayData.emergency.content || ''}
                    onChange={e => updateSelectedDayEmergency({ content: e.target.value })}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-[11px] focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            )}

            {/* 引継ぎ用メモ */}
            <div>
              <label className="block text-[10px] text-slate-500 font-semibold mb-1">引継ぎ事項・備考・メモ:</label>
              <input
                disabled={isReadOnly}
                type="text"
                placeholder="例: 社内PHS待機持ち回り"
                value={selectedDayData.notes || ''}
                onChange={e => updateSelectedDayField({ notes: e.target.value })}
                className="w-full rounded border border-slate-300 px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* 右側カラム：カレンダーグリッドによる俯瞰表示 (65%相当) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs p-5">
          
          {/* 月間ヘッダー表示 */}
          <div className="flex flex-col sm:flex-row items-baseline sm:justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900 font-mono">
                {year}年 {month}月
              </span>
              <span className="text-slate-400 font-semibold text-xs tracking-widest font-mono uppercase">
                {new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' })} {year}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-normal italic mt-1 sm:mt-0">
              各日付ボックスを選択して、左側のパネルで人員アサインが行えます。
            </p>
          </div>

          {/* 曜日ラベル */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-550 mb-2">
            <div className="bg-rose-50/50 py-1 rounded text-red-650">日</div>
            <div className="bg-slate-50 py-1 rounded text-slate-700">月</div>
            <div className="bg-slate-50 py-1 rounded text-slate-700">火</div>
            <div className="bg-slate-50 py-1 rounded text-slate-700">水</div>
            <div className="bg-slate-50 py-1 rounded text-slate-700">木</div>
            <div className="bg-slate-50 py-1 rounded text-slate-700">金</div>
            <div className="bg-blue-50/50 py-1 rounded text-blue-650">土</div>
          </div>

          {/* カレンダーセル */}
          <div className="grid grid-cols-7 gap-2">
            {/* 1日より前の曜日に対応するダミー空白セル */}
            {blankCells.map(b => (
              <div key={`blank-${b}`} className="bg-slate-50/30 rounded-xl min-h-[95px] md:min-h-[105px] border border-dashed border-slate-150" />
            ))}

            {/* 月の日付セル */}
            {daysArray.map(day => {
              const dayKey = String(day);
              // 日の個別データ
              const dayData = onCallData?.days?.[dayKey] || {
                staffId: '',
                subStaffId: '',
                setupPattern: '1人体制',
                dutyType: 'oncall',
                emergency: { active: 'なし', startTime: '', endTime: '', content: '' },
                notes: ''
              };

              const isSelected = selectedDay === day;
              const hasEmergency = dayData.emergency?.active === 'あり';
              const dayOfWeek = getDayOfWeekJapanese(yearMonth, day);
              const isWe = isWeekend(yearMonth, day);

              // 担当支援員の特定
              const mainStaff = activeStaff.find(s => s.id === dayData.staffId);
              const subStaff = activeStaff.find(s => s.id === dayData.subStaffId);

              // 待機人数カウント
              const countText = dayData.staffId ? (dayData.setupPattern === '2人体制' && dayData.subStaffId ? '2人' : '1人') : '未配置';

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`relative p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer min-h-[100px] md:min-h-[110px] transition-all hover:scale-[1.01] hover:shadow-xs ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/10 shadow-indigo-100/30 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-350'
                  } ${
                    hasEmergency ? 'bg-red-50/5 border-red-200 hover:border-red-305' : ''
                  }`}
                >
                  {/* ヘッダー: 日付とアサインバッジ */}
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-bold font-mono ${
                      dayOfWeek === '日' ? 'text-red-500' : dayOfWeek === '土' ? 'text-blue-500' : 'text-slate-800'
                    }`}>
                      {day}
                    </span>

                    {/* スタイリッシュ待機人数バッジ */}
                    {dayData.staffId ? (
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-md ${
                        dayData.setupPattern === '2人体制' && dayData.subStaffId
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                          : 'bg-slate-100 text-slate-700 border border-slate-200/50'
                      }`}>
                        {countText}
                      </span>
                    ) : (
                      <span className="text-[8.5px] font-medium text-slate-350 px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-100">
                        {countText}
                      </span>
                    )}
                  </div>

                  {/* 中央コンテンツ: 割り当てられた人員の名前と体制 */}
                  <div className="text-[10px] flex-1 flex flex-col justify-center py-1 font-sans">
                    {dayData.staffId ? (
                      <div className="space-y-0.5 text-slate-800">
                        <div className="flex items-center gap-1 font-semibold truncate leading-tight">
                          <span className="text-slate-400 font-normal">主:</span>
                          <span className="truncate">{mainStaff?.name || '不明'}</span>
                        </div>
                        {dayData.setupPattern === '2人体制' && dayData.subStaffId && (
                          <div className="flex items-center gap-1 font-semibold text-teal-850 truncate leading-tight animate-fade-in">
                            <span className="text-slate-400 font-normal">副:</span>
                            <span className="truncate">{subStaff?.name || '不明'}</span>
                          </div>
                        )}
                        
                        {/* 宿直の時は小さくアイコンやマークを */}
                        {dayData.dutyType === 'night_duty' && (
                          <span className="inline-block mt-0.5 text-[8px] bg-slate-100 text-slate-500 px-1 rounded">宿直待機</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-400 font-medium italic text-[10px] text-center my-auto px-1">
                        待機未配置
                      </div>
                    )}
                  </div>

                  {/* 補助インジケータ: 緊急発生ドット / メモ */}
                  <div className="flex items-center justify-between mt-auto pt-1 border-t border-slate-50/70 text-[8px] font-mono">
                    <span className="truncate text-slate-400 max-w-[50px]">
                      {dayData.notes || ''}
                    </span>
                    {hasEmergency && (
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse shrink-0" title="緊急対応実績あり" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}
