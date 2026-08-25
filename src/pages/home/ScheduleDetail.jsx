import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Prev from "../../components/Prev";
import { Star, ArrowRight, Minus, Plus } from "lucide-react";
import {
  calculateTaskStatus,
  getStatusImage,
} from "../../utils/statusCalculator";

export default function ScheduleDetail() {
  const { id } = useParams();
  const [task, setTask] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("doingTasks");
    if (stored) {
      const tasks = JSON.parse(stored);
      const current = tasks.find((t) => String(t.id) === String(id));
      if (current) {
        const computed = calculateTaskStatus(current);
        setTask(computed);

        // 콘솔 출력
        console.group(`📌 [일정 상태 기준 정보] "${computed.title}"`);
        console.log(`- 남은 일수: ${computed.remainingDays}일`);
        console.log(
          `- 오늘 필요 작업시간: ${(computed.dailyRequiredHours * 60).toFixed(1)}분`,
        );
        console.log(
          `- 계획 진척도: ${computed.plannedProgress}% | 현재 진척도: ${computed.progress}%`,
        );
        console.log(`- 판정 상태: ${computed.status}`);
        console.groupEnd();
      }
    }
  }, [id]);

  const handleProgressChange = (taskId, delta) => {
    const stored = localStorage.getItem("doingTasks");
    if (!stored) return;

    const tasks = JSON.parse(stored);
    const updatedTasks = tasks.map((t) => {
      if (String(t.id) === String(taskId)) {
        const currentProgress = t.progress || 0;
        const currentToday = t.todayAdded || 0;

        if (delta > 0 && currentProgress >= 100) return t;
        if (delta < 0 && (currentToday <= 0 || currentProgress <= 0)) return t;

        const actualDelta =
          delta > 0
            ? Math.min(delta, 100 - currentProgress)
            : Math.max(delta, -currentToday);

        if (actualDelta === 0) return t;

        const nextToday = Math.max(0, currentToday + actualDelta);
        const nextTotal = Math.min(
          100,
          Math.max(0, currentProgress + actualDelta),
        );

        const updated = {
          ...t,
          todayAdded: nextToday,
          progress: nextTotal,
        };

        return calculateTaskStatus(updated);
      }
      return t;
    });

    localStorage.setItem("doingTasks", JSON.stringify(updatedTasks));
    const currentUpdated = updatedTasks.find(
      (t) => String(t.id) === String(taskId),
    );
    if (currentUpdated) {
      setTask(currentUpdated);
    }
  };

  if (!task) {
    return (
      <div className="px-[20px] pt-[50px] pb-[40px] bg-background min-h-screen">
        <Prev title="일정" />
        <p className="mt-[30px] text-dark-gray text-center">
          일정을 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  const now = new Date();
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const deadlineDate = new Date(task.deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - todayMidnight.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const ddayText =
    diffDays === 0
      ? "D-Day"
      : diffDays < 0
        ? `D+${Math.abs(diffDays)}`
        : `D-${diffDays}`;

  const getStarCount = (priority) => {
    if (priority === "최우선") return 3;
    if (priority === "중요") return 2;
    return 1;
  };

  return (
    <div className="px-[20px] pt-[50px] pb-[40px] bg-background min-h-screen space-y-[40px]">
      <Prev title="일정" />
      <div className="space-y-[25px]">
        <h2>{task.title}</h2>
        <div className="flex gap-[20px] items-center">
          <h3>마감일</h3>
          <div className="flex items-center gap-[10px]">
            <div className="flex justify-center items-center gap-[5px]">
              <h4 className="text-dark-gray">
                {task.deadline
                  ? task.deadline.replace(/-/g, ".")
                  : "2026.00.00"}
              </h4>
            </div>
            <div className="bg-secondary w-fit px-[7px] h-[22px] flex justify-center items-center">
              <h5>{ddayText}</h5>
            </div>
          </div>
        </div>

        <div className="flex gap-[20px] items-center">
          <h3>중요도</h3>
          <div className="flex gap-[2px]">
            {Array.from({ length: getStarCount(task.priority) }).map(
              (_, idx) => (
                <Star
                  key={idx}
                  size={14}
                  color="var(--color-important)"
                  fill="var(--color-important)"
                />
              ),
            )}
          </div>
        </div>

        <div className="space-y-[20px]">
          <div className="w-full flex justify-between items-center">
            <h3>진척도</h3>
            <Link
              to={`/predict/${task.id}`}
              state={{ task }}
              className="px-[8px] py-[4px] border border-dark-gray rounded-full flex gap-[5px] items-center cursor-pointer"
            >
              <h5>미루기 예측</h5>
              <ArrowRight size={16} strokeWidth={1.58} />
            </Link>
          </div>

          <div className="w-full flex flex-col gap-[20px] justify-center items-center">
            <div className="w-[100px] h-[100px]">
              <img
                src={getStatusImage(task.status)}
                alt={task.status || "여유"}
                className="w-full h-full"
              />
            </div>
            <div className="flex gap-[5px]">
              <h4 className="text-dark-gray">상태</h4>
              <h3>{task.status || "여유"}</h3>
            </div>

            <div className="space-y-[5px] w-full max-w-[280px]">
              {/* 계획 게이지 */}
              <div className="flex justify-between items-center">
                <h4 className="text-dark-gray">계획</h4>
                <div className="flex gap-[10px] items-center">
                  <div className="h-[12px] w-[180px] bg-light-gray rounded-full overflow-hidden">
                    <div
                      className="h-full bg-dark-gray transition-all duration-300"
                      style={{ width: `${task.plannedProgress || 0}%` }}
                    />
                  </div>
                  <h5 className="w-[35px] text-right">
                    {task.plannedProgress || 0}%
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
                      style={{ width: `${task.progress || 0}%` }}
                    />
                  </div>
                  <h5 className="w-[35px] text-right">{task.progress || 0}%</h5>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하루 작업량 조절 */}
        <div className="flex justify-between items-center pt-[10px]">
          <h3>하루 작업량</h3>
          <div className="w-fit flex justify-center gap-[5px] items-center">
            <button
              type="button"
              disabled={
                (task.todayAdded || 0) <= 0 || (task.progress || 0) <= 0
              }
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleProgressChange(task.id, -5);
              }}
              className="relative bg-black disabled:opacity-30 disabled:cursor-not-allowed w-[24px] h-[24px] rounded-full flex justify-center items-center cursor-pointer after:content-[''] after:absolute after:inset-[-10px]"
            >
              <Minus color="white" size={15} />
            </button>
            <h4 className="w-[60px] h-[24px] flex justify-center items-center rounded-[5px] text-center">
              {task.todayAdded || 0}%
            </h4>
            <button
              type="button"
              disabled={(task.progress || 0) >= 100}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleProgressChange(task.id, 5);
              }}
              className="relative bg-black disabled:opacity-30 disabled:cursor-not-allowed w-[24px] h-[24px] rounded-full flex justify-center items-center cursor-pointer after:content-[''] after:absolute after:inset-[-10px]"
            >
              <Plus color="white" size={15} />
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="w-full bg-primary disabled:bg-light-gray disabled:text-dark-gray disabled:cursor-not-allowed text-white py-[12px] rounded-[5px] transition-all cursor-pointer"
      >
        <h3>내가해냄</h3>
      </button>
    </div>
  );
}
