// src/utils/sampleData.ts
import { FacilitySettings, Staff, ShiftCategory, MonthlyRosterData, MonthlyOnCallData, ShiftRequest } from '../types';
import { getDaysInMonth, getDayOfWeekJapanese } from './dateUtils';

export function getDefaultFacilitySettings(yearMonth: string): FacilitySettings {
  return {
    facilityName: 'そよかぜ自立支援ホーム',
    dayCapacity: 20,
    nightCapacity: 10,
    dayUtilizerCount: 18,
    nightUtilizerCount: 9,
    dayStaffingRatio: 6,
    nightStaffingRatio: 10,
    daySupportStart: '09:30',
    daySupportEnd: '15:30',
    nightSupportStart: '15:30',
    nightSupportEnd: '21:00',
    weeklyFteHours: 36.5,
    targetYearMonth: yearMonth
  };
}

export function getDefaultStaffList(): Staff[] {
  return [
    {
      id: 'S001',
      name: '山田 太郎',
      isFullTime: true,
      role: '生活支援員',
      includeInStaffing: true,
      isSeki: false,
      isManager: false,
      weeklyContractedHours: 36.5,
      monthlyContractedHours: 156,
      isActive: true,
      preferredOffDays: [5, 12, 19],
      appointmentReason: '介護福祉士（常勤支援員・生活支援経験5年）'
    },
    {
      id: 'S002',
      name: '渡辺 健',
      isFullTime: true,
      role: '生活支援員',
      includeInStaffing: true,
      isSeki: false,
      isManager: false,
      weeklyContractedHours: 36.5,
      monthlyContractedHours: 156,
      isActive: true,
      preferredOffDays: [6, 13, 20],
      appointmentReason: '精神保健福祉士（常勤生活支援員・資格算算入）'
    },
    {
      id: 'S003',
      name: '鈴木 一郎',
      isFullTime: true,
      role: '管理者兼生活支援員',
      includeInStaffing: true,
      isSeki: false,
      isManager: true,
      weeklyContractedHours: 36.5,
      monthlyContractedHours: 156,
      isActive: true,
      preferredOffDays: [2, 16],
      appointmentReason: '管理者兼務・介護職員初任者研修修了（実務者研修予定）'
    },
    {
      id: 'S004',
      name: '鈴木 花子',
      isFullTime: false,
      role: '生活支援員',
      includeInStaffing: true,
      isSeki: false,
      isManager: false,
      weeklyContractedHours: 20,
      monthlyContractedHours: 80,
      isActive: true,
      preferredOffDays: [3, 17],
      availableDaysOfWeek: ['火', '木', '金'],
      appointmentReason: '社会福祉主事任用資格（非常勤生活支援員算入）'
    },
    {
      id: 'S005',
      name: '田中 美咲',
      isFullTime: true,
      role: 'サービス管理責任者',
      includeInStaffing: false,
      isSeki: true,
      isManager: false,
      weeklyContractedHours: 36.5,
      monthlyContractedHours: 156,
      isActive: true,
      preferredOffDays: [10],
      appointmentReason: 'サービス管理責任者研修修了・相談支援従事者初任研修修了（専任配置）'
    },
    {
      id: 'S006',
      name: '伊藤 結衣',
      isFullTime: false,
      role: 'その他',
      includeInStaffing: false,
      isSeki: false,
      isManager: false,
      weeklyContractedHours: 15,
      monthlyContractedHours: 60,
      isActive: true,
      preferredOffDays: [11],
      availableDaysOfWeek: ['月'],
      appointmentReason: '宿直補助員・外部連絡待機補助（支援員数算入除外人員）'
    }
  ];
}

