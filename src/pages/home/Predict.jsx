import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Prev from "../../components/Prev";
import Loading from "../../components/Loading"; // 🌟 로딩 컴포넌트 임포트
import { Info, RotateCcw } from "lucide-react";
import {
  calculateTaskStatus,
  getStatusInfo,
  formatWorkTime,
} from "../../utils/statusCalculator";
import PageTitle from "../../components/PageTitle";

// --- 상태별 메시지 및 스타일 맵핑  ---
const SOS_MESSAGE_MAP = {
  여유: "계획대로 사는 사람의 품격이란 이런 것",
  긴장: "'내일의 내가 하겠지'의 '내일'이 바로 오늘입니다",
  위기: "야... 장난치지 마. 나 내일 잠 진짜 못 자.",
  파멸: "나.. 다시 돌아갈래...",
};

const OVERLAY_STYLE_MAP = {
  위기: "bg-warning/20 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]",
  파멸: "bg-important/25 animate-[pulse_0.8s_cubic-bezier(0.4,0,0.6,1)_infinite]",
};

// --- 게이지 바 컴포넌트 ---
function ProgressBar({ label, value, barColor }) {
  return (
    <div className="flex justify-between items-center">
      <h4 className="text-dark-gray">{label}</h4>
      <div className="flex gap-[10px] items-center">
        <div className="h-[12px] w-[180px] bg-light-gray rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-300`}
            style={{ width: `${value}%` }}
          />
        </div>
        <h5 className="w-[35px] text-right">{value}%</h5>
      </div>
    </div>
  );
}

