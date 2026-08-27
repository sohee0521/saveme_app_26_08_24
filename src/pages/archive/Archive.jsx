import { useState, useMemo, useEffect } from "react";
import { Clock8, Star } from "lucide-react";
import Loading from "../../components/Loading";
import vector1 from "../../img/vector1.svg";
import vector3 from "../../img/vector3.svg";
import vector4 from "../../img/vector4.svg";
import PageTitle from "../../components/PageTitle";

const STYLE_IMAGE_MAP = {
  계획대로: vector1,
  빠듯하게: vector3,
  극적으로: vector4,
};

const STYLE_COMMENT_MAP = {
  계획대로: "여유만만 파워 J형",
  빠듯하게: "스릴 만점 벼락치기러",
  극적으로: "마감 직전 초능력 발휘",
};

const FILTER_TABS = ["전체", "계획대로", "빠듯하게", "극적으로"];

// 1. 일반 데이터용 중심 좌표 설정
const BUBBLE_CONFIGS = [
  {
    center: { x: 105, y: 74 },
    bgColor: "bg-primary",
    textColor: "text-white",
    zIndex: "z-30",
    textStyle: "text-[12px] font-bold text-primary",
    getLabelPosition: (size, center) => ({
      top: `${center.y}px`,
      left: `${center.x + size / 2 + 8}px`,
      transform: "translateY(-50%)",
    }),
  },
  {
    center: { x: 80, y: 134 },
    bgColor: "bg-secondary/40",
    textColor: "text-primary",
    zIndex: "z-20",
    textStyle: "text-[12px] font-medium text-dark-gray",
    getLabelPosition: (size, center) => ({
      top: `${center.y}px`,
      left: `${center.x - size / 2 - 8}px`,
      transform: "translate(-100%, -50%)",
    }),
  },
  {
    center: { x: 130, y: 134 },
    bgColor: "bg-[#EAEAEA]",
    textColor: "text-dark-gray",
    zIndex: "z-10",
    textStyle: "text-[12px] font-medium text-dark-gray",
    getLabelPosition: (size, center) => ({
      top: `${center.y}px`,
      left: `${center.x + size / 2 + 8}px`,
      transform: "translateY(-50%)",
    }),
  },
];

// 🌟 2. 0%일 때 적당히 맞물리도록 간격을 살짝 벌린 중심 좌표 설정
const EMPTY_BUBBLE_CONFIGS = [
  {
    center: { x: 105, y: 80 }, // 상단 원 살짝 위로 (88 -> 80)
    bgColor: "bg-primary",
    textColor: "text-white",
    zIndex: "z-30",
    textStyle: "text-[12px] font-bold text-primary",
    getLabelPosition: (size, center) => ({
      top: `${center.y}px`,
      left: `${center.x + size / 2 + 8}px`,
      transform: "translateY(-50%)",
    }),
  },
  {
    center: { x: 82, y: 128 }, // 좌하단 원 살짝 바깥쪽 아래로 (88, 122 -> 82, 128)
    bgColor: "bg-secondary/40",
    textColor: "text-primary",
    zIndex: "z-20",
    textStyle: "text-[12px] font-medium text-dark-gray",
    getLabelPosition: (size, center) => ({
      top: `${center.y}px`,
      left: `${center.x - size / 2 - 8}px`,
      transform: "translate(-100%, -50%)",
    }),
  },
  {
    center: { x: 128, y: 128 }, // 우하단 원 살짝 바깥쪽 아래로 (122, 122 -> 128, 128)
    bgColor: "bg-[#EAEAEA]",
    textColor: "text-dark-gray",
    zIndex: "z-10",
    textStyle: "text-[12px] font-medium text-dark-gray",
    getLabelPosition: (size, center) => ({
      top: `${center.y}px`,
      left: `${center.x + size / 2 + 8}px`,
      transform: "translateY(-50%)",
    }),
  },
];