export function getDefaultShiftCategories(): ShiftCategory[] {
  return [
    {
      symbol: '日',
      name: '日勤',
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
    },
    {
      symbol: '遅',
      name: '遅番',
      startTime: '13:00',
      endTime: '21:00',
      breakHours: 1.0,
      workHours: 7.0,
      isDaySupport: true,  // 13:00〜15:30で重なる
      isNightSupport: true, // 15:30〜21:00をフルカバー
      isSupportStaffWork: true,
      isManagerOnly: false,
      isSekiOnly: false,
      isOnCall: false,
      isHoliday: false,
      isPaidLeave: false,
      isCompLeave: false
    },
    {
      symbol: '出',
      name: '早出',
      startTime: '07:30',
      endTime: '15:30',
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
    },
    {
      symbol: '休',
      name: '休み',
      startTime: '00:00',
      endTime: '00:00',
      breakHours: 0,
      workHours: 0,
      isDaySupport: false,
      isNightSupport: false,
      isSupportStaffWork: false,
      isManagerOnly: false,
      isSekiOnly: false,
      isOnCall: false,
      isHoliday: true,
      isPaidLeave: false,
      isCompLeave: false
    },
    {
      symbol: '有',
      name: '有休',
      startTime: '09:00',
      endTime: '17:00',
      breakHours: 1.0,
      workHours: 7.0,
      isDaySupport: false,
      isNightSupport: false,
      isSupportStaffWork: false,
      isManagerOnly: false,
      isSekiOnly: false,
      isOnCall: false,
      isHoliday: false,
      isPaidLeave: true,
      isCompLeave: false
    },
    {
      symbol: '代',
      name: '代休',
      startTime: '09:00',
      endTime: '17:00',
      breakHours: 1.0,
      workHours: 7.0,
      isDaySupport: false,
      isNightSupport: false,
      isSupportStaffWork: false,
      isManagerOnly: false,
      isSekiOnly: false,
      isOnCall: false,
      isHoliday: false,
      isPaidLeave: false,
      isCompLeave: true
    },
    {
      symbol: '役',
      name: '管理日勤',
      startTime: '09:00',
      endTime: '17:00',
      breakHours: 1.0,
      workHours: 7.0,
      isDaySupport: false,
      isNightSupport: false,
      isSupportStaffWork: false,
      isManagerOnly: true,
      isSekiOnly: false,
      isOnCall: false,
      isHoliday: false,
      isPaidLeave: false,
      isCompLeave: false
    },
    {
      symbol: '責',
      name: 'サビ管日勤',
      startTime: '09:00',
      endTime: '17:00',
      breakHours: 1.0,
      workHours: 7.0,
      isDaySupport: false,
      isNightSupport: false,
      isSupportStaffWork: false,
      isManagerOnly: false,
      isSekiOnly: true,
      isOnCall: false,
      isHoliday: false,
      isPaidLeave: false,
      isCompLeave: false
    },
    {
      symbol: '半',
      name: '午後休',
      startTime: '09:00',
      endTime: '13:00',
      breakHours: 0,
      workHours: 4.0,
      isDaySupport: true, // 9:30〜13:00で一部カバー
      isNightSupport: false,
      isSupportStaffWork: true,
      isManagerOnly: false,
      isSekiOnly: false,
      isOnCall: false,
      isHoliday: false,
      isPaidLeave: false,
      isCompLeave: false
    }
  ];
}

/**
 * テストパターンを含むサンプル勤務予定・勤務実績データを生成する
 * - 山田(S001): ほぼ日勤・遅番
 * - 渡辺(S002): 遅番、夜間担当
 * - 鈴木(S003): 管理日勤と日勤兼務
 * - 佐藤(S004): 非常勤、火水金に出勤
 * - 田中(S005): サービス管理責任者、責の勤務
 * - 伊藤(S006): オンコールのみ、その他
 *
 * 【パターン検証】
 * - 1日〜5日：全て「充足」 (日中に日勤＋管理日勤のうち兼務者＋遅番など3名、夜間は遅番1名でカバー)
 * - 6日(不足テスト日中)：日中不足 (日勤が1人しかおらず、日中支援時間に配置が2名以下になる時間帯が発生)
 * - 7日(不足テスト宿泊)：宿泊不足 (遅番が誰もおらず、夜間に0人になる)
 */
