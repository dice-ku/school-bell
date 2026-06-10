// src/utils/dateUtils.ts

/**
 * 対象年月の末日（日数）を取得
 */
export function getDaysInMonth(yearMonth: string): number {
  if (!yearMonth) return 30;
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

/**
 * 対象年月の各日の曜日を日本語で取得
 * @returns '日' | '月' | '火' | '水' | '木' | '金' | '土'
 */
export function getDayOfWeekJapanese(yearMonth: string, day: number): string {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
}

/**
 * 週末（土曜日、日曜日）かどうかを判定
 */
export function isWeekend(yearMonth: string, day: number): boolean {
  if (!yearMonth) return false;
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayNum = date.getDay();
  return dayNum === 0 || dayNum === 6; // 0=日, 6=土
}

/**
 * 日付文字列 (YYYY-MM-DD) を生成
 */
export function getDateString(yearMonth: string, day: number): string {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  const paddedDay = String(day).padStart(2, '0');
  return `${year}-${month}-${paddedDay}`;
}

/**
 * 現在年月 (YYYY-MM) を取得
 */
export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 表示用の年月文字列を取得 (例: 2026年06月)
 */
export function formatYearMonthDisplay(yearMonth: string): string {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  return `${year}年${month}月`;
}
