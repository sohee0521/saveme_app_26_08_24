import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Prev from "../../components/Prev";
import { Info } from "lucide-react";
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

  if (!task) {
    return (
      <div className="px-[20px] pt-[50px] pb-[40px] bg-background min-h-screen">
        <Prev title="미루기 예측" />
        <p className="mt-[30px] text-dark-gray text-center">
          일정을 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  // 미루기 시뮬레이션 일수 반영 계산
  const computed = calculateTaskStatus(task, postponedDays);
  const { status, image, message } = getStatusInfo(computed.status);
  const formattedWorkTime = formatWorkTime(computed.dailyRequiredHours);

  const handlePostpone = () => {
    if (computed.plannedProgress < 100) {
      setPostponedDays((prev) => prev + 1);
    }
  };

  const handleRevert = () => {
    if (postponedDays > 0) {
      setPostponedDays((prev) => prev - 1);
    }
  };

  return (
    <div className="px-[20px] pt-[50px] pb-[40px] bg-background min-h-screen space-y-[30px]">
      <Prev title="미루기 예측" />
      <div className="w-full flex justify-end relative">
        <Info color="var(--color-dark-gray)" strokeWidth={1.5} />
      </div>
      <div className="w-full flex flex-col justify-center items-center gap-[50px]">
        <div className="flex flex-col justify-center items-center gap-[1px]">
          <h2>{task.title}</h2>
          <h5 className="text-dark-gray">{message}</h5>
        </div>
        <div className="w-full flex flex-col justify-center items-center gap-[20px]">
          <div className="w-[120px] h-[120px]">
            <img src={image} alt={status} className="w-full h-full" />
          </div>
          <div className="flex gap-[5px]">
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
              <span className="text-important">{computed.remainingDays}일</span>{" "}
              <br />
              하루에 <span className="text-important">{formattedWorkTime}</span>
              씩 작업해요
            </h3>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="w-full flex gap-[10px]">
          <button
            type="button"
            onClick={handleRevert}
            disabled={postponedDays === 0}
            className="w-full bg-light-gray text-dark-gray disabled:opacity-40 disabled:cursor-not-allowed py-[12px] rounded-[5px] transition-all cursor-pointer"
          >
            <h3>되돌리기</h3>
          </button>
          <button
            type="button"
            onClick={handlePostpone}
            disabled={computed.plannedProgress >= 100}
            className="w-full bg-primary disabled:bg-light-gray disabled:text-dark-gray disabled:opacity-40 disabled:cursor-not-allowed text-white py-[12px] rounded-[5px] transition-all cursor-pointer"
          >
            <h3>미루기</h3>
          </button>
        </div>
      </div>
    </div>
  );
}