export function getSampleRosterData(yearMonth: string): Record<string, MonthlyRosterData> {
  const daysInMonth = getDaysInMonth(yearMonth);
  const staffIds = ['S001', 'S002', 'S003', 'S004', 'S005', 'S006'];
  const rosters: Record<string, MonthlyRosterData> = {};

  staffIds.forEach(id => {
    rosters[id] = {
      yearMonth,
      staffId: id,
      schedule: {},
      actual: {}
    };
  });

  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = getDayOfWeekJapanese(yearMonth, d);
    const isWe = dayOfWeek === '土' || dayOfWeek === '日';

    // 職員ごとに初期配置
    // 1. 山田 (S001) - 常勤生活支援員
    if (isWe) {
      rosters['S001'].schedule[String(d)] = '休';
    } else {
      rosters['S001'].schedule[String(d)] = (d % 3 === 0) ? '遅' : '日';
    }

    // 2. 渡辺 (S002) - 常勤生活支援員
    if (isWe) {
      rosters['S002'].schedule[String(d)] = (d % 2 === 0) ? '遅' : '休';
    } else {
      rosters['S002'].schedule[String(d)] = (d % 5 === 0) ? '日' : '遅';
    }

    // 3. 鈴木 (S003) - 管理者兼生活支援員
    if (isWe) {
      rosters['S003'].schedule[String(d)] = '休';
    } else {
      rosters['S003'].schedule[String(d)] = (d % 4 === 0) ? '役' : '日'; // 専任日と支援員日をミックス
    }

    // 4. 佐藤 (S004) - 非常勤生活支援員
    if (dayOfWeek === '火' || dayOfWeek === '木' || dayOfWeek === '金') {
      rosters['S004'].schedule[String(d)] = '日';
    } else {
      rosters['S004'].schedule[String(d)] = '休';
    }

    // 5. 田中 (S005) - サビ管 (配置集計には算入されない)
    if (isWe) {
      rosters['S005'].schedule[String(d)] = '休';
    } else {
      rosters['S005'].schedule[String(d)] = '責';
    }

    // 6. 伊藤 (S006) - その他 (夜勤専従やオンコールなど、配置集計対象外)
    rosters['S006'].schedule[String(d)] = '休';

    // -- 実例調整 --
    
    // 【日中不足テスト】 6日： 日中必要数 = 3名(定員18名 / 6)
    // 山田:有休、鈴木:管理日勤(配置除外)、渡辺:遅番のみ。この場合、13:00までは渡辺の遅番はいないので日中が完全に1名(実配置不足)になります！
    if (d === 6) {
      rosters['S001'].schedule[String(d)] = '有'; // 山田有休
      rosters['S002'].schedule[String(d)] = '遅'; // 渡辺のみ (13:00出勤)
      rosters['S003'].schedule[String(d)] = '役'; // 鈴木は管理業務専任(算入除外)
      rosters['S004'].schedule[String(d)] = '休'; // 佐藤休み
    }

    // 【宿泊不足テスト】 7日：宿泊必要数 = 最低 1名
    // 遅番を誰も配置しないように制限します。
    if (d === 7) {
      rosters['S001'].schedule[String(d)] = '日'; // 山田日勤 (17:00退勤)
      rosters['S002'].schedule[String(d)] = '休'; // 渡辺休み
      rosters['S003'].schedule[String(d)] = '日'; // 鈴木日勤 (17:00退勤)
      rosters['S004'].schedule[String(d)] = '休'; // 佐藤休み
      // 17:00〜21:00の間、宿泊支援時間に配置が0人になり宿泊不足になります！
    }

    // 実績は、まずは予定をそのままコピー
    rosters['S001'].actual[String(d)] = rosters['S001'].schedule[String(d)];
    rosters['S002'].actual[String(d)] = rosters['S002'].schedule[String(d)];
    rosters['S003'].actual[String(d)] = rosters['S003'].schedule[String(d)];
    rosters['S004'].actual[String(d)] = rosters['S004'].schedule[String(d)];
    rosters['S005'].actual[String(d)] = rosters['S005'].schedule[String(d)];
    rosters['S006'].actual[String(d)] = rosters['S006'].schedule[String(d)];
    
    // 実績にさらに「突発的な変更」を加えて予定と実績の差異をテスト表示可能にする
    // 例：10日に山田(S001)が突発欠勤(休み)になり、代わりに佐藤(S004)が代理出勤(遅番)したケース
    if (d === 10) {
      rosters['S001'].actual[String(d)] = '休'; // 突発欠勤
      rosters['S004'].actual[String(d)] = '遅'; // 代理遅番出勤
    }
  }

  return rosters;
}

