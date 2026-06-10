// src/components/ShiftCategoryMaster.tsx
import React, { useState } from 'react';
import { ShiftCategory } from '../types';
import { Save, Plus, Edit2, Check, X, ShieldAlert, BookOpen } from 'lucide-react';

interface ShiftCategoryMasterProps {
  shifts: ShiftCategory[];
  onUpdate: (updatedShifts: ShiftCategory[]) => void;
}

export default function ShiftCategoryMaster({
  shifts,
  onUpdate
}: ShiftCategoryMasterProps) {
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ShiftCategory | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const initialNewShift = (): ShiftCategory => ({
    symbol: '',
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    breakHours: 1.0,
    workHours: 7.0,
    isDaySupport: true,
    isNightSupport: false,
    isSupportStaffWork: true,
    isManagerOnly: false,
    isSekiOnly: false,
    isOnCall: false,
    isHoliday: false,
    isPaidLeave: false,
    isCompLeave: false
  });

  const [newForm, setNewForm] = useState<ShiftCategory>(initialNewShift());

  // 勤務時間の簡易自動計算 (終了時刻 - 開始時刻 - 休憩時間)
  const calculateWorkHours = (start: string, end: string, bHours: number): number => {
    const [sH, sM] = start.split(':').map(Number);
    let [eH, eM] = end.split(':').map(Number);
    if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return 0;
    
    let endMin = eH * 60 + eM;
    const startMin = sH * 60 + sM;
    
    // 日を跨ぐ場合
    if (endMin < startMin) {
      endMin += 24 * 60;
    }
    
    const diffHours = (endMin - startMin) / 60;
    const work = diffHours - bHours;
    return parseFloat(Math.max(0, work).toFixed(2));
  };

  const handleStartEdit = (shift: ShiftCategory) => {
    setEditingSymbol(shift.symbol);
    setEditForm({ ...shift });
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    if (!editForm.symbol || !editForm.name) {
      alert('記号と名称は必須項目です。');
      return;
    }
    const updated = shifts.map(s => s.symbol === editForm.symbol ? editForm : s);
    onUpdate(updated);
    setEditingSymbol(null);
    setEditForm(null);
  };

  const handleAddNewOnSubmit = () => {
    if (!newForm.symbol.trim() || !newForm.name.trim()) {
      alert('記号と名称を入力してください。');
      return;
    }
    if (shifts.some(s => s.symbol === newForm.symbol.trim())) {
      alert('この記号は既に使用されています。ユニークな記号にしてください。');
      return;
    }
    
    const computed = {
      ...newForm,
      symbol: newForm.symbol.toUpperCase().trim()
    };
    onUpdate([...shifts, computed]);
    setIsAdding(false);
    setNewForm(initialNewShift());
  };

  const syncTimesOnBlur = (form: ShiftCategory, isEdit: boolean) => {
    const work = calculateWorkHours(form.startTime, form.endTime, form.breakHours);
    const updated = { ...form, workHours: work };
    if (isEdit) {
      setEditForm(updated);
    } else {
      setNewForm(updated);
    }
  };

  return (
    <div className="space-y-6" id="shift-category-container">
      {/* 新規追加フォーム */}
      {isAdding ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6" id="add-shift-form">
          <h3 className="font-bold text-slate-900 text-xs mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-600" />
            <span>新規勤務区分・記号の登録</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">勤務記号 (極力1文字)</label>
              <input
                type="text"
                placeholder="例: 遅"
                maxLength={2}
                value={newForm.symbol}
                onChange={e => setNewForm({ ...newForm, symbol: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none uppercase focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">名称</label>
              <input
                type="text"
                placeholder="例: 遅番シフト"
                value={newForm.name}
                onChange={e => setNewForm({ ...newForm, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">勤務時間帯</label>
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="time"
                  value={newForm.startTime}
                  onChange={e => setNewForm({ ...newForm, startTime: e.target.value })}
                  onBlur={() => syncTimesOnBlur(newForm, false)}
                  className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                />
                <span className="text-slate-400">~</span>
                <input
                  type="time"
                  value={newForm.endTime}
                  onChange={e => setNewForm({ ...newForm, endTime: e.target.value })}
                  onBlur={() => syncTimesOnBlur(newForm, false)}
                  className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">休憩時間 (時間)</label>
              <input
                type="number"
                step="0.5"
                value={newForm.breakHours}
                onChange={e => setNewForm({ ...newForm, breakHours: Number(e.target.value) })}
                onBlur={() => syncTimesOnBlur(newForm, false)}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">実動時間 (自動計算)</label>
              <div className="mt-2 text-xs font-mono font-extrabold text-slate-900 bg-slate-100 p-1.5 rounded-md text-center border border-slate-200">
                {newForm.workHours} h
              </div>
            </div>
          </div>

          {/* 属性チェックボックス一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs border-t border-slate-150 pt-5 mt-5">
            <div>
              <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">配置・算入種別</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={newForm.isSupportStaffWork}
                    onChange={e => setNewForm({ ...newForm, isSupportStaffWork: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>支援に携わる実労働</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={newForm.isDaySupport}
                    onChange={e => setNewForm({ ...newForm, isDaySupport: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>日中支援時間に配置</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={newForm.isNightSupport}
                    onChange={e => setNewForm({ ...newForm, isNightSupport: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>宿泊支援時間に配置</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">専任管理・休補</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-rose-700 font-medium">
                  <input
                    type="checkbox"
                    checked={newForm.isManagerOnly}
                    onChange={e => {
                      const active = e.target.checked;
                      setNewForm({ 
                        ...newForm, 
                        isManagerOnly: active,
                        isSupportStaffWork: !active,
                        isDaySupport: !active,
                        isNightSupport: !active 
                      });
                    }}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>管理者専任 (配置除外)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-rose-700 font-medium">
                  <input
                    type="checkbox"
                    checked={newForm.isSekiOnly}
                    onChange={e => {
                      const active = e.target.checked;
                      setNewForm({ 
                        ...newForm, 
                        isSekiOnly: active,
                        isSupportStaffWork: !active,
                        isDaySupport: !active,
                        isNightSupport: !active
                      });
                    }}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>サビ管専任 (配置除外)</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">特別区分</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={newForm.isOnCall}
                    onChange={e => setNewForm({ ...newForm, isOnCall: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>オンコール待機</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={newForm.isHoliday}
                    onChange={e => {
                      const active = e.target.checked;
                      setNewForm({ 
                        ...newForm, 
                        isHoliday: active,
                        isSupportStaffWork: !active,
                        isDaySupport: !active,
                        isNightSupport: !active,
                        workHours: active ? 0 : newForm.workHours
                      });
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>公休・特別休</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">有給等 (FTE換算充当)</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-green-700 font-medium">
                  <input
                    type="checkbox"
                    checked={newForm.isPaidLeave}
                    onChange={e => setNewForm({ ...newForm, isPaidLeave: e.target.checked, isSupportStaffWork: false, isDaySupport: false, isNightSupport: false })}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  <span>有休扱い (FTE稼働に加算)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-green-700 font-medium">
                  <input
                    type="checkbox"
                    checked={newForm.isCompLeave}
                    onChange={e => setNewForm({ ...newForm, isCompLeave: e.target.checked, isSupportStaffWork: false, isDaySupport: false, isNightSupport: false })}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  <span>代休扱い (FTE稼働に加算)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
            >
              キャンセル
            </button>
            <button
              id="submit-new-shift-btn"
              onClick={handleAddNewOnSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
            >
              <Check className="h-4 w-4" />
              <span>勤務記号を登録</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-205 flex-wrap gap-4">
          <div className="flex gap-2 items-center text-xs text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-150">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span>【解説】勤務記号ごとに時間帯を設定します。判定ロジックにより実アサインが自動計上されます。</span>
          </div>
          <button
            id="start-add-shift-btn"
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>勤務記号の追加</span>
          </button>
        </div>
      )}

      {/* 区分一覧 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs" id="shift-category-table">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5 w-16 border-b border-slate-200 text-center">記号</th>
              <th className="px-5 py-3.5 w-32 border-b border-slate-200">名称</th>
              <th className="px-5 py-3.5 border-b border-slate-200">時間帯</th>
              <th className="px-5 py-3.5 border-b border-slate-200">休憩/実動</th>
              <th className="px-4 py-3.5 border-b border-slate-200 text-center">支援員算入</th>
              <th className="px-4 py-3.5 border-b border-slate-200 text-center">日中算入</th>
              <th className="px-4 py-3.5 border-b border-slate-200 text-center">宿泊算入</th>
              <th className="px-4 py-3.5 border-b border-slate-200">その他属性</th>
              <th className="px-5 py-3.5 border-b border-slate-200 text-right w-20">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {shifts.map(shift => {
              const isEditing = editingSymbol === shift.symbol;

              if (isEditing && editForm) {
                return (
                  <tr key={shift.symbol} className="bg-blue-50/15" id={`editing-row-${shift.symbol}`}>
                    <td className="px-5 py-3 text-center font-bold text-blue-700 font-mono text-sm">{shift.symbol}</td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="time"
                          value={editForm.startTime}
                          onChange={e => setEditForm({ ...editForm, startTime: e.target.value })}
                          onBlur={() => syncTimesOnBlur(editForm, true)}
                          className="rounded border border-slate-300 px-1 py-0.5 text-xs bg-white"
                        />
                        <span className="text-slate-400">~</span>
                        <input
                          type="time"
                          value={editForm.endTime}
                          onChange={e => setEditForm({ ...editForm, endTime: e.target.value })}
                          onBlur={() => syncTimesOnBlur(editForm, true)}
                          className="rounded border border-slate-300 px-1 py-0.5 text-xs bg-white"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono">
                      休:
                      <input
                        type="number"
                        step="0.5"
                        value={editForm.breakHours}
                        onChange={e => setEditForm({ ...editForm, breakHours: Number(e.target.value) })}
                        onBlur={() => syncTimesOnBlur(editForm, true)}
                        className="w-10 text-center rounded border border-slate-300 px-0.5 py-0.5 ml-1 mr-2"
                      />
                      実:
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.workHours}
                        onChange={e => setEditForm({ ...editForm, workHours: Number(e.target.value) })}
                        className="w-12 text-center rounded border border-transparent bg-slate-50 px-0.5 py-0.5 font-bold ml-1 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={editForm.isSupportStaffWork}
                        onChange={e => setEditForm({ ...editForm, isSupportStaffWork: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={editForm.isDaySupport}
                        onChange={e => setEditForm({ ...editForm, isDaySupport: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={editForm.isNightSupport}
                        onChange={e => setEditForm({ ...editForm, isNightSupport: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-[10px]">
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={editForm.isManagerOnly}
                            onChange={e => {
                              const v = e.target.checked;
                              setEditForm({ ...editForm, isManagerOnly: v, isSupportStaffWork: !v, isDaySupport: !v, isNightSupport: !v });
                            }}
                            className="rounded text-rose-600 focus:ring-rose-500"
                          />
                          <span>管理者専任</span>
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={editForm.isSekiOnly}
                            onChange={e => {
                              const v = e.target.checked;
                              setEditForm({ ...editForm, isSekiOnly: v, isSupportStaffWork: !v, isDaySupport: !v, isNightSupport: !v });
                            }}
                            className="rounded text-rose-600 focus:ring-rose-500"
                          />
                          <span>サビ管専任</span>
                        </label>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={handleSaveEdit}
                          className="bg-green-600 text-white hover:bg-green-700 p-1 rounded-lg cursor-pointer"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setEditingSymbol(null)}
                          className="bg-slate-200 text-slate-700 hover:bg-slate-300 p-1 rounded-lg cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={shift.symbol}>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-block bg-blue-50 text-blue-700 font-extrabold rounded-lg font-mono px-3 py-1.5 text-xs text-center border border-blue-100/60 min-w-8">
                      {shift.symbol}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{shift.name}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">
                    {shift.isHoliday ? '-' : `${shift.startTime} ~ ${shift.endTime}`}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">
                    {shift.isHoliday ? '-' : `憩 ${shift.breakHours}h / 実 ${shift.workHours}h`}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`h-2.5 w-2.5 rounded-full inline-block ${shift.isSupportStaffWork ? 'bg-green-500' : 'bg-slate-200'}`} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`h-2.5 w-2.5 rounded-full inline-block ${shift.isDaySupport ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`h-2.5 w-2.5 rounded-full inline-block ${shift.isNightSupport ? 'bg-amber-500' : 'bg-slate-200'}`} />
                  </td>
                  <td className="px-4 py-3.5 font-medium">
                    <div className="flex flex-wrap gap-1">
                      {shift.isManagerOnly && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded text-[9px]">管理者専任</span>
                      )}
                      {shift.isSekiOnly && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded text-[9px]">サビ管専任</span>
                      )}
                      {shift.isOnCall && (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-150/10 px-1.5 py-0.5 rounded text-[9px]">オンコール</span>
                      )}
                      {shift.isHoliday && (
                        <span className="bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[9px]">公休</span>
                      )}
                      {shift.isPaidLeave && (
                        <span className="bg-green-50 text-green-700 border border-green-150/15 px-1.5 py-0.5 rounded text-[9px]">有休</span>
                      )}
                      {shift.isCompLeave && (
                        <span className="bg-green-50 text-green-700 border border-green-150/15 px-1.5 py-0.5 rounded text-[9px]">代休</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleStartEdit(shift)}
                      className="text-slate-400 hover:text-blue-655 hover:bg-slate-50 p-2 rounded-lg transition-colors inline-flex cursor-pointer"
                      title="記号を編集"
                      id={`edit-shift-btn-${shift.symbol}`}
                    >
                      <Edit2 className="h-3 w-3.5" />
                    </button>
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
