import { Link } from "react-router-dom";
import { Plus, Check, ListFilter, Clock8, Star, Minus } from "lucide-react";
import { useState, useEffect } from "react";
import {
  calculateTaskStatus,
  getStatusImage,
} from "../../utils/statusCalculator";

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const getTodayString = () => {
    return new Date().toISOString().split("T")[0];
  };

  useEffect(() => {
    const stored = localStorage.getItem("doingTasks");
    if (stored) {
      const today = getTodayString();
      const parsed = JSON.parse(stored).map((task) => {
        const isNewDay = task.lastUpdatedDate !== today;
        const baseTask = {
          ...task,
          todayAdded: isNewDay ? 0 : task.todayAdded || 0,
          lastUpdatedDate: isNewDay ? today : task.lastUpdatedDate || today,
        };
        return calculateTaskStatus(baseTask);
      });
      setTasks(parsed);
      localStorage.setItem("doingTasks", JSON.stringify(parsed));
    }
  }, []);

  const handleProgressChange = (id, delta) => {
    const today = getTodayString();
    const updated = tasks.map((task) => {
      if (task.id === id) {
        const currentProgress = task.progress || 0;
        const currentToday = task.todayAdded || 0;

        if (delta > 0 && currentProgress >= 100) return task;
        if (delta < 0 && (currentToday <= 0 || currentProgress <= 0))
          return task;

        const actualDelta =
          delta > 0
            ? Math.min(delta, 100 - currentProgress)
            : Math.max(delta, -currentToday);

        if (actualDelta === 0) return task;

        const nextToday = Math.max(0, currentToday + actualDelta);
        const nextTotal = Math.min(
          100,
          Math.max(0, currentProgress + actualDelta),
        );

        const updatedTask = {
          ...task,
          todayAdded: nextToday,
          progress: nextTotal,
          lastUpdatedDate: today,
        };

        return calculateTaskStatus(updatedTask);
      }
      return task;
    });

    setTasks(updated);
    localStorage.setItem("doingTasks", JSON.stringify(updated));
  };

  const calculateDday = (deadlineStr) => {
    if (!deadlineStr) return "D-00";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(deadlineStr);
    target.setHours(0, 0, 0, 0);

    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "D-Day";
    if (diff < 0) return `D+${Math.abs(diff)}`;
    return `D-${diff}`;
  };

  const getStarCount = (priority) => {
    if (priority === "최우선") return 3;
    if (priority === "중요") return 2;
    return 1;
  };

  const handleSelect = (option) => {
    setIsOpen(false);
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-background">
      {/* 1. 상단 블랙 헤더 (고정) */}
      <div className="w-full bg-black shrink-0 flex flex-col px-[20px] pt-[70px] pb-[20px] gap-[10px]">
        <div className="flex flex-col gap-[5px]">
          <h1 className="text-secondary">SAVE ME</h1>
          <h4 className="text-white">내일의 나를 구하는 가장 빠른 걸음</h4>
        </div>
        <Link to="/add-schedule">
          <div className="w-fit flex items-center gap-[5px] px-[10px] py-[5px] rounded-[5px] border-[1px] border-white">
            <Plus size={20} color="white" />
            <button className="text-white">
              <h3>New</h3>
            </button>
          </div>
        </Link>
      </div>

      {/* 2. 타이틀 및 필터 헤더 (고정) */}
      <div className="w-full px-[20px] pt-[20px] pb-[10px] bg-background shrink-0 flex justify-between items-center z-20">
        <div className="flex items-center gap-[2px]">
          <Check size={20} />
          <h2>To Do List</h2>
        </div>

        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="bg-black w-[32px] h-[32px] flex items-center justify-center rounded-full z-10 relative cursor-pointer"
          >
            <ListFilter size={16} color="white" strokeWidth={3} />
          </button>

          {isOpen && (
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
          )}

          <div
            className={`absolute right-0 top-[40px] z-50 ${
              isOpen ? "flex" : "hidden"
            }`}
          >
            <div className="bg-white w-[120px] rounded-[5px] shadow-xl flex flex-col border border-light-gray overflow-hidden">
              <button
                type="button"
                onClick={() => handleSelect("마감 임박순")}
                className="w-full text-left p-[10px] text-black hover:bg-light-gray transition-colors"
              >
                <h4>마감 임박순</h4>
              </button>
              <button
                type="button"
                onClick={() => handleSelect("중요도순")}
                className="w-full text-left p-[10px] text-black hover:bg-light-gray transition-colors"
              >
                <h4>중요도순</h4>
              </button>
              <button
                type="button"
                onClick={() => handleSelect("위험도순")}
                className="w-full text-left p-[10px] text-black hover:bg-light-gray transition-colors"
              >
                <h4>위험도순</h4>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 할 일 카드 목록 영역 (단독 스크롤) */}
      <div className="flex-1 px-[20px] pb-[40px] flex flex-col gap-[10px] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {tasks.map((task) => (
          <Link to={`/schedule/${task.id}`} key={task.id}>
            <div className="bg-white p-[15px] rounded-[10px] space-y-[15px]">
              <div className="flex items-center gap-[10px]">
                <div className="flex justify-center items-center gap-[5px]">
                  <Clock8 size={15} color="#757575" />
                  <h5 className="text-dark-gray">
                    {task.deadline
                      ? task.deadline.replace(/-/g, ".")
                      : "2026.00.00"}
                  </h5>
                </div>
                <div className="bg-secondary w-fit px-[5px] h-[16px] flex justify-center items-center">
                  <h6>{calculateDday(task.deadline)}</h6>
                </div>
              </div>

              <div className="flex justify-between">
                <div>
                  <div className="flex gap-[2px] space-y-[5px]">
                    {Array.from({ length: getStarCount(task.priority) }).map(
                      (_, idx) => (
                        <Star
                          key={idx}
                          size={12}
                          color="var(--color-important)"
                          fill="var(--color-important)"
                        />
                      ),
                    )}
                  </div>
                  <h2>{task.title}</h2>
                </div>
                <div className="w-[48px] h-[48px]">
                  <img
                    src={getStatusImage(task.status)}
                    alt={task.status || "여유"}
                    className="w-full h-full"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h4 className="text-dark-gray">하루 작업량</h4>
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
                  <h4 className="w-[40px] h-[24px] flex justify-center items-center bg-white rounded-[5px] text-center">
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

              <div className="flex justify-between items-center">
                <h4 className="text-dark-gray">작업률</h4>
                <div className="flex justify-between items-center gap-[10px]">
                  <div className="h-[7px] w-[200px] bg-light-gray rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${task.progress || 0}%` }}
                    />
                  </div>
                  <h5 className="w-[30px] text-right">{task.progress || 0}%</h5>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
