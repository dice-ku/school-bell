// src/components/FacilitySettings.tsx
import React, { useState } from 'react';
import { FacilitySettings as IFacilitySettings } from '../types';
import { Save, Info, RefreshCw } from 'lucide-react';

interface FacilitySettingsProps {
  settings: IFacilitySettings;
  onSave: (newSettings: IFacilitySettings) => void;
  resetAllToDefault: () => void;
}

export default function FacilitySettings({
  settings,
  onSave,
  resetAllToDefault
}: FacilitySettingsProps) {
  const [formData, setFormData] = useState<IFacilitySettings>({ ...settings });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isNum = [
      'dayCapacity', 
      'nightCapacity', 
      'dayUtilizerCount', 
      'nightUtilizerCount', 
      'dayStaffingRatio', 
      'nightStaffingRatio', 
      'weeklyFteHours'
    ].includes(name);

    setFormData(prev => ({
      ...prev,
      [name]: isNum ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaveMessage('施設設定を更新しました。勤務計算と常勤換算に即座に反映されます。');
    setTimeout(() => {
      setSaveMessage(null);
    }, 4000);
  };

  const handleReset = () => {
    if (confirm('すべての登録データ（職員、予定、実績、オンコール、施設設定）を消去し、初期サンプルデータで再起動します。よろしいですか？')) {
      resetAllToDefault();
      setSaveMessage('データを工場出荷状態にリセットしました。');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto" id="facility-settings-container">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">施設基本設定 & 制度パラメータ</h2>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            宿泊型自立訓練施設としての定員、配置計算用利用者数、支援従事時間枠、制度基準を登録します。
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-red-600 hover:text-white hover:bg-red-650 border border-slate-200 hover:border-transparent font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          <span>体験サンプルに戻す</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {saveMessage && (
          <div className="bg-green-50 border border-green-200/40 text-green-800 p-4 rounded-lg text-xs font-semibold">
            {saveMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
          {/* 基本設定 */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 border-l-4 border-slate-900 pl-2">施設情報・対象年月</h3>
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-600">施設名称</label>
              <input
                type="text"
                name="facilityName"
                value={formData.facilityName}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600">対象年月 (YYYY-MM)</label>
              <input
                type="month"
                name="targetYearMonth"
                value={formData.targetYearMonth}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">選択に従って、予定表や実績表、配置カレンダーが切り替わります。</p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600">常勤換算1.0の週所定時間基準 (時間)</label>
              <input
                type="number"
                step="0.5"
                name="weeklyFteHours"
                value={formData.weeklyFteHours}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">宿泊型自立訓練の標準は 週36.5時間 を1.0と見なします。</p>
            </div>
          </div>

          {/* 定員＆配置計算用利用者数 */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-205/60">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1">
              <Info className="h-4 w-4 text-blue-600" />
              <span>定員と配置計算用利用者数の区別</span>
            </h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              監査上の人員基準算出では、契約定員ではなく、前月末日までの<strong>配置計算用利用者数（過去6ヶ月間の平均利用者数など）</strong>を使用します。
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600">日中契約定員 (名)</label>
                <input
                  type="number"
                  name="dayCapacity"
                  value={formData.dayCapacity}
                  onChange={handleChange}
                  required
                  min="1"
                  className="mt-1 block w-full bg-white rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-650">日中 配置判定用利用者数 (名)</label>
                <input
                  type="number"
                  name="dayUtilizerCount"
                  value={formData.dayUtilizerCount}
                  onChange={handleChange}
                  required
                  min="0"
                  className="mt-1 block w-full bg-white rounded-lg border border-slate-350 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600">宿泊契約定員 (名)</label>
                <input
                  type="number"
                  name="nightCapacity"
                  value={formData.nightCapacity}
                  onChange={handleChange}
                  required
                  min="1"
                  className="mt-1 block w-full bg-white rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-655">宿泊 配置判定用利用者数 (名)</label>
                <input
                  type="number"
                  name="nightUtilizerCount"
                  value={formData.nightUtilizerCount}
                  onChange={handleChange}
                  required
                  min="0"
                  className="mt-1 block w-full bg-white rounded-lg border border-slate-350 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-normal">
              ※初期値：日中定員20名（計算18名）、宿泊定員10名（計算9名）。掛け算ルールは直接コードに埋め込まれず、この値を変更することで即時に配置人員計算に反映します。
            </p>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* 支援時間帯と配置比率 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 border-l-4 border-slate-900 pl-2">日中支援の基準設定</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600">支援開始時間</label>
                <input
                  type="time"
                  name="daySupportStart"
                  value={formData.daySupportStart}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600">支援終了時間</label>
                <input
                  type="time"
                  name="daySupportEnd"
                  value={formData.daySupportEnd}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-605">日中配置比率基準 (N : 1)</label>
              <input
                type="number"
                name="dayStaffingRatio"
                value={formData.dayStaffingRatio}
                onChange={handleChange}
                required
                min="1"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                宿泊型自立訓練の標準は <strong>6:1</strong>配置 です。現在設定では、利用者数 {formData.dayUtilizerCount} 名につき <strong>{Math.ceil(formData.dayUtilizerCount / formData.dayStaffingRatio)} 名</strong>の同時配置が毎日の30分時間枠で求められます。
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 border-l-4 border-slate-900 pl-2">宿泊支援の基準設定</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600">支援開始時間</label>
                <input
                  type="time"
                  name="nightSupportStart"
                  value={formData.nightSupportStart}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600">支援終了時間</label>
                <input
                  type="time"
                  name="nightSupportEnd"
                  value={formData.nightSupportEnd}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-605">宿泊配置比率基準 (N : 1)</label>
              <input
                type="number"
                name="nightStaffingRatio"
                value={formData.nightStaffingRatio}
                onChange={handleChange}
                required
                min="1"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                宿泊型自立訓練の標準は <strong>10:1</strong> です。夜間時間枠(主に15:30〜21:00)は実配置として<strong>最低 1 名</strong>の支援員を配置している必要があります。
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            id="save-settings-btn"
          >
            <Save className="h-4 w-4" />
            <span>施設設定を保存・全計算に反映</span>
          </button>
        </div>
      </form>
    </div>
  );
}
