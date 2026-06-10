// src/components/StaffMaster.tsx
import React, { useState } from 'react';
import { Staff, StaffRole } from '../types';
import { Save, UserPlus, Edit2, Check, X, ShieldAlert, BadgeInfo } from 'lucide-react';

interface StaffMasterProps {
  staffList: Staff[];
  onUpdate: (updatedList: Staff[]) => void;
  userRole?: string;
}

export default function StaffMaster({ staffList, onUpdate, userRole }: StaffMasterProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Staff | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // 新規追加用の空データ
  const initialNewForm = (): Staff => ({
    id: `S${String(staffList.length + 1).padStart(3, '0')}`,
    name: '',
    isFullTime: true,
    role: '生活支援員',
    includeInStaffing: true,
    isSeki: false,
    isManager: false,
    weeklyContractedHours: 36.5,
    monthlyContractedHours: 156,
    isActive: true,
    appointmentReason: ''
  });

  const [newForm, setNewForm] = useState<Staff>(initialNewForm());

  // 職種によって、算入権限のデフォルトを切り替えるサポーティブヘルパー
  const handleRoleChangeAdjustments = (role: StaffRole, form: Staff): Staff => {
    const updated = { ...form, role };
    switch (role) {
      case '生活支援員':
        updated.includeInStaffing = true;
        updated.isSeki = false;
        updated.isManager = false;
        break;
      case '管理者':
        updated.includeInStaffing = false;
        updated.isSeki = false;
        updated.isManager = true;
        break;
      case '管理者兼生活支援員':
        updated.includeInStaffing = true;
        updated.isSeki = false;
        updated.isManager = true;
        break;
      case 'サービス管理責任者':
        updated.includeInStaffing = false;
        updated.isSeki = true;
        updated.isManager = false;
        break;
      case '管理者兼サービス管理責任者':
        updated.includeInStaffing = false;
        updated.isSeki = true;
        updated.isManager = true;
        break;
      case 'その他':
        updated.includeInStaffing = false;
        updated.isSeki = false;
        updated.isManager = false;
        break;
    }
    return updated;
  };

  const handleStartEdit = (staff: Staff) => {
    setEditingId(staff.id);
    setEditForm({ ...staff });
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    if (!editForm.name.trim()) {
      alert('氏名を入力してください。');
      return;
    }
    const updated = staffList.map(s => s.id === editForm.id ? editForm : s);
    onUpdate(updated);
    setEditingId(null);
    setEditForm(null);
  };

  const handleAddNew = () => {
    if (!newForm.name.trim()) {
      alert('氏名を入力してください。');
      return;
    }
    if (staffList.some(s => s.id === newForm.id)) {
      alert('重複する職員IDが既に存在します。新しいIDを指定してください。');
      return;
    }
    onUpdate([...staffList, newForm]);
    setIsAdding(false);
    setNewForm(initialNewForm());
  };

  const rolesList: StaffRole[] = [
    '生活支援員',
    '管理者',
    '管理者兼生活支援員',
    'サービス管理責任者',
    '管理者兼サービス管理責任者',
    'その他'
  ];

  return (
    <div className="space-y-6" id="staff-master-container">
      {/* 職員登録フォーム（展開時） */}
      {isAdding ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6" id="add-staff-form">
          <h3 className="font-bold text-slate-900 text-xs mb-4 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-blue-600" />
            <span>新規職員アカウント登録</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">職員ID</label>
              <input
                type="text"
                value={newForm.id}
                onChange={e => setNewForm({ ...newForm, id: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">職員氏名</label>
              <input
                type="text"
                placeholder="例: 青木 優"
                value={newForm.name}
                onChange={e => setNewForm({ ...newForm, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">雇用形態</label>
              <select
                value={newForm.isFullTime ? 'true' : 'false'}
                onChange={e => {
                  const ft = e.target.value === 'true';
                  setNewForm({ 
                    ...newForm, 
                    isFullTime: ft,
                    weeklyContractedHours: ft ? 36.5 : 20,
                    monthlyContractedHours: ft ? 156 : 80
                  });
                }}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="true font-medium">常勤 (標準週36.5h / 月156h)</option>
                <option value="false font-medium">非常勤 (標準週20h / 月80h)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">職務・役割</label>
              <select
                value={newForm.role}
                onChange={e => {
                  const updated = handleRoleChangeAdjustments(e.target.value as StaffRole, newForm);
                  setNewForm(updated);
                }}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {rolesList.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 text-xs border-t border-slate-150 pt-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">契約労働時間 (週)</label>
              <input
                type="number"
                step="0.5"
                value={newForm.weeklyContractedHours}
                onChange={e => setNewForm({ ...newForm, weeklyContractedHours: Number(e.target.value) })}
                className="mt-1 block w-40 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">契約労働時間 (月)</label>
              <input
                type="number"
                step="1"
                value={newForm.monthlyContractedHours}
                onChange={e => setNewForm({ ...newForm, monthlyContractedHours: Number(e.target.value) })}
                className="mt-1 block w-40 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col justify-end space-y-2">
              <label className="inline-flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={newForm.includeInStaffing}
                  onChange={e => setNewForm({ ...newForm, includeInStaffing: e.target.checked })}
                  className="rounded border-slate-300 text-blue-650 focus:ring-blue-500"
                />
                <span className="text-[11px] font-medium text-slate-700">生活支援員として自動配置カウントに算入する</span>
              </label>
            </div>
          </div>

          <div className="mt-4 text-xs">
            <label className="block text-[11px] font-semibold text-slate-600">採用理由 / 配置・算入要件 (監査における算定根拠となる資格・経歴など)</label>
            <input
              type="text"
              placeholder="例: 社会福祉士資格保有者、相談支援・福祉サービス経験 3年以上、管理者研修修了など"
              value={newForm.appointmentReason || ''}
              onChange={e => setNewForm({ ...newForm, appointmentReason: e.target.value })}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
            >
              キャンセル
            </button>
            <button
              id="submit-new-staff-btn"
              onClick={handleAddNew}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
            >
              <Save className="h-3.5 w-3.5" />
              <span>職員を登録する</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-205 flex-wrap gap-4">
          <div className="flex gap-2 items-center text-slate-800 text-[11px] bg-slate-50 border border-slate-150 px-3 py-2 rounded-lg">
            <BadgeInfo className="h-4 w-4 text-blue-600" />
            <span>【常勤換算の算定根拠】職員ごとに週36.5時間基準に従って自動計算されます。</span>
          </div>
          {!(userRole === 'Staff' || userRole === 'Viewer') ? (
            <button
              id="start-add-staff-btn"
              onClick={() => setIsAdding(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>新規職員の登録</span>
            </button>
          ) : (
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              現在の権限（{userRole === 'Staff' ? 'スタッフ' : 'ビューワー'}）では追加・編集できません (読込専用)
            </span>
          )}
        </div>
      )}

      {/* 職員一覧テーブル */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs" id="staff-master-table">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5 border-b border-slate-200">職員ID</th>
              <th className="px-5 py-3.5 border-b border-slate-200">氏名</th>
              <th className="px-5 py-3.5 border-b border-slate-200">常用分類</th>
              <th className="px-5 py-3.5 border-b border-slate-200">主たる役割</th>
              <th className="px-5 py-3.5 border-b border-slate-200">支援員算入</th>
              <th className="px-5 py-3.5 border-b border-slate-200">採用理由 / 算定根拠</th>
              <th className="px-5 py-3.5 border-b border-slate-200">契約労働(週/月)</th>
              <th className="px-5 py-3.5 border-b border-slate-200">ステータス</th>
              <th className="px-5 py-3.5 text-right border-b border-slate-200">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {staffList.map(staff => {
              const isEditing = editingId === staff.id;

              if (isEditing && editForm) {
                return (
                  <tr key={staff.id} className="bg-blue-50/15" id={`editing-row-${staff.id}`}>
                    <td className="px-5 py-3 font-semibold text-slate-900">{staff.id}</td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white font-bold"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={editForm.isFullTime ? 'true' : 'false'}
                        onChange={e => {
                          const ft = e.target.value === 'true';
                          setEditForm({ 
                            ...editForm, 
                            isFullTime: ft,
                            weeklyContractedHours: ft ? 36.5 : 20,
                            monthlyContractedHours: ft ? 156 : 80
                          });
                        }}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none bg-white animate-fade-in"
                      >
                        <option value="true">常勤</option>
                        <option value="false">非常勤</option>
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={editForm.role}
                        onChange={e => {
                          const updated = handleRoleChangeAdjustments(e.target.value as StaffRole, editForm);
                          setEditForm(updated);
                        }}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none bg-white"
                      >
                        {rolesList.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={editForm.includeInStaffing}
                        onChange={e => setEditForm({ ...editForm, includeInStaffing: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={editForm.appointmentReason || ''}
                        onChange={e => setEditForm({ ...editForm, appointmentReason: e.target.value })}
                        placeholder="採用理由・資格（例：社会福祉士）"
                        className="w-full min-w-44 rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white font-medium"
                      />
                    </td>
                    <td className="px-5 py-3 font-mono flex items-center gap-1">
                      <input
                        type="number"
                        step="0.5"
                        value={editForm.weeklyContractedHours}
                        onChange={e => setEditForm({ ...editForm, weeklyContractedHours: Number(e.target.value) })}
                        className="w-10 rounded border border-slate-300 px-1 py-0.5 text-center text-xs focus:outline-none focus:border-blue-500"
                      /> 
                      <span>/</span>
                      <input
                        type="number"
                        step="1"
                        value={editForm.monthlyContractedHours}
                        onChange={e => setEditForm({ ...editForm, monthlyContractedHours: Number(e.target.value) })}
                        className="w-12 rounded border border-slate-300 px-1 py-0.5 text-center text-xs focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={editForm.isActive ? 'true' : 'false'}
                        onChange={e => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                        className="rounded border border-slate-300 px-1 py-0.5 text-xs bg-white"
                      >
                        <option value="true">有効</option>
                        <option value="false">無効</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1.5 font-sans">
                        <button
                          onClick={handleSaveEdit}
                          className="bg-green-600 text-white hover:bg-green-700 p-1.5 rounded-lg cursor-pointer"
                          title="保存"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-slate-200 text-slate-700 hover:bg-slate-300 p-1.5 rounded-lg cursor-pointer"
                          title="取り消し"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={staff.id} className={staff.isActive ? 'hover:bg-slate-50/40' : 'bg-slate-100/40 text-slate-400'}>
                  <td className="px-5 py-3.5 font-semibold font-mono text-slate-500">{staff.id}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{staff.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                      staff.isFullTime 
                        ? 'bg-blue-50 text-blue-700 border-blue-100/60' 
                        : 'bg-indigo-50/70 text-indigo-700 border-indigo-100/50'
                    }`}>
                      {staff.isFullTime ? '常勤' : '非常勤'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">{staff.role}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] ${
                      staff.includeInStaffing ? 'text-green-700 font-semibold' : 'text-slate-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${staff.includeInStaffing ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                      {staff.includeInStaffing ? '支援員算入' : '算入除外'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-slate-700 font-medium text-[11px] max-w-xs block truncate" title={staff.appointmentReason}>
                      {staff.appointmentReason || <span className="text-slate-350 italic text-[10px]">未登録 (監査項目)</span>}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                    {userRole === 'Staff' || userRole === 'Viewer' ? (
                      <span className="text-slate-400 font-semibold italic">*** 非公開</span>
                    ) : (
                      <span className="whitespace-nowrap">週 {staff.weeklyContractedHours}h / 月 {staff.monthlyContractedHours}h</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      staff.isActive ? 'bg-green-50 text-green-800' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {staff.isActive ? 'アクティブ' : '無効'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    {!(userRole === 'Staff' || userRole === 'Viewer') ? (
                      <button
                        onClick={() => handleStartEdit(staff)}
                        className="text-slate-400 hover:text-blue-650 hover:bg-slate-50 p-2 rounded-lg transition-colors inline-flex cursor-pointer"
                        title="職員情報を編集"
                        id={`edit-staff-btn-${staff.id}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-bold">-</span>
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
