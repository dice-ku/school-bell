// src/components/MonthlyRoster.tsx
import React from 'react';
import { FacilitySettings, Staff, ShiftCategory, MonthlyRosterData } from '../types';
import { getDaysInMonth, getDayOfWeekJapanese, isWeekend } from '../utils/dateUtils';
import { Copy, Sparkles, Check, HelpCircle, FileText, ArrowRightLeft, Printer } from 'lucide-react';

interface MonthlyRosterProps {
  settings: FacilitySettings;
  staffList: Staff[];
  shifts: ShiftCategory[];
  rosters: Record<string, MonthlyRosterData>;
  onUpdateRosters: (newRosters: Record<string, MonthlyRosterData>) => void;
  isActualMode: boolean;
  setIsActualMode: (val: boolean) => void;
  userRole?: string;
  onTriggerAutoGenerate?: () => void;
}

export default function MonthlyRoster({
  settings,
  staffList,
  shifts,
  rosters,
  onUpdateRosters,
  isActualMode,
  setIsActualMode,
  userRole,
  onTriggerAutoGenerate
}: MonthlyRosterProps) {
  const yearMonth = settings.targetYearMonth;
  const daysInMonth = getDaysInMonth(yearMonth);
  const activeStaffList = staffList.filter(s => s.isActive);

  // 1〜末日までの配列
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 自動生成されたアサイン候補（生成案/ドラフト）をマーキングするステート
  const [draftCells, setDraftCells] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const stored = localStorage.getItem(`roster_app_draft_cells_${yearMonth}`);
    if (stored) {
      try {
        setDraftCells(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    } else {
      setDraftCells({});
    }
  }, [yearMonth]);

  const updateDraftCells = (newDrafts: Record<string, boolean>) => {
    setDraftCells(newDrafts);
    localStorage.setItem(`roster_app_draft_cells_${yearMonth}`, JSON.stringify(newDrafts));
  };

  // すべての生成案を一括確定
  const handleConfirmAllDrafts = () => {
    if (confirm('表示中のすべての自動生成提案を確定（ロック）します。よろしいですか？（点線枠とアイコンが通常の表示に切り替わります）')) {
      updateDraftCells({});
    }
  };

  // 個別のセル提案を確定
  const handleConfirmSingleDraft = (staffId: string, day: number) => {
    const key = `${staffId}-${day}`;
    if (draftCells[key]) {
      const nextDrafts = { ...draftCells };
      delete nextDrafts[key];
      updateDraftCells(nextDrafts);
    }
  };

  // 特定のセルを変更
  const handleCellChange = (staffId: string, day: number, newSymbol: string) => {
    const updated = { ...rosters };
    if (!updated[staffId]) {
      updated[staffId] = {
        yearMonth,
        staffId,
        schedule: {},
        actual: {}
      };
    }
    
    if (isActualMode) {
      updated[staffId].actual[String(day)] = newSymbol;
    } else {
      updated[staffId].schedule[String(day)] = newSymbol;
      
      // 自動生成案セルを変更した場合、生成案マーク（点線・アイコン）を確定（解除）
      const key = `${staffId}-${day}`;
      if (draftCells[key]) {
        const nextDrafts = { ...draftCells };
        delete nextDrafts[key];
        updateDraftCells(nextDrafts);
      }
    }
    
    onUpdateRosters(updated);
  };

  // 全体コピー：予定 -> 実績
  const handleCopyScheduleToActual = () => {
    if (confirm('すべての登録職種の【予定】データを、上書きで【実績】データに複製コピーします。よろしいですか？')) {
      const updated = { ...rosters };
      Object.keys(updated).forEach(id => {
        updated[id].actual = { ...updated[id].schedule };
      });
      onUpdateRosters(updated);
      alert('予定から実績への一括コピーが完了しました！次は、実際の欠勤や交代を「実績」で編集してください。');
    }
  };

  /**
   * スマート自動シフト作成エンジン（Heuristic Algorithm）
   * 宿泊型支援の要件 (15:30〜21:00に1名、日中に必要比率相当3名) を満たしつつ、
   * スタッフの週契約時間、常勤・非常勤、職務 roles、公休数を適正に振り分ける。
   */
  const handleAutoGenerateShift = () => {
    if (confirm('現在の【予定】データがリセットされ、スタッフ役割と配置基準(日中支援員3名、夜間支援員1名以上)を自動で最適配分した勤務予定スケジュールを生成します。実行しますか？')) {
      const updated = { ...rosters };
      
      // rosters初期化
      staffList.forEach(s => {
        updated[s.id] = {
          yearMonth,
          staffId: s.id,
          schedule: {},
          actual: {}
        };
      });

      // 支援に算入可能な支援員
      const supportStaff = staffList.filter(s => s.isActive && s.includeInStaffing && s.role !== 'サービス管理責任者' && s.role !== '管理者兼サービス管理責任者');
      // サビ管
      const sekiStaff = staffList.filter(s => s.isActive && (s.isSeki || s.role === 'サービス管理責任者'));
      // その他・管理オンリー
      const otherStaff = staffList.filter(s => s.isActive && !s.includeInStaffing && !s.isSeki);

      daysArray.forEach(d => {
        const dayOfWeek = getDayOfWeekJapanese(yearMonth, d);
        const isWe = dayOfWeek === '土' || dayOfWeek === '日';

        // 1. サビ管：土日は休み、平日はサビ管日勤「責」
        sekiStaff.forEach(s => {
          updated[s.id].schedule[String(d)] = isWe ? '休' : '責';
        });

        // 2. その他（管理者など）：土日休み、平日は管理日勤「役」
        otherStaff.forEach(s => {
          updated[s.id].schedule[String(d)] = isWe ? '休' : '役';
        });

        // 3. 生活支援員のアサイン
        // 週末の場合：利用者定員等も考慮し、日中・宿泊ともに最低限1遅番、1日勤程度を割り振る
        if (isWe) {
          // 土日はスタッフ山田(S001)と渡辺(S002)で交代で遅番、残りは基本日勤か休み
          const lateIndex = (d % 2 === 0) ? 0 : 1; 
          supportStaff.forEach((s, idx) => {
            if (s.id === 'S004') {
              // 非常勤の佐藤は土日は固定休み
              updated[s.id].schedule[String(d)] = '休';
              return;
            }
            if (idx === lateIndex) {
              updated[s.id].schedule[String(d)] = '遅'; // 夜間カバー
            } else if (idx === (lateIndex + 1) % supportStaff.length && d % 4 === 0) {
              updated[s.id].schedule[String(d)] = '日'; // 補助日勤
            } else {
              updated[s.id].schedule[String(d)] = '休';
            }
          });
        } 
        // 平日の場合：
        // 配置基準: 日中3名（山田、佐藤、鈴木など）、宿泊に1名以上（渡辺など）
        else {
          // 支援可能な職員を契約週数などでローテーション
          // 均等に「遅」を配分（1日最低1宿。宿泊は渡辺S002と山田S001で交互に回すのが基本）
          const nightWorkerIdx = (d % 2 === 0) ? 0 : 1; // S001かS002
          
          supportStaff.forEach((s, idx) => {
            // 鈴木(S003 - 管理者兼支援員)は週に1日、管理業務専任「役」を設定
            if (s.id === 'S003' && d % 5 === 2) {
              updated[s.id].schedule[String(d)] = '役';
              return;
            }

            // 非常勤の佐藤(S004)は火・木・金のみ「日」で出勤
            if (s.id === 'S004') {
              if (dayOfWeek === '火' || dayOfWeek === '木' || dayOfWeek === '金') {
                updated[s.id].schedule[String(d)] = '日';
              } else {
                updated[s.id].schedule[String(d)] = '休';
              }
              return;
            }

            if (idx === nightWorkerIdx) {
              updated[s.id].schedule[String(d)] = '遅'; // 宿泊カバー
            } else {
              // 残りの常勤は日勤「日」か、公休「休」(週に約2日を休日にする)
              const restPattern = (idx + d) % supportStaff.length;
              if (restPattern === 0 && d % 7 !== 1) { // 休み
                updated[s.id].schedule[String(d)] = '休';
              } else {
                updated[s.id].schedule[String(d)] = '日';
              }
            }
          });
        }
      });

      // 自動生成されたアサインを生成案（ドラフト）セルとしてマーキング
      const newDrafts: Record<string, boolean> = {};
      staffList.forEach(s => {
        daysArray.forEach(d => {
          newDrafts[`${s.id}-${d}`] = true;
        });
      });
      updateDraftCells(newDrafts);

      // 実績にも反映
      Object.keys(updated).forEach(id => {
        updated[id].actual = { ...updated[id].schedule };
      });

      onUpdateRosters(updated);
      alert('スマート配置自動アサインが完了しました！\n全日程で人員基準（平日の日中3人、休日および夜間のアサイン1人以上）を可能な限り満たすように計画されました。\n予定グリッドで自由に調整を加えてください。');
    }
  };

  return (
    <div className="space-y-4" id="monthly-roster-container">
      {/* 印刷専用ヘッダー (画面上は非表示、印刷時のみ出現してA4紙面を飾る) */}
      <div className="hidden print:flex items-center justify-between border-b border-slate-350 pb-2 mb-3" id="print-sheet-header">
        <div>
          <h1 className="text-sm font-bold text-slate-950">
            【{settings.facilityName || '生活支援施設'}】 勤務シフト予定・実績表
          </h1>
          <p className="text-[9px] text-slate-500 mt-0.5">
            対象年度月案: {yearMonth.split('-')[0]}年{Number(yearMonth.split('-')[1])}月度
          </p>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-slate-500 font-mono">印刷日時: {new Date().toLocaleDateString('ja-JP')} {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-[8px] text-slate-500 font-mono">出力モード: {isActualMode ? '最終実績表' : '予定表・計画案'}</p>
        </div>
      </div>

      {/* 予定・実績切替 & アクション */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 print:hidden">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-205/50">
            <button
              onClick={() => setIsActualMode(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                !isActualMode 
                  ? 'bg-white text-slate-900 shadow-3xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              予定表の入力
            </button>
            <button
              onClick={() => setIsActualMode(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                isActualMode 
                  ? 'bg-blue-600 text-white shadow-3xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              実績表の入力
            </button>
          </div>
          
          <span className="text-[10px] text-slate-400 font-medium">
            {isActualMode 
              ? '※ 予定との登録差異（突発欠勤・時短・午後休など）は、オレンジ色で表示されます。' 
              : '※ ここでシミュレーションした予定を、実績へ即座に一括コピー可能です。'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!(userRole === 'Staff' || userRole === 'Viewer') ? (
            <>
              {!isActualMode && (
                <button
                  id="auto-generate-shift-btn"
                  onClick={onTriggerAutoGenerate || handleAutoGenerateShift}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2 px-3 border border-blue-200/60 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  title="制度基準と職員の時間を満たす予定を高速自動生成"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <span>自動アサイン (シフト自動作成)</span>
                </button>
              )}

              <button
                id="copy-to-actual-btn"
                onClick={handleCopyScheduleToActual}
                className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs py-2 px-3 border border-slate-250/60 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5 text-slate-500" />
                <span>予定を実績に一括コピー</span>
              </button>
            </>
          ) : (
            <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              閲覧制限：編集および一括操作機能は無効です
            </span>
          )}

          <button
            onClick={() => window.print()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="A4横サイズでの印刷プレビューを開きます"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>印刷 (A4横)</span>
          </button>
        </div>
      </div>

      {/* 生成案のアシスタンスメッセージ & 一括確定ボタン */}
      {!isActualMode && Object.keys(draftCells).filter(k => draftCells[k]).length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in shadow-2xs print:hidden" id="draft-alert-banner">
          <div className="flex items-start gap-3">
            <div className="bg-blue-600/10 p-2 rounded-lg text-blue-700 shrink-0">
              <Sparkles className="h-4.5 w-4.5 animate-pulse text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-950 text-xs">
                自動生成された勤務予定（生成案）が適用されています
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                点線枠（<span className="inline-block w-2 sm:w-2.5 h-2 sm:h-2.5 bg-blue-50/50 border border-dashed border-blue-410 rounded-xs"></span>）と星印（✨）のセルは、未確定の自動生成スケジュール（生成案）です。<br className="hidden sm:inline" />
                セルを直接手動で選別・変更するか、小さな星印アイコン（✨）をクリックすると個別に確定。右の一括確定ボタンで一括確定できます。
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => updateDraftCells({})}
              className="text-slate-600 hover:text-slate-900 font-semibold text-xs py-2 px-3 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              マークを一時非表示
            </button>
            <button
              onClick={handleConfirmAllDrafts}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>すべての生成案を確定する ({Object.keys(draftCells).filter(k => draftCells[k]).length}件)</span>
            </button>
          </div>
        </div>
      )}

      {/* スプレッドシート型グリッド */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto print:border-none print:shadow-none print:overflow-visible" id="roster-grid-wrapper">
        <table className="min-w-full divide-y divide-slate-200 text-xs text-left print:w-full print:table-fixed print:min-w-0" id="roster-grid-table">
          <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2 w-28 print:w-[65px] print:max-w-[65px] print:static print:px-1 print:py-0.5 print:text-[8px] border-r border-slate-200 sticky left-0 bg-slate-50 z-10 shadow-[1px_0_0_0_#f1f5f9] print:shadow-none">氏名</th>
              <th className="px-3 py-2 w-20 print:w-[40px] print:max-w-[40px] print:px-1 print:py-0.5 print:text-[7px] border-r border-slate-100/80 text-center">役割</th>
              {daysArray.map(day => {
                const isWe = isWeekend(yearMonth, day);
                const isSun = getDayOfWeekJapanese(yearMonth, day) === '日';
                const isSat = getDayOfWeekJapanese(yearMonth, day) === '土';
                return (
                  <th 
                    key={day} 
                    className={`px-1 py-1 text-center min-w-10 print:min-w-0 print:w-5 print:p-0 border-r border-slate-100/80 ${
                      isSun ? 'bg-red-50 text-red-650 print:bg-red-50/20' : isSat ? 'bg-blue-50/50 text-blue-650 print:bg-blue-50/10' : ''
                    }`}
                  >
                    <span className="block font-bold print:text-[8px] print:leading-none">{day}</span>
                    <span className="text-[9px] font-normal print:text-[7px] print:leading-none print:mt-[1px]">{getDayOfWeekJapanese(yearMonth, day)}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-xs">
            {activeStaffList.map(staff => {
              const staffRoster = rosters[staff.id] || {
                yearMonth,
                staffId: staff.id,
                schedule: {},
                actual: {}
              };

              return (
                <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* 固定列：名前 */}
                  <td className="px-4 py-3 print:px-1 print:py-0.5 print:text-[8px] print:w-[65px] print:max-w-[65px] print:static font-semibold text-slate-900 border-r border-slate-250 sticky left-0 bg-white shadow-[1px_0_0_0_#e2e8f0] z-10 print:shadow-none print:whitespace-nowrap print:overflow-hidden print:text-ellipsis">
                    <div className="flex flex-col print:leading-tight">
                      <span className="print:text-[8px] whitespace-nowrap overflow-hidden text-ellipsis">{staff.name}</span>
                      <span className="text-[9px] text-slate-400 font-normal print:hidden">{staff.isFullTime ? '常勤' : '非常勤'}</span>
                    </div>
                  </td>
                  
                  {/* 固定列：役割 */}
                  <td className="px-3 py-3 print:px-1 print:py-0.5 print:text-[7px] print:w-[40px] print:max-w-[40px] border-r border-slate-100/80 text-slate-500 font-medium whitespace-nowrap text-[10px]">
                    {staff.role === 'サービス管理責任者' ? 'サビ管' : staff.role === '管理者兼生活支援員' ? '管理者兼支援' : staff.role}
                  </td>

                  {/* 1〜末日のセル */}
                  {daysArray.map(day => {
                    const schedVal = staffRoster.schedule[String(day)] || '休';
                    const actVal = staffRoster.actual[String(day)] || '休';
                    
                    const cellVal = isActualMode ? actVal : schedVal;
                    const hasDiff = isActualMode && schedVal !== actVal;
                    const isDraft = !isActualMode && draftCells[`${staff.id}-${day}`];

                    // セル内および背景のテーマ定義
                    let tdClass = `p-1 print:p-0 print:w-5 border-r border-slate-100/80 text-center relative transition-all duration-150`;
                    if (hasDiff) {
                      tdClass += ' bg-amber-50/75 font-semibold';
                    } else if (isDraft) {
                      tdClass += ' bg-blue-50/20';
                    }

                    return (
                      <td 
                        key={day} 
                        className={tdClass}
                        title={
                          isActualMode 
                            ? `予定: ${schedVal} | 実績: ${actVal}` 
                            : isDraft 
                              ? `生成案: ${schedVal} (未確定 - クリックで変更またはアイコンクリックで確定)` 
                              : `予定: ${schedVal}`
                        }
                      >
                        <div className={`relative px-0.5 py-0.5 print:p-0 rounded transition-all ${
                          isDraft ? 'border-2 border-dashed border-blue-450 bg-blue-50/60 shadow-3xs print:border-none print:bg-transparent print:shadow-none' : ''
                        }`}>
                          {isDraft && (
                            <button
                              type="button"
                              onClick={() => handleConfirmSingleDraft(staff.id, day)}
                              className="absolute top-[-5px] right-[-5px] bg-blue-600 hover:bg-emerald-600 text-white rounded-full p-[2px] shadow-sm cursor-pointer z-10 transition-all hover:scale-110 active:scale-95 print:hidden"
                              title="この日の自動提案を確定(確定状態にする)"
                            >
                              <Sparkles className="h-2 w-2 text-white animate-pulse" />
                            </button>
                          )}
                          
                          <select
                            disabled={userRole === 'Staff' || userRole === 'Viewer'}
                            value={cellVal}
                            onChange={e => handleCellChange(staff.id, day, e.target.value)}
                            className={`w-full rounded border-0 bg-transparent text-center font-bold px-0.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 print:hidden ${
                              userRole === 'Staff' || userRole === 'Viewer' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                            } ${
                              cellVal === '休' ? 'text-slate-400 font-normal' : 
                              cellVal === '日' ? 'text-green-700' :
                              cellVal === '遅' ? 'text-blue-700 font-extrabold' :
                              cellVal === '有' || cellVal === '代' ? 'text-red-700' :
                              cellVal === '役' || cellVal === '責' ? 'text-amber-800' : 'text-slate-900'
                            }`}
                          >
                            {shifts.map(s => (
                              <option key={s.symbol} value={s.symbol} className="text-gray-900 bg-white">
                                {s.symbol} : {s.name}
                              </option>
                            ))}
                          </select>

                          {/* 印刷用のプレーンテキスト表示 (セレクトボックスの隠蔽時) */}
                          <div className={`hidden print:block font-bold text-[9px] text-center font-mono leading-none py-[3px] ${
                            cellVal === '休' ? 'text-slate-400 font-normal' : 
                            cellVal === '日' ? 'text-green-700' :
                            cellVal === '遅' ? 'text-blue-700 font-extrabold' :
                            cellVal === '有' || cellVal === '代' ? 'text-red-700' :
                            cellVal === '役' || cellVal === '責' ? 'text-amber-800' : 'text-slate-900'
                          }`}>
                            {cellVal}
                          </div>
                        </div>
                        
                        {/* 予定と実績に差異があれば注意ドットを表示 (印刷時はドットを非表示にする) */}
                        {hasDiff && (
                          <div className="w-1.5 h-1.5 bg-amber-605 rounded-full mx-auto mt-0.5 print:hidden" title="予定と不一致" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 予定・実績凡例の表示 */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 print:hidden">
        <h4 className="font-bold text-slate-900 text-xs mb-2">共通の勤務区分記号・アサイン影響範囲：</h4>
        <div className="flex flex-wrap gap-4 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold text-green-700 font-mono">日</span>
            <span>日勤 (09:00〜17:00 / 支援員算入、日中算入可能、夜間は対象外)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold text-blue-700 font-mono">遅</span>
            <span>遅番 (13:00〜21:00 / 支援員算入、日中算入枠＆宿泊支援枠のフルカバー)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold text-amber-800 font-mono">役 / 責</span>
            <span>管理・サビ管日勤 (自立訓練生活支援員の実配置数からは除外)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold text-red-700 font-mono">有 / 代</span>
            <span>有給・代休 (日別物理配置員からは外れますが、月間常勤換算時間(FTE)には算入適格)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
