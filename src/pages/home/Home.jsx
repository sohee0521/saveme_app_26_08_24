import { Link } from "react-router-dom";
import { Plus, Check, ListFilter, Clock8, Star, Minus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Loading from "../../components/Loading"; // 🌟 로딩 컴포넌트 임포트
import {
  calculateTaskStatus,
  getStatusImage,
} from "../../utils/statusCalculator";
import PageTitle from "../../components/PageTitle";

// --- 헬퍼 함수 및 상수 (컴포넌트 외부 분리) ---
const SORT_OPTIONS = ["마감 임박순", "중요도순", "위험도순"];

const STATUS_SCORE_MAP = {
  파멸: 4,
  위기: 3,
  긴장: 2,
  여유: 1,
};

const STATUS_BG_MAP = {
  위기: "bg-warning/20",
  파멸: "bg-important/20",
};

const getTodayString = () => {
  return new Date().toISOString().split("T")[0];
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

// --- 메인 컴포넌트 ---
export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [sortType, setSortType] = useState("마감 임박순");
  const [isLoading, setIsLoading] = useState(true); // 🌟 로딩 상태 추가 (초기값 true)

  // 1. 초기 데이터 불러오기 및 날짜 갱신
  useEffect(() => {
    const timer = setTimeout(() => {
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
      setIsLoading(false); // 🌟 로딩 완료
    }, 400); // 0.4초간 자연스러운 로딩 후 렌더링

    return () => clearTimeout(timer);
  }, []);

  // 2. 하루 작업량(진행률) 변경 (+5%, -5%)
  const handleProgressChange = (id, delta) => {
    const today = getTodayString();

    const updatedTasks = tasks.map((task) => {
      if (task.id !== id) return task;

      const currentProgress = task.progress || 0;
      const currentToday = task.todayAdded || 0;

      // 증가 시 100% 초과 방지, 감소 시 0% 미만 및 오늘 추가분 초과 감소 방지
      let nextProgress = currentProgress + delta;
      let nextToday = currentToday + delta;

      if (delta > 0) {
        if (currentProgress >= 100) return task;
        if (nextProgress > 100) {
          nextToday = currentToday + (100 - currentProgress);
          nextProgress = 100;
        }
      } else {
        if (currentToday <= 0 || currentProgress <= 0) return task;
        if (nextToday < 0) {
          nextProgress = currentProgress - currentToday;
          nextToday = 0;
        }
      }

      const updatedTask = {
        ...task,
        todayAdded: nextToday,
        progress: nextProgress,
        lastUpdatedDate: today,
      };

      return calculateTaskStatus(updatedTask);
    });

    setTasks(updatedTasks);
    localStorage.setItem("doingTasks", JSON.stringify(updatedTasks));
  };

  // 3. 정렬 목록 계산
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (sortType === "마감 임박순") {
        const timeA = new Date(a.deadline || "9999-12-31").getTime();
        const timeB = new Date(b.deadline || "9999-12-31").getTime();
        return timeA - timeB;
      }
      if (sortType === "중요도순") {
        return getStarCount(b.priority) - getStarCount(a.priority);
      }
      if (sortType === "위험도순") {
        const scoreA = STATUS_SCORE_MAP[a.status] || 1;
        const scoreB = STATUS_SCORE_MAP[b.status] || 1;
        return scoreB - scoreA;
      }
      return 0;
    });
  }, [tasks, sortType]);

  // 🌟 로딩 중일 때 로딩 화면 렌더링
  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-background">
      <PageTitle title="홈" />
      {/* 1. 상단 블랙 헤더 (고정) */}
      <header className="w-full bg-black shrink-0 flex flex-col px-[20px] pt-[100px] pb-[20px] gap-[10px]">
        <div className="flex flex-col gap-[5px]">
          <h1 className="text-secondary">SAVE ME</h1>
          <h4 className="text-white">내일의 나를 구하는 가장 빠른 걸음</h4>
        </div>
        <Link to="/add-schedule" className="w-fit">
          <div className="w-fit flex items-center gap-[5px] px-[10px] py-[5px] rounded-[5px] border border-white">
            <Plus size={20} color="white" />
            <h3 className="text-white">New</h3>
          </div>
        </Link>
      </header>

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

          {isOpen && (
            <div className="absolute right-0 top-[40px] z-50 bg-white w-[120px] rounded-[5px] shadow-xl flex flex-col border border-light-gray overflow-hidden">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSortType(option);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-[10px] transition-colors cursor-pointer ${
                    sortType === option
                      ? "text-primary font-bold bg-secondary/20"
                      : "text-black"
                  }`}
                >
                  <h4>{option}</h4>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. 할 일 카드 목록 영역 (내부 스크롤) */}
      <div className="flex-1 px-[20px] pb-[100px] flex flex-col gap-[10px] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {sortedTasks.length === 0 ? (
          <div className="w-full bg-white rounded-[10px] p-[30px] flex flex-col items-center justify-center text-center mt-[20px] border border-light-gray/40">
            <h5 className="text-dark-gray">현재 진행 중인 일정이 없습니다.</h5>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const cardBgClass = STATUS_BG_MAP[task.status] || "bg-white";
            const starCount = getStarCount(task.priority);
            const progress = task.progress || 0;
            const todayAdded = task.todayAdded || 0;

            return (
              <Link to={`/schedule/${task.id}`} key={task.id}>
                <div
                  className={`p-[15px] rounded-[10px] space-y-[15px] transition-colors duration-300 ${cardBgClass}`}
                >
                  {/* 날짜 & D-Day */}
                  <div className="flex items-center gap-[10px]">
                    <div className="flex items-center gap-[5px]">
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

                  {/* 우선순위 별, 제목 & 캐릭터 이미지 */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex gap-[2px] mb-[5px]">
                        {Array.from({ length: starCount }).map((_, idx) => (
                          <Star
                            key={idx}
                            size={12}
                            color="var(--color-important)"
                            fill="var(--color-important)"
                          />
                        ))}
                      </div>
                      <h2>{task.title}</h2>
                    </div>
                    <div className="w-[48px] h-[48px] shrink-0">
                      <img
                        src={getStatusImage(task.status)}
                        alt={task.status || "여유"}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* 하루 작업량 조절 */}
                  <div className="flex justify-between items-center">
                    <h4 className="text-dark-gray">하루 작업량</h4>
                    <div className="w-fit flex items-center gap-[5px]">
                      <button
                        type="button"
                        disabled={todayAdded <= 0 || progress <= 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleProgressChange(task.id, -5);
                        }}
                        className="relative bg-black disabled:opacity-30 disabled:cursor-not-allowed w-[24px] h-[24px] rounded-full flex justify-center items-center cursor-pointer after:content-[''] after:absolute after:inset-[-10px]"
                      >
                        <Minus color="white" size={15} />
                      </button>

                      <h4 className="w-[40px] h-[24px] flex justify-center items-center bg-transparent rounded-[5px] text-center">
                        {todayAdded}%
                      </h4>

                      <button
                        type="button"
                        disabled={progress >= 100}
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

                  {/* 전체 진행률 게이지 바 */}
                  <div className="flex justify-between items-center">
                    <h4 className="text-dark-gray">작업률</h4>
                    <div className="flex items-center gap-[10px]">
                      <div className="h-[7px] w-[200px] bg-light-gray rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <h5 className="w-[30px] text-right">{progress}%</h5>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
