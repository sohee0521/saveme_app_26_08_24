import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Prev from "../../components/Prev";
import Loading from "../../components/Loading"; // 🌟 로딩 컴포넌트 임포트
import { Calendar, Minus, Plus, Star } from "lucide-react";
import { calculateTaskStatus } from "../../utils/statusCalculator";
import PageTitle from "../../components/PageTitle"; // 🌟 페이지 타이틀 컴포넌트 임포트

const PRIORITY_LIST = ["보통", "중요", "최우선"];

// --- 숫자 입력 및 증감 조절기 컴포넌트 ---
function NumberStepper({ label, value, unit, min = 1, max = 99, onChange }) {
  const numValue = Number(value) || 0;

  const handleStep = (delta) => {
    const nextVal = Math.max(min, Math.min(max, numValue + delta));
    onChange(nextVal);
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange("");
      return;
    }
    const val = Number(raw);
    if (!isNaN(val)) {
      onChange(Math.min(max, val));
    }
  };

  const handleBlur = () => {
    if (!value || Number(value) < min) {
      onChange(min);
    }
  };

  return (
    <div className="w-full flex justify-between items-center">
      <PageTitle title="일정 추가" />
      <h3 className="text-black/60">{label}</h3>
      <div className="flex items-center gap-[10px]">
        {/* 감소 버튼 */}
        <button
          type="button"
          disabled={numValue <= min}
          onClick={() => handleStep(-1)}
          className="bg-primary disabled:bg-light-gray disabled:cursor-not-allowed w-[24px] h-[24px] rounded-full flex justify-center items-center cursor-pointer"
        >
          <Minus color="white" size={15} />
        </button>

        {/* 숫자 인풋 박스 */}
        <div className="w-[60px] h-[36px] bg-white rounded-[5px] p-[2px] flex items-center justify-center focus-within:ring-2 focus-within:ring-primary">
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-[28px] text-right text-[14px] font-medium outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-[14px] font-medium pl-[1px] select-none">
            {unit}
          </span>
        </div>

        {/* 증가 버튼 */}
        <button
          type="button"
          disabled={numValue >= max}
          onClick={() => handleStep(1)}
          className="bg-primary disabled:bg-light-gray disabled:cursor-not-allowed w-[24px] h-[24px] rounded-full flex justify-center items-center cursor-pointer"
        >
          <Plus color="white" size={15} />
        </button>
      </div>
    </div>
  );
}