export default function Archive() {
  const [doneTasks, setDoneTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("전체");

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem("doneTasks");
        setDoneTasks(stored ? JSON.parse(stored) : []);
      } catch {
        setDoneTasks([]);
      }
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const resolveStyle = (task) => {
    const val = task.style || task.status;
    if (val === "빠듯하게" || val === "긴장") return "빠듯하게";
    if (val === "극적으로" || val === "위기" || val === "파멸")
      return "극적으로";
    return "계획대로";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "2026.00.00";
    return String(dateStr).split("T")[0].replace(/-/g, ".");
  };

  const getBubbleSize = (percent, total) => {
    if (total === 0) return 58;
    const min = 58;
    const max = 112;
    return Math.max(min, Math.min(max, min + percent * 0.54));
  };

  const getStarCount = (priority) => {
    if (priority === "최우선") return 3;
    if (priority === "중요") return 2;
    return 1;
  };

  const { topVectorImg, topComment, topStyleName, bubbleItems, totalCount } =
    useMemo(() => {
      const total = doneTasks.length;
      const counts = { 계획대로: 0, 빠듯하게: 0, 극적으로: 0 };

      doneTasks.forEach((task) => {
        const styleName = resolveStyle(task);
        counts[styleName] += 1;
      });

      const percentages = {
        계획대로:
          total > 0 ? Math.round((counts["계획대로"] / total) * 100) : 0,
        빠듯하게:
          total > 0 ? Math.round((counts["빠듯하게"] / total) * 100) : 0,
        극적으로:
          total > 0 ? Math.round((counts["극적으로"] / total) * 100) : 0,
      };

      const sortedStyleNames = Object.keys(percentages).sort(
        (a, b) => percentages[b] - percentages[a],
      );

      const activeConfigs = total === 0 ? EMPTY_BUBBLE_CONFIGS : BUBBLE_CONFIGS;

      const bubbleItems = sortedStyleNames.map((name, index) => {
        const percent = percentages[name];
        const config = activeConfigs[index];
        const size = getBubbleSize(percent, total);

        return {
          name,
          percent,
          size,
          ...config,
        };
      });

      const topStyleName = sortedStyleNames[0];
      const topVectorImg = STYLE_IMAGE_MAP[topStyleName] || vector1;
      const topComment =
        total === 0
          ? "일정을 완료해 보세요!"
          : STYLE_COMMENT_MAP[topStyleName] || "여유만만 파워 J형";

      return {
        topVectorImg,
        topComment,
        topStyleName: total === 0 ? "없음" : topStyleName,
        bubbleItems,
        totalCount: total,
      };
    }, [doneTasks]);

  const filteredTasks = useMemo(() => {
    const sorted = [...doneTasks].reverse();
    if (selectedFilter === "전체") return sorted;
    return sorted.filter((task) => resolveStyle(task) === selectedFilter);
  }, [doneTasks, selectedFilter]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="w-full mx-auto h-screen bg-background flex flex-col px-[20px] pt-[70px] gap-[40px] overflow-hidden">
      <PageTitle title="아카이브" />
      {/* 1. 상단 타이틀 */}
      <header className="flex flex-col gap-[5px] shrink-0">
        <h1 className="text-primary">Archive</h1>
        <h4 className="text-dark-gray">
          해낸 일정들과 나의 미루기 습관을 돌아봐요.
        </h4>
      </header>

      {/* 2. 통계 카드 섹션 */}
      <section className="flex flex-col gap-[15px] shrink-0">
        <div className="flex items-center justify-between">
          <h2>나의 일정 소화 스타일은?</h2>
          <h5 className="text-dark-gray">
            총 <strong className="text-primary">{totalCount}</strong>개 완료
          </h5>
        </div>

        <div className="w-full bg-white rounded-[10px] px-[25px] py-[10px] flex items-center justify-between min-h-[200px] relative overflow-hidden">
          {/* 좌측: 뱃지 + 캐릭터 + 요약 멘트 */}
          <div className="flex flex-col items-center justify-center gap-[4px] shrink-0 z-20 w-[100px]">
            <h5 className="px-[12px] py-[5px] bg-secondary/40 text-primary !font-bold rounded-full">
              {totalCount === 0 ? "데이터 없음" : `1위 ${topStyleName}`}
            </h5>

            <div className="w-[70px] h-[75px] flex items-center justify-center">
              <img
                src={topVectorImg}
                alt="1위 스타일 캐릭터"
                className="w-full h-full object-contain"
              />
            </div>

            <h5 className="text-center whitespace-nowrap">{topComment}</h5>
          </div>

          {/* 우측: 3개 원 + 텍스트 라벨 영역 */}
          <div className="relative w-[210px] h-[190px] shrink-0 flex items-center justify-center">
            {bubbleItems.map((bubble) => (
              <div key={bubble.name}>
                {/* 원형 버블 */}
                <div
                  className={`absolute rounded-full flex items-center justify-center ${bubble.bgColor} mix-blend-multiply ${bubble.zIndex} transition-all duration-300 -translate-x-1/2 -translate-y-1/2`}
                  style={{
                    left: `${bubble.center.x}px`,
                    top: `${bubble.center.y}px`,
                    width: `${bubble.size}px`,
                    height: `${bubble.size}px`,
                  }}
                >
                  <h4 className={`!font-bold ${bubble.textColor}`}>
                    {bubble.percent}%
                  </h4>
                </div>

                {/* 스타일 이름 라벨 */}
                <span
                  className={`absolute z-30 pointer-events-none whitespace-nowrap transition-all duration-300 ${bubble.textStyle}`}
                  style={bubble.getLabelPosition(bubble.size, bubble.center)}
                >
                  {bubble.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 소화해낸 일정 리스트 섹션 */}
      <section className="flex-1 flex flex-col min-h-0 pb-[55px] gap-[15px]">
        <div className="flex flex-col gap-[12px] shrink-0">
          <h2>소화해낸 일정 모아보기</h2>

          {/* 스타일 분류 캡슐 버튼 바 */}
          <div className="flex items-center gap-[8px] overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {FILTER_TABS.map((tab) => {
              const isActive = selectedFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedFilter(tab)}
                  className={`px-[14px] py-[6px] rounded-full text-[13px] font-semibold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-primary text-white shadow-xs"
                      : "bg-light-gray/50 text-dark-gray"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="w-full rounded-[10px] p-[30px] flex flex-col items-center justify-center text-center">
            <h5 className="text-dark-gray">
              {selectedFilter === "전체"
                ? "아직 완료된 일정이 없습니다."
                : `'${selectedFilter}' 스타일로 완료된 일정이 없습니다.`}
            </h5>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col gap-[10px] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {filteredTasks.map((task, idx) => {
              const taskStyle = resolveStyle(task);
              const taskImg = STYLE_IMAGE_MAP[taskStyle];
              const startDisplay = formatDate(task.startDate || task.createdAt);
              const completedDisplay = formatDate(
                task.completedAt || task.doneDate || task.deadline,
              );

              return (
                <div
                  key={`${task.id}-${idx}`}
                  className="w-full bg-white rounded-[14px] p-[16px] flex items-center justify-between border border-light-gray/40 shrink-0"
                >
                  <div className="flex flex-col gap-[6px]">
                    <div className="flex items-center gap-[4px] text-dark-gray">
                      <Clock8 size={13} color="#757575" />
                      <h5 className="text-[12px]">
                        {startDisplay} ~ {completedDisplay}
                      </h5>
                    </div>

                    <div className="flex items-center gap-[5px]">
                      <h3 className="text-black">{task.title}</h3>
                      <div className="flex gap-[2px]">
                        {Array.from({
                          length: getStarCount(task.priority),
                        }).map((_, starIdx) => (
                          <Star
                            key={starIdx}
                            size={11}
                            color="var(--color-important)"
                            fill="var(--color-important)"
                          />
                        ))}
                      </div>
                    </div>

                    <h5 className="text-primary font-bold text-[13px]">
                      Completed!
                    </h5>
                  </div>

                  <div className="w-[52px] h-[52px] flex items-center justify-center">
                    <img
                      src={taskImg}
                      alt="완료 캐릭터"
                      className="w-full h-full object-contain color-primary"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
