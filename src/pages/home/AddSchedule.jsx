import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Prev from "../../components/Prev";
import { Calendar, Minus, Plus, Star } from "lucide-react";
import { calculateTaskStatus } from "../../utils/statusCalculator";

export default function AddSchedule() {
  const navigate = useNavigate();
  const { id } = useParams(); // 수정 모드일 때 id 존재
  const location = useLocation();
  const dateInputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const isEditMode = Boolean(id);

  // 폼 입력 상태
  const [formData, setFormData] = useState({
    title: "",
    deadline: "",
    workDays: 1,
    workHours: 1,
    priority: "보통",
  });

  // 수정 모드 진입 시 기존 데이터 채우기
  useEffect(() => {
    if (isEditMode) {
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
    }
  }, [id, isEditMode]);

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenPicker = () => {
    setIsFocused(true);
    if (dateInputRef.current) {
      dateInputRef.current.showPicker?.();
    }
  };

  // 유효성 검사
  const isFormValid =
    formData.title.trim() !== "" &&
    formData.deadline !== "" &&
    formData.workDays >= 1 &&
    formData.workHours >= 1;

  // 로컬스토리지 저장/수정 처리
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const existingTasks = JSON.parse(
      localStorage.getItem("doingTasks") || "[]",
    );

    if (isEditMode) {
      // 🌟 [수정 모드] 기존 id 대상 업데이트 및 상태 재계산
      const updatedTasks = existingTasks.map((task) => {
        if (String(task.id) === String(id)) {
          const updated = {
            ...task,
            ...formData,
            title: formData.title.trim(),
            totalHours: Number(formData.workDays) * Number(formData.workHours),
          };
          return calculateTaskStatus(updated);
        }
        return task;
      });

      localStorage.setItem("doingTasks", JSON.stringify(updatedTasks));
      navigate(`/schedule/${id}`);
    } else {
      // 🌟 [등록 모드] 새 id 부여 후 추가
      const maxId =
        existingTasks.length > 0
          ? Math.max(...existingTasks.map((task) => Number(task.id) || 0))
          : 100;

      const nextId = maxId + 1;

      const newTask = {
        id: nextId,
        ...formData,
        title: formData.title.trim(),
        totalHours: Number(formData.workDays) * Number(formData.workHours),
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
  };

  return (
    <div className="px-[20px] pt-[50px] pb-[40px] bg-background min-h-screen">
      <Prev title={isEditMode ? "일정 수정" : "일정 등록"} />

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-[30px] mt-[30px]"
      >
        {/* 프로젝트 명 */}
        <div className="space-y-[8px]">
          <div className="flex gap-[5px]">
            <h2>어떤 프로젝트 인가요?</h2>
            {!formData.title.trim() && <h2 className="text-important">* </h2>}
          </div>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="프로젝트 명을 추가해주세요."
            className="bg-white p-[10px] w-full h-[44px] rounded-[5px] focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-[14px] placeholder:font-normal"
          />
        </div>

        {/* 마감일 */}
        <div className="space-y-[8px]">
          <div className="flex gap-[5px]">
            <h2>언제까지 끝내야 하나요?</h2>
            {!formData.deadline && <h2 className="text-important">* </h2>}
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

        {/* 작업 시간 */}
        <div className="space-y-[15px]">
          <h2>얼마나 걸리나요?</h2>
          <div className="space-y-[10px] px-[10px]">
            {/* 1. 작업 일수 */}
            <div className="w-full flex justify-between items-center">
              <h3 className="text-black/60">작업 일수</h3>
              <div className="w-fit flex justify-center gap-[10px] items-center">
                <button
                  type="button"
                  disabled={Number(formData.workDays) <= 1}
                  onClick={() =>
                    updateField(
                      "workDays",
                      Math.max(1, Number(formData.workDays || 1) - 1),
                    )
                  }
                  className="bg-primary disabled:bg-light-gray disabled:cursor-not-allowed w-[24px] h-[24px] rounded-full flex justify-center items-center cursor-pointer"
                >
                  <Minus color="white" size={15} />
                </button>

                <div className="w-[60px] h-[36px] p-[2px] bg-white rounded-[5px] flex items-center justify-center focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                  <input
                    type="number"
                    min="1"
                    value={formData.workDays === 0 ? "" : formData.workDays}
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? "" : Number(e.target.value);
                      updateField("workDays", val);
                    }}
                    onBlur={() => {
                      if (!formData.workDays || Number(formData.workDays) < 1) {
                        updateField("workDays", 1);
                      }
                    }}
                    className="w-[28px] text-right text-[14px] font-medium outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[14px] font-medium pl-[1px] select-none">
                    일
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateField("workDays", Number(formData.workDays || 0) + 1)
                  }
                  className="bg-primary w-[24px] h-[24px] rounded-full flex justify-center items-center cursor-pointer"
                >
                  <Plus color="white" size={15} />
                </button>
              </div>
            </div>

            {/* 2. 하루 작업 시간 */}
            <div className="w-full flex justify-between items-center">
              <h3 className="text-black/60">하루 작업 시간</h3>
              <div className="w-fit flex justify-center gap-[10px] items-center">
                <button
                  type="button"
                  disabled={Number(formData.workHours) <= 1}
                  onClick={() =>
                    updateField(
                      "workHours",
                      Math.max(1, Number(formData.workHours || 1) - 1),
                    )
                  }
                  className="bg-primary disabled:bg-light-gray disabled:cursor-not-allowed w-[24px] h-[24px] rounded-full flex justify-center items-center cursor-pointer"
                >
                  <Minus color="white" size={15} />
                </button>

                <div className="w-[60px] h-[36px] bg-white rounded-[5px] p-[2px] flex items-center justify-center focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={formData.workHours === 0 ? "" : formData.workHours}
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? "" : Number(e.target.value);

                      if (typeof val === "number" && val > 24) {
                        updateField("workHours", 24);
                      } else {
                        updateField("workHours", val);
                      }
                    }}
                    onBlur={() => {
                      if (
                        !formData.workHours ||
                        Number(formData.workHours) < 1
                      ) {
                        updateField("workHours", 1);
                      }
                    }}
                    className="w-[25px] text-right text-[14px] font-medium outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[14px] font-medium pl-[1px] select-none">
                    시간
                  </span>
                </div>

                <button
                  type="button"
                  disabled={Number(formData.workHours) >= 20}
                  onClick={() =>
                    updateField(
                      "workHours",
                      Math.min(20, Number(formData.workHours || 0) + 1),
                    )
                  }
                  className="bg-primary disabled:bg-light-gray disabled:cursor-not-allowed w-[24px] h-[24px] rounded-full flex justify-center items-center cursor-pointer"
                >
                  <Plus color="white" size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 중요도 */}
        <div className="space-y-[15px]">
          <h2>얼마나 중요한가요?</h2>
          <div className="flex justify-center items-center gap-[20px]">
            {["보통", "중요", "최우선"].map((item, idx) => (
              <button
                key={item}
                type="button"
                onClick={() => updateField("priority", item)}
                className={`flex justify-center items-center gap-[5px] px-[12px] py-[8px] rounded-full transition-colors cursor-pointer ${
                  formData.priority === item
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
            ))}
          </div>
        </div>

        {/* 저장/수정 버튼 */}
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