// --- 메인 컴포넌트 ---
export default function Predict() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [postponedDays, setPostponedDays] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showDeadlockModal, setShowDeadlockModal] = useState(false);

  // 1. Task 데이터 로드
  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem("doingTasks");
      if (stored) {
        const tasks = JSON.parse(stored);
        const current = tasks.find((t) => String(t.id) === String(id));
        if (current) setTask(current);
      }
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [id]);

  // 2. 미루기 시뮬레이션 계산
  const computed = task ? calculateTaskStatus(task, postponedDays) : null;
  const isDeadlock = computed ? computed.remainingDays === 0 : false;

  // 3. 0일 도달 시 암전 타이머 (2초 후 모달 )
  useEffect(() => {
    if (!isDeadlock) {
      setShowDeadlockModal(false);
      return;
    }

    const timer = setTimeout(() => setShowDeadlockModal(true), 2000);
    return () => clearTimeout(timer);
  }, [isDeadlock]);

  if (isLoading) {
    return <Loading />;
  }

  if (!task || !computed) {
    return (
      <div className="px-[20px] pt-[50px] pb-[40px] bg-background min-h-screen">
        <Prev title="미루기 예측" />
        <p className="mt-[30px] text-dark-gray text-center">
          일정을 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  const { status, image, message } = getStatusInfo(computed.status);
  const formattedWorkTime = formatWorkTime(computed.dailyRequiredHours);

  // 말풍선 대사 결정
  const sosMessage =
    postponedDays === 0 && status === "여유"
      ? "오늘치만 하고 편하게 쉬자~"
      : SOS_MESSAGE_MAP[status] || "";

  // 미루기 버튼 문구 결정
  const getPostponeButtonText = () => {
    if (computed.plannedProgress >= 100) return "우리에게 내일은 없어..";
    if (postponedDays === 0) return "미루기 (+1일)";
    if (status === "긴장") return "계속 회피하기";
    if (status === "위기") return "진짜 미룰 거야?";
    if (status === "파멸") return "밤샘 확정";
    return "미루기";
  };

  // 미루기 버튼 스타일 결정
  const getPostponeButtonStyle = () => {
    if (status === "파멸")
      return "bg-important shadow-lg animate-pulse text-white";
    if (status === "위기") return "bg-[#FAC720] text-black";
    return "bg-primary text-white";
  };

  // 핸들러: 미루기 (+1일)
  const handlePostpone = () => {
    if (computed.plannedProgress >= 100) return;

    const nextDays = postponedDays + 1;
    setPostponedDays(nextDays);

    const nextComputed = calculateTaskStatus(task, nextDays);
    if (nextComputed.status === "파멸" || status === "파멸") {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    }
  };

  // 핸들러: 되돌리기 (-1일)
  const handleRevert = () => {
    if (postponedDays > 0) {
      setPostponedDays((prev) => prev - 1);
    }
  };

  // 핸들러: 초기화
  const handleReset = () => {
    setShowDeadlockModal(false);
    setPostponedDays(0);
  };

  return (
    <div className="relative w-full mx-auto px-[20px] pt-[50px] pb-[40px] bg-background min-h-screen overflow-hidden">
      <PageTitle title="미루기 예측" />
      {/* 경고 오버레이 (위기 / 파멸) */}
      <div
        className={`absolute inset-0 pointer-events-none z-30 transition-all duration-300 ${
          OVERLAY_STYLE_MAP[status] || "hidden"
        }`}
      />

      {/* 암전 오버레이 */}
      <div
        className={`absolute inset-0 z-45 bg-black pointer-events-none transition-opacity duration-[2000ms] ease-in-out ${
          isDeadlock ? "opacity-90" : "opacity-0"
        }`}
      />

      {/* 콘텐츠 영역 */}
      <div
        className={`space-y-[30px] relative z-40 transition-transform ${
          isShaking ? "animate-[bounce_0.15s_infinite]" : ""
        }`}
      >
        <Prev title="미루기 예측" />

        {/* Info 안내 툴팁 */}
        <div className="w-full flex justify-end relative z-40">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsInfoOpen(!isInfoOpen)}
              className="cursor-pointer p-[4px] -mr-[4px] flex items-center justify-center"
            >
              <Info color="var(--color-dark-gray)" strokeWidth={1.5} />
            </button>

            {isInfoOpen && (
              <>
                <div
                  onClick={() => setIsInfoOpen(false)}
                  className="fixed inset-0 z-40"
                />
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-[32px] z-50 bg-white w-[300px] rounded-[10px] p-[15px] space-y-[10px] shadow-xl border border-light-gray text-left"
                >
                  <h3>미루기 예측</h3>
                  <div className="space-y-[6px]">
                    <div className="flex gap-[5px] items-start">
                      <h5 className="!font-bold shrink-0">계획</h5>
                      <h5 className="text-dark-gray">
                        마감일에 맞추기 위한 권장 진행률이에요.
                      </h5>
                    </div>
                    <div className="flex gap-[5px] items-start">
                      <h5 className="!font-bold shrink-0">현재</h5>
                      <h5 className="text-dark-gray">
                        내가 실제로 끝마친 진행률이에요.
                      </h5>
                    </div>
                    <h5 className="py-[2px]">
                      격차가 커질수록{" "}
                      <span className="text-secondary font-bold">여유</span> →{" "}
                      <span className="text-primary font-bold">긴장</span> →{" "}
                      <span className="text-warning font-bold">위기</span> →{" "}
                      <span className="text-important font-bold">파멸</span>로
                      변해요.
                    </h5>
                    <div className="flex gap-[5px] items-start">
                      <h5 className="!font-bold shrink-0">미루기</h5>
                      <h5 className="text-dark-gray">
                        오늘 하루 쉬었을 때 닥칠 미래를 확인해 보세요.
                      </h5>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 상태 표시 및 캐릭터 영역 */}
        <div className="w-full flex flex-col justify-center items-center gap-[40px] relative z-20">
          <div className="flex flex-col justify-center items-center gap-[1px]">
            <h2>{task.title}</h2>
            <h5 className="text-dark-gray">{message}</h5>
          </div>

          <div className="w-full flex flex-col justify-center items-center gap-[15px]">
            {/* SOS 말풍선 */}
            <div className="relative bg-white rounded-full px-[16px] py-[8px] shadow-sm animate-pulse">
              <h5 className="font-bold text-black text-center">{sosMessage}</h5>
              <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" />
            </div>

            {/* 상태 캐릭터 이미지 */}
            <div className="w-[110px] h-[110px]">
              <img
                src={image}
                alt={status}
                className="w-full h-full object-contain"
              />
            </div>

            {/* 상태 텍스트 */}
            <div className="flex gap-[5px] items-center">
              <h4 className="text-dark-gray">상태</h4>
              <h3>{status}</h3>
            </div>

            {/* 게이지 바 영역 */}
            <div className="space-y-[5px] w-[280px]">
              <ProgressBar
                label="계획"
                value={computed.plannedProgress}
                barColor="bg-dark-gray"
              />
              <ProgressBar
                label="현재"
                value={computed.progress}
                barColor="bg-primary"
              />
            </div>

            {/* 작업 요구 시간 안내 문구 */}
            <div className="text-center mt-[10px]">
              <h3>
                마감까지{" "}
                <span className="text-important">
                  {computed.remainingDays}일
                </span>
                <br />
                하루에{" "}
                <span className="text-important">{formattedWorkTime}</span> 씩
                작업해요
              </h3>
            </div>
          </div>

          {/* 인터랙티브 버튼 영역 */}
          <div className="w-full flex gap-[10px]">
            <button
              type="button"
              onClick={handleRevert}
              disabled={postponedDays === 0}
              className="w-1/3 bg-light-gray text-dark-gray disabled:opacity-40 disabled:cursor-not-allowed py-[12px] rounded-[5px] transition-all cursor-pointer"
            >
              <h3>되돌리기</h3>
            </button>
            <button
              type="button"
              onClick={handlePostpone}
              disabled={computed.plannedProgress >= 100}
              className={`w-2/3 py-[12px] rounded-[5px] transition-all cursor-pointer ${getPostponeButtonStyle()} disabled:bg-light-gray disabled:text-dark-gray disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <h3>{getPostponeButtonText()}</h3>
            </button>
          </div>
        </div>
      </div>

      {/* 데드락 탈출 모달 */}
      {showDeadlockModal && (
        <div className="absolute inset-0 z-50 flex justify-center items-center px-[20px] animate-[fadeIn_0.4s_ease-out]">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[320px] rounded-[16px] p-[24px] flex flex-col items-center gap-[16px] shadow-2xl border border-light-gray text-center"
          >
            <div className="w-[48px] h-[48px] rounded-full bg-secondary/30 flex items-center justify-center text-primary">
              <RotateCcw size={20} strokeWidth={2.2} />
            </div>

            <div className="space-y-[6px]">
              <h2 className="text-black font-bold">
                미래의 나를 구하러 가볼까요?
              </h2>
              <h5 className="text-dark-gray">
                회피는 이제 그만. <br />
                미래를 바꿀 기회는 지금뿐이에요
              </h5>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full bg-primary text-white py-[12px] rounded-[10px] cursor-pointer transition-all mt-[5px]"
            >
              <h3>구하러 가기</h3>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
