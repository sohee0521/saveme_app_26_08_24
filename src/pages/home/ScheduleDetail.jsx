import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Prev from "../../components/Prev";
import Loading from "../../components/Loading"; // 🌟 로딩 컴포넌트 임포트
import {
  Star,
  ArrowRight,
  Minus,
  Plus,
  X,
  MoreVertical,
  Trash2,
  Edit2,
} from "lucide-react";
import vector5 from "../../img/Vector5.svg";
import {
  calculateTaskStatus,
  getStatusImage,
} from "../../utils/statusCalculator";
import PageTitle from "../../components/PageTitle";

// --- 헬퍼 함수 및 상수 ---
const REVIEW_OPTIONS = ["계획대로", "빠듯했지만", "극적으로"];

const calculateDday = (deadlineStr) => {
  if (!deadlineStr) return "D-00";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(deadlineStr);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "D-Day";
  if (diffDays < 0) return `D+${Math.abs(diffDays)}`;
  return `D-${diffDays}`;
};

const getStarCount = (priority) => {
  if (priority === "최우선") return 3;
  if (priority === "중요") return 2;
  return 1;
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
            style={{ width: `${value || 0}%` }}
          />
        </div>
        <h5 className="w-[35px] text-right">{value || 0}%</h5>
      </div>
    </div>
  );
}

