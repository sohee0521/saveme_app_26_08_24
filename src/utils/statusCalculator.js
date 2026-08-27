import vector1 from "../img/vector1.svg"; // 1단계: 여유
import vector2 from "../img/vector2.svg"; // 2단계: 긴장
import vector3 from "../img/vector3.svg"; // 3단계: 위기
import vector4 from "../img/vector4.svg"; // 4단계: 파멸

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DEFAULT_TOTAL_HOURS = 10;

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

// 2. 내부 헬퍼 함수 (날짜 간 일수 차이 계산 시 발생하는 '시/분/초 오차'를 제거하는 보정)

/** 자정 기준 Date 객체 반환 */
const getMidnightDate = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getDiffDays = (targetDate, baseDate) => {
  return Math.ceil((targetDate.getTime() - baseDate.getTime()) / MS_PER_DAY);
};

// 3. 이미지 경로와 피트백 멘트 반환

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
 * 계산된 모든 진척/위험도 데이터를 통합 반환
 * @param {Object} task - 할 일 객체
 * @param {number} postponedDays - 미루기 시뮬레이션 일수 (기본값 0)
 */
export const calculateTaskStatus = (task, postponedDays = 0) => {
  const todayMidnight = getMidnightDate();
  const deadlineMidnight = getMidnightDate(task.deadline || todayMidnight);
  const createdMidnight = getMidnightDate(task.createdAt || todayMidnight);

  // 1. 남은 일수 계산
  const baseDiffDays = getDiffDays(deadlineMidnight, todayMidnight);
  const remainingDays = baseDiffDays - postponedDays;
  const displayRemainingDays = Math.max(0, remainingDays);

  // 2. 전체 기간 및 계획 진척도 계산
  const totalDays = Math.max(
    1,
    getDiffDays(deadlineMidnight, createdMidnight) + 1,
  );
  const dailyTargetPercent = 100 / totalDays;

  const rawPassedDays = Math.max(
    0,
    Math.floor(
      (todayMidnight.getTime() - createdMidnight.getTime()) / MS_PER_DAY,
    ),
  );
  const passedDays = rawPassedDays + postponedDays + 1;

  // 마감일 도달 또는 기간 완료 시 100% 보장
  const isTermEnded = remainingDays <= 0 || passedDays >= totalDays;
  const plannedProgress = isTermEnded
    ? 100
    : Math.min(100, Math.max(0, Math.round(passedDays * dailyTargetPercent)));

  const currentProgress = Math.min(100, Math.max(0, task.progress || 0));

  // 3. 작업 소요시간 및 오늘 필요 작업량(분) 계산
  const totalEstimatedHours = Number(task.totalHours) || DEFAULT_TOTAL_HOURS;
  const remainingProgressRatio = Math.max(0, 100 - currentProgress) / 100;
  const remainingTotalHours = totalEstimatedHours * remainingProgressRatio;

  const safeDivisor = Math.max(1, remainingDays);
  const calculatedDailyHours = remainingTotalHours / safeDivisor;
  const dailyRequiredMinutes = calculatedDailyHours * 60;

  // 4. 상태 판정 로직
  const gap = plannedProgress - currentProgress;
  let status = "여유";

  if (gap <= 0 || currentProgress >= 100) {
    status = "여유";
  } else if (remainingDays < 0) {
    status = "파멸";
  } else {
    const delayDays = gap / dailyTargetPercent;

    if (dailyRequiredMinutes <= 40) {
      status = "여유";
    } else if (delayDays <= 1.0 || dailyRequiredMinutes <= 180) {
      status = "긴장";
    } else if (delayDays <= 2.5 || dailyRequiredMinutes <= 360) {
      status = "위기";
    } else {
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
 * 소수점 시간을 시/분 단위로 가공
 * @param {number} hoursDecimal - 소수점 형태의 시간
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
