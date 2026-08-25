import vector1 from "../img/vector1.svg"; // 1단계: 여유
import vector2 from "../img/vector2.svg"; // 2단계: 긴장
import vector3 from "../img/vector3.svg"; // 3단계: 위기
import vector4 from "../img/vector4.svg"; // 4단계: 파멸

export const STATUS_IMAGES = {
  여유: vector1,
  긴장: vector2,
  위기: vector3,
  파멸: vector4,
};

export const STATUS_MESSAGES = {
  여유: "지금처럼만 하면 여유롭게 끝내요",
  긴장: "살짝 밀렸지만 오늘 부지런히하면 원상복구 가능해요",
  위기: "휴식은 반납하고 풀가동하면 수습은 가능해요",
  파멸: "24시간 잠과 영혼을 갈아넣어도 모자라요",
};

export const getStatusImage = (status) => STATUS_IMAGES[status] || vector1;
export const getStatusMessage = (status) =>
  STATUS_MESSAGES[status] || STATUS_MESSAGES["여유"];

export const getStatusInfo = (status) => {
  const currentStatus = status || "여유";
  return {
    status: currentStatus,
    image: getStatusImage(currentStatus),
    message: getStatusMessage(currentStatus),
  };
};

/**
 * [단일 계산 함수] 계획 대비 달성도 및 지연량 기반 4단계 상태 판별
 * @param {Object} task - 할 일 객체
 * @param {number} postponedDays - 미루기 시뮬레이션 일수 (기본값 0)
 */
export const calculateTaskStatus = (task, postponedDays = 0) => {
  const now = new Date();
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const deadlineDate = new Date(task.deadline || now);
  deadlineDate.setHours(0, 0, 0, 0);

  const createdDate = task.createdAt ? new Date(task.createdAt) : new Date();
  const createdMidnight = new Date(
    createdDate.getFullYear(),
    createdDate.getMonth(),
    createdDate.getDate(),
  );

  // 1. 계획 진척도 계산
  const totalDaysDiff = Math.ceil(
    (deadlineDate.getTime() - createdMidnight.getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const totalPeriodDays = Math.max(
    1,
    totalDaysDiff === 0 ? 1 : totalDaysDiff + 1,
  );
  const dailyTargetPercent = 100 / totalPeriodDays;

  const basePassedDays = Math.max(
    0,
    Math.floor(
      (todayMidnight.getTime() - createdMidnight.getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
  const hoursPassedToday =
    now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const todayTimeRatio = Math.min(1, Math.max(0, hoursPassedToday / 24));

  const currentPassedDays = basePassedDays + postponedDays;
  const rawPlanned =
    currentPassedDays * dailyTargetPercent +
    dailyTargetPercent * todayTimeRatio;
  const plannedProgress = Math.min(100, Math.max(0, Math.round(rawPlanned)));
  const currentProgress = Math.min(100, Math.max(0, task.progress || 0));

  // 2. 남은 일수 계산
  const baseDiffDays = Math.ceil(
    (deadlineDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24),
  );
  const remainingDays = baseDiffDays - postponedDays;
  const displayRemainingDays = Math.max(0, remainingDays);

  // 3. 남은 총 소요시간 및 하루 권장 작업시간 계산
  const totalEstimatedHours = Number(task.totalHours) || 10;
  const remainingProgressRatio = Math.max(0, 100 - currentProgress) / 100;
  const remainingTotalHours = totalEstimatedHours * remainingProgressRatio;

  // D-Day(0일)일 때는 오늘 남은 전체를 해야 하므로 분모를 1로 처리
  const safeDivisor = Math.max(1, remainingDays);
  const calculatedDailyHours = remainingTotalHours / safeDivisor;

  // 4. [수정된 핵심 상태 판정 로직]
  const gap = plannedProgress - currentProgress; // 계획보다 뒤처진 %
  let status = "여유";

  // [규칙 1] 내가 계획보다 많이 했거나 같으면 무조건 '여유'
  if (gap <= 0 || currentProgress >= 100) {
    status = "여유";
  }
  // [규칙 2] 마감일이 완전히 지났는데(어제 이전) 100%가 아니면 무조건 '파멸'
  else if (remainingDays < 0) {
    status = "파멸";
  }
  // [규칙 3] 계획보다 뒤처졌을 때(gap > 0) 밀린 정도 판별
  else {
    // 밀린 실제 시간(분)
    const delayedMinutes = totalEstimatedHours * 60 * (gap / 100);

    // 하루 목표량 대비 며칠 치가 밀렸는가 (지연 일수)
    const delayDays = gap / dailyTargetPercent;

    // 밀린 시간이 45분 이하이거나 지연 일수가 1일치 이하인 경우
    if (delayedMinutes <= 45 || delayDays <= 1.0) {
      status = "긴장";
    }
    // 밀린 시간이 2시간(120분) 이하이거나 지연 일수가 2.5일치 이하인 경우
    else if (delayedMinutes <= 120 || delayDays <= 2.5) {
      status = "위기";
    }
    // 그 이상 밀린 경우
    else {
      status = "파멸";
    }
  }

  return {
    ...task,
    progress: currentProgress,
    plannedProgress,
    status,
    remainingDays: displayRemainingDays,
    dailyRequiredHours: calculatedDailyHours,
  };
};

/**
 * 시/분 표시용 문자열 포맷팅
 */
export const formatWorkTime = (hoursDecimal) => {
  if (hoursDecimal <= 0) return "0분";

  const totalMinutes = Math.round(hoursDecimal * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
};
