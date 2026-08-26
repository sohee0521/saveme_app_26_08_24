import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Prev from "../../components/Prev";
import { Info, RotateCcw } from "lucide-react";
import {
  calculateTaskStatus,
  getStatusInfo,
  formatWorkTime,
} from "../../utils/statusCalculator";

export default function Predict() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  // 미루기 시뮬레이션 일수 (0: 오늘, 1: 1일 미룸, 2: 2일 미룸...)
  const [postponedDays, setPostponedDays] = useState(0);
  // 안내 모달 오픈 상태
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  // 화면 흔들림 트리거 상태
  const [isShaking, setIsShaking] = useState(false);
  // 암전 완료 후 모달 표시 여부 상태
  const [showDeadlockModal, setShowDeadlockModal] = useState(false);

  // 1. Task 데이터 로드 Hook
  useEffect(() => {
    const stored = localStorage.getItem("doingTasks");
    if (stored) {
      const tasks = JSON.parse(stored);
      const current = tasks.find((t) => String(t.id) === String(id));
      if (current) {
        setTask(current);
      }
    }
  }, [id]);

  // 2. 미루기 계산 (task 없을 때 안전 처리)
  const computed = task ? calculateTaskStatus(task, postponedDays) : null;
  const isDeadlock = computed ? computed.remainingDays === 0 : false;

  // 3. 🌟 0일 도달 시 2초(2000ms) 동안 서서히 암전 완료 후 모달 오픈
  useEffect(() => {
    let timer;
    if (isDeadlock) {
      timer = setTimeout(() => {
        setShowDeadlockModal(true);
      }, 2000); // 2초 암전 지속 시간에 맞춤
    } else {
      setShowDeadlockModal(false);
    }
    return () => clearTimeout(timer);
  }, [isDeadlock]);

  // Early Return
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

  // '미래의 나' SOS 말풍선 대사
  const getSosMessage = () => {
    if (status === "여유") {
      return postponedDays === 0
        ? "오늘치만 하고 편하게 쉬자~ "
        : "계획대로 사는 사람의 품격이란 이런 것";
    }
    if (status === "긴장") {
      return "'내일의 내가 하겠지'의 '내일'이 바로 오늘입니다";
    }
    if (status === "위기") {
      return "야... 장난치지 마. 나 내일 잠 진짜 못 자.";
    }
    if (status === "파멸") {
      return "나.. 다시 돌아갈래...";
    }
    return "";
  };

  // 미루기 버튼 문구
  const getPostponeButtonText = () => {
    if (computed.plannedProgress >= 100) return "우리에게 내일은 없어..";
    if (postponedDays === 0) return "미루기 (+1일)";
    if (status === "긴장") return "계속 회피하기";
    if (status === "위기") return "진짜 미룰 거야? ";
    if (status === "파멸") return "밤샘 확정";
    return "미루기";
  };

  // 경고 깜빡임 오버레이 클래스
  const getOverlayClass = (currentStatus) => {
    if (currentStatus === "위기") {
      return "bg-warning/20 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]";
    }
    if (currentStatus === "파멸") {
      return "bg-important/25 animate-[pulse_0.8s_cubic-bezier(0.4,0,0.6,1)_infinite]";
    }
    return "hidden";
  };

  const handlePostpone = () => {
    if (computed.plannedProgress < 100) {
      const nextDays = postponedDays + 1;
      setPostponedDays(nextDays);

      const nextComputed = calculateTaskStatus(task, nextDays);
      if (nextComputed.status === "파멸" || status === "파멸") {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
      }
    }
  };

  const handleRevert = () => {
    if (postponedDays > 0) {
      setPostponedDays((prev) => prev - 1);
    }
  };

  // 초기 상태로 리셋
  const handleReset = () => {
    setShowDeadlockModal(false);
    setPostponedDays(0);
  };

  return (
    <div className="relative w-full max-w-[430px] mx-auto px-[20px] pt-[50px] pb-[40px] bg-background min-h-screen overflow-hidden">
      {/* 🌟 1. 경고 깜빡임 오버레이 (최대 너비 컨테이너 내부 고정) */}
      <div
        className={`absolute inset-0 pointer-events-none z-30 transition-all duration-300 ${getOverlayClass(
          status,
        )}`}
      />

      {/* 🌟 2. 마감 0일차 도달 시 2초 동안 천천히 암전되는 오버레이 (최대 너비 내부 적용) */}
      <div
        className={`absolute inset-0 z-45 bg-black pointer-events-none transition-opacity duration-[2000ms] ease-in-out ${
          isDeadlock ? "opacity-90" : "opacity-0"
        }`}
      />

      {/* 콘텐츠 영역 (파멸일 때만 흔들림) */}
      <div
        className={`space-y-[30px] relative z-40 transition-transform ${
          isShaking ? "animate-[bounce_0.15s_infinite]" : ""
        }`}
      >
        <Prev title="미루기 예측" />

        {/* Info 안내 버튼 */}
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
              <div
                onClick={() => setIsInfoOpen(false)}
                className="fixed inset-0 z-40"
              />
            )}

            {isInfoOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-[32px] z-50 bg-white w-[300px] rounded-[10px] p-[15px] space-y-[10px] shadow-xl border border-light-gray"
              >
                <h3>미루기 예측</h3>
                <div className="space-y-[6px] text-left">
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
            )}
          </div>
        </div>

        <div className="w-full flex flex-col justify-center items-center gap-[40px] relative z-20">
          <div className="flex flex-col justify-center items-center gap-[1px]">
            <h2>{task.title}</h2>
            <h5 className="text-dark-gray">{message}</h5>
          </div>

          <div className="w-full flex flex-col justify-center items-center gap-[15px]">
            {/* '미래의 나' SOS 대사 말풍선 */}
            <div className="relative bg-white rounded-full px-[16px] py-[8px] shadow-sm animate-pulse">
              <h5 className="font-bold text-black text-center">
                {getSosMessage()}
              </h5>
              <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" />
            </div>

            <div className="w-[110px] h-[110px]">
              <img
                src={image}
                alt={status}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex gap-[5px] items-center">
              <h4 className="text-dark-gray">상태</h4>
              <h3>{status}</h3>
            </div>

            <div className="space-y-[5px] w-[280px]">
              {/* 계획 게이지 */}
              <div className="flex justify-between items-center">
                <h4 className="text-dark-gray">계획</h4>
                <div className="flex gap-[10px] items-center">
                  <div className="h-[12px] w-[180px] bg-light-gray rounded-full overflow-hidden">
                    <div
                      className="h-full bg-dark-gray transition-all duration-300"
                      style={{ width: `${computed.plannedProgress}%` }}
                    />
                  </div>
                  <h5 className="w-[35px] text-right">
                    {computed.plannedProgress}%
                  </h5>
                </div>
              </div>
              {/* 현재 게이지 */}
              <div className="flex justify-between items-center">
                <h4 className="text-dark-gray">현재</h4>
                <div className="flex gap-[10px] items-center">
                  <div className="h-[12px] w-[180px] bg-light-gray rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${computed.progress}%` }}
                    />
                  </div>
                  <h5 className="w-[35px] text-right">{computed.progress}%</h5>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-center mt-[10px]">
                마감까지{" "}
                <span className="text-important">
                  {computed.remainingDays}일
                </span>{" "}
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
              className={`w-2/3 py-[12px] rounded-[5px] transition-all cursor-pointer text-white ${
                status === "파멸"
                  ? "bg-important shadow-lg animate-pulse"
                  : status === "위기"
                    ? "bg-[#FAC720] text-black"
                    : "bg-primary"
              } disabled:bg-light-gray disabled:text-dark-gray disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <h3>{getPostponeButtonText()}</h3>
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 3. 암전 완료 후 뜨는 모달 (모바일 최대 너비 영역 내 중앙 배치) */}
      {showDeadlockModal && (
        <div className="absolute inset-0 z-50 flex justify-center items-center px-[20px] animate-[fadeIn_0.4s_ease-out]">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[320px] rounded-[16px] p-[24px] flex flex-col items-center gap-[16px] shadow-2xl border border-light-gray text-center"
          >
            <div className="w-[48px] h-[48px] rounded-full bg-important/10 flex items-center justify-center text-important">
              <RotateCcw size={20} strokeWidth={2.2} />
            </div>

            <div className="space-y-[6px]">
              <h2 className="text-important font-bold">
                미래를 바꿀 기회는 지금뿐이에요
              </h2>

              <h5 className="text-dark-gray">
                회피는 이제 그만. <br />
                미래의 나를 구하러 가볼까요?
              </h5>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full bg-primary text-white py-[12px] rounded-[10px] cursor-pointer transition-all  mt-[5px]"
            >
              <h3>다시 돌아가기</h3>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