// --- 메인 페이지 컴포넌트 ---
export default function AddSchedule() {
  const navigate = useNavigate();
  const { id } = useParams();
  const dateInputRef = useRef(null);

  const isEditMode = Boolean(id);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 🌟 로딩 상태 추가

  const [formData, setFormData] = useState({
    title: "",
    deadline: "",
    workDays: 1,
    workHours: 1,
    priority: "보통",
  });

  // 1. 수정 모드 시 기존 데이터 채우기
  useEffect(() => {
    if (!isEditMode) return;

    const stored = localStorage.getItem("doingTasks");
    if (stored) {
      const tasks = JSON.parse(stored);
      const current = tasks.find((t) => String(t.id) === String(id));
      if (current) {
        setFormData({
          title: current.title || "",
          deadline: current.deadline || "",
          workDays: current.workDays || 1,
          workHours: current.workHours || 1,
          priority: current.priority || "보통",
        });
      }
    }
  }, [id, isEditMode]);

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenPicker = () => {
    setIsFocused(true);
    dateInputRef.current?.showPicker?.();
  };

  const isFormValid =
    formData.title.trim() !== "" &&
    formData.deadline !== "" &&
    Number(formData.workDays) >= 1 &&
    Number(formData.workHours) >= 1;

  // 2. 저장 및 수정 처리 (로딩 딜레이 적용)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true); // 🌟 로딩 시작

    setTimeout(() => {
      const existingTasks = JSON.parse(
        localStorage.getItem("doingTasks") || "[]",
      );

      const totalHours = Number(formData.workDays) * Number(formData.workHours);

      if (isEditMode) {
        const updatedTasks = existingTasks.map((task) => {
          if (String(task.id) === String(id)) {
            const updated = {
              ...task,
              ...formData,
              title: formData.title.trim(),
              totalHours,
            };
            return calculateTaskStatus(updated);
          }
          return task;
        });

        localStorage.setItem("doingTasks", JSON.stringify(updatedTasks));
        navigate(`/schedule/${id}`);
      } else {
        const newTask = {
          id: Date.now(),
          ...formData,
          title: formData.title.trim(),
          totalHours,
          progress: 0,
          todayAdded: 0,
          createdAt: new Date().toISOString(),
        };

        const calculatedTask = calculateTaskStatus(newTask);
        localStorage.setItem(
          "doingTasks",
          JSON.stringify([...existingTasks, calculatedTask]),
        );
        navigate("/");
      }
    }, 600); // 0.6초간 자연스러운 로딩 후 페이지 이동
  };

  // 🌟 로딩 중일 때 로딩 화면 렌더링
  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-[20px] pt-[50px] pb-[40px] bg-background min-h-screen">
      <Prev title={isEditMode ? "일정 수정" : "일정 등록"} />

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-[30px] mt-[30px]"
      >
        {/* 1. 프로젝트 명 */}
        <div className="space-y-[8px]">
          <div className="flex gap-[5px]">
            <h2>어떤 프로젝트 인가요?</h2>
            {!formData.title.trim() && <h2 className="text-important">*</h2>}
          </div>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="프로젝트 명을 추가해주세요."
            className="bg-white p-[10px] w-full h-[44px] rounded-[5px] focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-[14px] placeholder:font-normal"
          />
        </div>

        {/* 2. 마감일 */}
        <div className="space-y-[8px]">
          <div className="flex gap-[5px]">
            <h2>언제까지 끝내야 하나요?</h2>
            {!formData.deadline && <h2 className="text-important">*</h2>}
          </div>
          <div
            onClick={handleOpenPicker}
            className={`bg-white px-[15px] w-full h-[44px] rounded-[5px] flex items-center justify-between cursor-pointer transition-all ${
              isFocused ? "ring-2 ring-primary" : ""
            }`}
          >
            <h4
              className={
                formData.deadline ? "text-black font-medium" : "text-dark-gray"
              }
            >
              {formData.deadline || "마감일을 선택해주세요"}
            </h4>
            <Calendar size={18} className="text-dark-gray" />
          </div>

          <input
            ref={dateInputRef}
            type="date"
            value={formData.deadline}
            onChange={(e) => {
              updateField("deadline", e.target.value);
              setIsFocused(false);
            }}
            onBlur={() => setIsFocused(false)}
            className="sr-only"
          />
        </div>

        {/* 3. 작업 시간 (작업 일수 + 하루 작업 시간) */}
        <div className="space-y-[15px]">
          <h2>얼마나 걸리나요?</h2>
          <div className="space-y-[10px] px-[10px]">
            <NumberStepper
              label="작업 일수"
              value={formData.workDays}
              unit="일"
              min={1}
              max={365}
              onChange={(val) => updateField("workDays", val)}
            />
            <NumberStepper
              label="하루 작업 시간"
              value={formData.workHours}
              unit="시간"
              min={1}
              max={20}
              onChange={(val) => updateField("workHours", val)}
            />
          </div>
        </div>

        {/* 4. 중요도 선택 */}
        <div className="space-y-[15px]">
          <h2>얼마나 중요한가요?</h2>
          <div className="flex justify-center items-center gap-[20px]">
            {PRIORITY_LIST.map((item, idx) => {
              const isSelected = formData.priority === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => updateField("priority", item)}
                  className={`flex justify-center items-center gap-[5px] px-[12px] py-[8px] rounded-full transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-secondary text-black"
                      : "bg-light-gray text-dark-gray"
                  }`}
                >
                  <h4>{item}</h4>
                  <div className="flex gap-[2px]">
                    {Array.from({ length: idx + 1 }).map((_, starIdx) => (
                      <Star key={starIdx} size={14} fill="currentColor" />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. 완료 버튼 */}
        <button
          type="submit"
          disabled={!isFormValid}
          className="bg-primary disabled:bg-light-gray disabled:text-dark-gray disabled:cursor-not-allowed text-white py-[14px] rounded-[5px] transition-all cursor-pointer mt-[10px]"
        >
          <h3>{isEditMode ? "수정하기" : "저장하기"}</h3>
        </button>
      </form>
    </div>
  );
}