// --- 메인 컴포넌트 ---
export default function ScheduleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // 🌟 로딩 상태 추가

  // 모달 및 메뉴 상태
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState("계획대로");

  // 1. Task 데이터 로드
  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem("doingTasks");
      if (stored) {
        const tasks = JSON.parse(stored);
        const current = tasks.find((t) => String(t.id) === String(id));
        if (current) {
          setTask(calculateTaskStatus(current));
        }
      }
      setIsLoading(false); // 🌟 로딩 완료
    }, 400);

    return () => clearTimeout(timer);
  }, [id]);

  // 2. 하루 작업량(진행률) 변경 핸들러
  const handleProgressChange = (taskId, delta) => {
    const stored = localStorage.getItem("doingTasks");
    if (!stored) return;

    const tasks = JSON.parse(stored);
    let updatedCurrentTask = null;

    const updatedTasks = tasks.map((t) => {
      if (String(t.id) !== String(taskId)) return t;

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

      const updated = calculateTaskStatus({
        ...t,
        todayAdded: nextToday,
        progress: nextTotal,
      });

      updatedCurrentTask = updated;
      return updated;
    });

    if (updatedCurrentTask) {
      localStorage.setItem("doingTasks", JSON.stringify(updatedTasks));
      setTask(updatedCurrentTask);
    }
  };

  // 3. 삭제 처리
  const handleDeleteTask = () => {
    if (!task) return;
    const stored = localStorage.getItem("doingTasks");
    if (stored) {
      const tasks = JSON.parse(stored);
      const filtered = tasks.filter((t) => String(t.id) !== String(task.id));
      localStorage.setItem("doingTasks", JSON.stringify(filtered));
    }
    setIsDeleteModalOpen(false);
    navigate("/");
  };

  // 4. 완료 처리
  const handleSaveCompletion = () => {
    if (!task) return;

    // doingTasks에서 제거
    const doingStored = localStorage.getItem("doingTasks");
    if (doingStored) {
      const doingTasks = JSON.parse(doingStored);
      const filtered = doingTasks.filter(
        (t) => String(t.id) !== String(task.id),
      );
      localStorage.setItem("doingTasks", JSON.stringify(filtered));
    }

    // doneTasks에 추가
    const doneStored = localStorage.getItem("doneTasks");
    const doneTasks = doneStored ? JSON.parse(doneStored) : [];
    const completedTask = {
      ...task,
      progress: 100,
      completedAt: new Date().toISOString(),
      completionReview: selectedReview,
    };

    localStorage.setItem(
      "doneTasks",
      JSON.stringify([completedTask, ...doneTasks]),
    );
    setIsCompleteModalOpen(false);
    navigate("/");
  };

  // 🌟 로딩 중일 때 로딩 화면 렌더링
  if (isLoading) {
    return <Loading />;
  }

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

  const formattedDeadline = task.deadline
    ? task.deadline.replace(/-/g, ".")
    : "2026.00.00";
  const ddayText = calculateDday(task.deadline);
  const starCount = getStarCount(task.priority);

  return (
    <div className="relative px-[20px] pt-[50px] pb-[40px] bg-background min-h-screen space-y-[40px]">
      <PageTitle title="일정 상세" />
      {/* 1. 상단 헤더 & 더보기 메뉴 */}
      <div className="flex justify-between items-center relative z-30">
        <Prev title="일정" />
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-[4px] cursor-pointer text-dark-gray"
          >
            <MoreVertical size={20} />
          </button>

          {isMenuOpen && (
            <>
              <div
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 z-40"
              />
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-[30px] z-50 bg-white rounded-[8px] shadow-xs border border-light-gray w-[100px] flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate(`/edit-schedule/${task.id}`, { state: { task } });
                  }}
                  className="flex items-center gap-[8px] px-[12px] py-[8px] hover:bg-secondary text-left cursor-pointer"
                >
                  <Edit2 size={14} />
                  <h4>수정</h4>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                  className="flex items-center gap-[8px] px-[12px] py-[8px] hover:bg-secondary text-left text-important cursor-pointer"
                >
                  <Trash2 size={14} />
                  <h4>삭제</h4>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. 본문 정보 영역 */}
      <div className="space-y-[25px]">
        <h2>{task.title}</h2>

        {/* 마감일 */}
        <div className="flex gap-[20px] items-center">
          <h3>마감일</h3>
          <div className="flex items-center gap-[10px]">
            <h4 className="text-dark-gray">{formattedDeadline}</h4>
            <div className="bg-secondary w-fit px-[7px] h-[22px] flex justify-center items-center">
              <h5>{ddayText}</h5>
            </div>
          </div>
        </div>

        {/* 중요도 */}
        <div className="flex gap-[20px] items-center">
          <h3>중요도</h3>
          <div className="flex gap-[2px]">
            {Array.from({ length: starCount }).map((_, idx) => (
              <Star
                key={idx}
                size={14}
                color="var(--color-important)"
                fill="var(--color-important)"
              />
            ))}
          </div>
        </div>

        {/* 진척도 섹션 */}
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
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex gap-[5px]">
              <h4 className="text-dark-gray">상태</h4>
              <h3>{task.status || "여유"}</h3>
            </div>

            {/* 게이지 바 영역 */}
            <div className="space-y-[5px] w-full max-w-[280px]">
              <ProgressBar
                label="계획"
                value={task.plannedProgress}
                barColor="bg-dark-gray"
              />
              <ProgressBar
                label="현재"
                value={task.progress}
                barColor="bg-primary"
              />
            </div>
          </div>
        </div>

        {/* 하루 작업량 조절 */}
        <div className="flex justify-between items-center pt-[10px]">
          <h3>하루 작업량</h3>
          <div className="w-fit flex items-center gap-[5px]">
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

      {/* 내가해냄 버튼 */}
      <button
        type="button"
        onClick={() => setIsCompleteModalOpen(true)}
        className="w-full bg-primary disabled:bg-light-gray disabled:text-dark-gray disabled:cursor-not-allowed text-white py-[12px] rounded-[5px] transition-all cursor-pointer"
      >
        <h3>내가해냄</h3>
      </button>

      {/* 3. 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <div
          onClick={() => setIsDeleteModalOpen(false)}
          className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center px-[20px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[300px] rounded-[12px] px-[20px] py-[25px] flex flex-col items-center gap-[15px] shadow-xl"
          >
            <div className="text-center">
              <h3>일정을 삭제할까요?</h3>
              <h5 className="text-dark-gray">
                삭제된 일정은 복구할 수 없어요.
              </h5>
            </div>
            <div className="flex gap-[10px] w-full pt-[5px]">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full bg-light-gray text-dark-gray py-[10px] rounded-[8px] cursor-pointer"
              >
                <h4>취소</h4>
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                className="w-full bg-important text-white py-[10px] rounded-[8px] cursor-pointer"
              >
                <h4>삭제</h4>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 완주 성공 모달 */}
      {isCompleteModalOpen && (
        <div
          onClick={() => setIsCompleteModalOpen(false)}
          className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center px-[20px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[320px] rounded-[16px] p-[20px] flex flex-col items-center gap-[10px] shadow-xl relative"
          >
            <div className="w-full text-right">
              <button
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
                className="text-black cursor-pointer"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex flex-col items-center gap-[2px]">
              <h4 className="text-dark-gray">오늘도 멋지게 완주 성공!</h4>
              <h3>이번 일정은 어떻게 해내셨나요?</h3>
            </div>

            <div className="w-[80px] h-[80px] flex justify-center items-center my-[10px]">
              <img
                src={vector5}
                alt="완주 아이콘"
                className="w-full h-full object-contain"
              />
            </div>

            {/* 완주 리뷰 선택 탭 */}
            <div className="flex gap-[8px] w-full justify-center">
              {REVIEW_OPTIONS.map((option) => {
                const isSelected = selectedReview === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelectedReview(option)}
                    className={`px-[12px] py-[7px] rounded-full transition-all cursor-pointer ${
                      isSelected
                        ? "bg-secondary/70 text-primary"
                        : "bg-light-gray text-dark-gray"
                    }`}
                  >
                    <h5>{option}</h5>
                  </button>
                );
              })}
            </div>

            <h4 className="text-primary py-[5px]">
              {selectedReview} 내가 해냄!
            </h4>

            <button
              type="button"
              onClick={handleSaveCompletion}
              className="w-full bg-primary text-white py-[12px] rounded-[10px] cursor-pointer transition-all hover:opacity-90"
            >
              <h3>저장</h3>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