export function getSampleOnCallData(yearMonth: string): MonthlyOnCallData {
  const daysInMonth = getDaysInMonth(yearMonth);
  const data: MonthlyOnCallData = {
    yearMonth,
    days: {}
  };

  for (let d = 1; d <= daysInMonth; d++) {
    // 交代でオンコールを割り振る (主に山田S001、渡辺S002、佐藤S004、鈴木S003)
    let staffId = '';
    let subStaffId = '';
    let setupPattern: '1人体制' | '2人体制' = '1人体制';
    let dutyType: 'oncall' | 'night_duty' = 'oncall';
    let notes = '';

    // 特定の日について画像1・2のイメージに合わせる
    if (d === 1) {
      staffId = 'S001'; // 山田太郎
      setupPattern = '1人体制';
      dutyType = 'oncall';
      notes = '管理者待機';
    } else if (d === 2) {
      staffId = 'S001'; // 山田太郎
      subStaffId = 'S006'; // 伊藤結衣
      setupPattern = '2人体制';
      dutyType = 'oncall';
      notes = '管理者待機';
    } else if (d === 3) {
      staffId = 'S003'; // 鈴木一郎
      setupPattern = '1人体制';
      dutyType = 'oncall';
      notes = '生活支援員待機';
    } else if (d === 4) {
      staffId = 'S002'; // 渡辺健
      setupPattern = '1人体制';
      dutyType = 'night_duty';
      notes = '定期施設見回り';
    } else if (d === 5) {
      staffId = 'S004'; // 佐藤花子
      setupPattern = '1人体制';
      dutyType = 'oncall';
      notes = 'PHS携帯持参';
    } else if (d === 6) {
      staffId = 'S004'; // 佐藤花子
      setupPattern = '1人体制';
      dutyType = 'oncall';
      notes = '通常夜間待機';
    } else if (d === 7) {
      staffId = 'S002'; // 渡辺健
      setupPattern = '1人体制';
      dutyType = 'night_duty';
    } else if (d === 12) {
      staffId = 'S001';
      setupPattern = '1人体制';
      dutyType = 'night_duty';
    } else if (d === 18) {
      staffId = 'S003';
      setupPattern = '1人体制';
      dutyType = 'night_duty';
    } else {
      // その他の日は適宜分散。8〜14日あたりを「待機未配置/外部委託」にして15日以降に数日配置
      if (d >= 8 && d <= 13) {
        staffId = '';
      } else {
        if (d % 3 === 0) {
          staffId = 'S001';
          dutyType = 'oncall';
        } else if (d % 3 === 1) {
          staffId = 'S002';
          dutyType = 'night_duty';
        } else {
          staffId = 'S004';
          dutyType = 'oncall';
        }
      }
    }

    // いくつかの緊急対応ログを設定
    let active: 'あり' | 'なし' | '未記入' = 'なし';
    let startTime = '';
    let endTime = '';
    let content = '';

    if (d === 3) {
      active = 'あり';
      startTime = '21:30';
      endTime = '23:00';
      content = '夜間、利用者の軽微な腹痛連絡あり。薬の服用指示と状況確認をおこない、症状軽快まで確認した。';
      notes = '問題なく腹痛回復';
    } else if (d === 15) {
      active = 'あり';
      startTime = '02:00';
      endTime = '03:15';
      content = '施設自火報の一時的な誤報対応。消防車出動はなし。現地にて安全を確認し警備会社と復旧完了。';
      notes = '誤作動対策実施予定';
    }

    data.days[String(d)] = {
      staffId,
      subStaffId,
      setupPattern,
      dutyType,
      emergency: {
        active,
        startTime,
        endTime,
        content
      },
      notes
    };
  }

  return data;
}

export function getSampleShiftRequests(yearMonth: string): ShiftRequest[] {
  const [y, m] = yearMonth.split('-');
  
  return [
    {
      id: `REQ-${yearMonth}-001`,
      staffId: 'S004',
      targetMonth: yearMonth,
      requestDate: `${y}-${String(Number(m)-1).padStart(2, '0')}-20`,
      requestType: '希望休',
      conditionType: 'preference',
      targetDate: `${yearMonth}-10`,
      preferredShiftCode: '休',
      reason: '子供の授業参観のため休み希望します。',
      priority: 'high',
      status: 'approved',
      managerComment: '承認します。学校行事優先で調整。'
    },
    {
      id: `REQ-${yearMonth}-002`,
      staffId: 'S001',
      targetMonth: yearMonth,
      requestDate: `${y}-${String(Number(m)-1).padStart(2, '0')}-22`,
      requestType: '有休希望',
      conditionType: 'absolute',
      targetDate: `${yearMonth}-15`,
      preferredShiftCode: 'ホ', // Paid leave is Holiday/Paid Leave
      reason: '運転免許の更新手続き及び通院のため。',
      priority: 'medium',
      status: 'pending',
      managerComment: ''
    },
    {
      id: `REQ-${yearMonth}-003`,
      staffId: 'S002',
      targetMonth: yearMonth,
      requestDate: `${y}-${String(Number(m)-1).padStart(2, '0')}-18`,
      requestType: '遅番不可',
      conditionType: 'absolute',
      targetDate: `${yearMonth}-05`,
      reason: '18:30より夜間資格取得の講義（オンライン）出席のため。',
      priority: 'high',
      status: 'approved',
      managerComment: '承知しました。遅番は割り振らないよう対応。'
    },
    {
      id: `REQ-${yearMonth}-004`,
      staffId: 'S003',
      targetMonth: yearMonth,
      requestDate: `${y}-${String(Number(m)-1).padStart(2, '0')}-24`,
      requestType: 'オンコール不可',
      conditionType: 'absolute',
      targetDate: `${yearMonth}-25`,
      reason: '夜間に親族の法要準備に伴う移動・帰省のため不在。',
      priority: 'high',
      status: 'pending',
      managerComment: ''
    },
    {
      id: `REQ-${yearMonth}-005`,
      staffId: 'S006',
      targetMonth: yearMonth,
      requestDate: `${y}-${String(Number(m)-1).padStart(2, '0')}-25`,
      requestType: '土日勤務不可',
      conditionType: 'preference',
      targetDate: `${yearMonth}-20`,
      reason: '週末に子供の保護者会イベントが重なるため。',
      priority: 'medium',
      status: 'pending',
      managerComment: ''
    }
  ];
}
