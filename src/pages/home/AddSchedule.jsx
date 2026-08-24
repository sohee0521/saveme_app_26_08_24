import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Prev from "../../components/Prev";
import { Calendar, Minus, Plus, Star } from "lucide-react";

export default function AddSchedule() {
  const navigate = useNavigate();
  const dateInputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // 폼 입력 상태
  const [formData, setFormData] = useState({
    title: "",
    deadline: "",
    workDays: 1,
    workHours: 1,
    priority: "보통",
  });

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

  // 로컬스토리지 저장 처리
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newTask = {
      id: Date.now(),
      ...formData,
      title: formData.title.trim(),
      createdAt: new Date().toISOString(),
    };

    const existingTasks = JSON.parse(
      localStorage.getItem("doingTasks") || "[]",
    );
    localStorage.setItem(
      "doingTasks",
      JSON.stringify([...existingTasks, newTask]),
    );

    navigate("/");
  };

  return (
    <div className="px-[25px] pt-[50px] pb-[40px] bg-background min-h-screen">
      <Prev title="일정 등록" />

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-[30px] mt-[30px]"
      >
        {/*  프로젝트 명 */}
        <div className="space-y-[8px]">
          <h2>어떤 프로젝트 인가요?</h2>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="프로젝트 명을 추가해주세요."
            className="bg-white p-[10px] w-full h-[44px] rounded-[5px] focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-[14px] placeholder:font-normal"
          />

          {!formData.title.trim() && (
            <p className="text-primary text-[12px] pl-[5px]">
              프로젝트 명을 입력해주세요.
            </p>
          )}
        </div>

        {/* 마감일 */}
        <div className="space-y-[8px]">
          <h2>언제까지 끝내야 하나요?</h2>
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

          {!formData.deadline && (
            <p className="text-primary text-[12px] pl-[5px]">
              마감일을 선택해주세요.
            </p>
          )}

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

        {/*  작업 시간 */}
        <div className="space-y-[15px]">
          <h2>얼마나 걸리나요?</h2>
          <div className="space-y-[10px] px-[10px]">
            {/* 작업 일수 */}
            <div className="w-full flex justify-between items-center">
              <h3>작업 일수</h3>
              <div className="w-fit flex justify-center gap-[10px] items-center">
                <button
                  type="button"
                  disabled={formData.workDays <= 1}
                  onClick={() =>
                    updateField("workDays", Math.max(1, formData.workDays - 1))
                  }
                  className="bg-black disabled:bg-light-gray disabled:cursor-not-allowed w-[24px] h-[24px] rounded-full flex justify-center items-center"
                >
                  <Minus color="white" size={15} />
                </button>
                <h4 className="w-[60px] h-[36px] flex justify-center items-center bg-white rounded-[5px]">
                  {formData.workDays}일
                </h4>
                <button
                  type="button"
                  onClick={() => updateField("workDays", formData.workDays + 1)}
                  className="bg-black w-[24px] h-[24px] rounded-full flex justify-center items-center"
                >
                  <Plus color="white" size={15} />
                </button>
              </div>
            </div>

            {/* 하루 작업 시간 */}
            <div className="w-full flex justify-between items-center">
              <h3>하루 작업 시간</h3>
              <div className="w-fit flex justify-center gap-[10px] items-center">
                <button
                  type="button"
                  disabled={formData.workHours <= 1}
                  onClick={() =>
                    updateField(
                      "workHours",
                      Math.max(1, formData.workHours - 1),
                    )
                  }
                  className="bg-black disabled:bg-light-gray disabled:cursor-not-allowed w-[24px] h-[24px] rounded-full flex justify-center items-center"
                >
                  <Minus color="white" size={15} />
                </button>
                <h4 className="w-[60px] h-[36px] flex justify-center items-center bg-white rounded-[5px]">
                  {formData.workHours}시간
                </h4>
                <button
                  type="button"
                  disabled={formData.workHours >= 20}
                  onClick={() =>
                    updateField(
                      "workHours",
                      Math.min(20, formData.workHours + 1),
                    )
                  }
                  className="bg-black disabled:bg-light-gray disabled:cursor-not-allowed w-[24px] h-[24px] rounded-full flex justify-center items-center"
                >
                  <Plus color="white" size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/*중요도 */}
        <div className="space-y-[15px]">
          <h2>얼마나 중요한가요?</h2>
          <div className="flex justify-center items-center gap-[20px]">
            {["보통", "중요", "최우선"].map((item, idx) => (
              <button
                key={item}
                type="button"
                onClick={() => updateField("priority", item)}
                className={`flex justify-center items-center gap-[5px] px-[12px] py-[8px] rounded-full transition-colors ${
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

        {/* 저장 버튼 */}
        <button
          type="submit"
          disabled={!isFormValid}
          className="bg-primary disabled:bg-light-gray disabled:text-dark-gray disabled:cursor-not-allowed text-white py-[14px] rounded-[5px] transition-all cursor-pointer mt-[10px]"
        >
          <h3>저장하기</h3>
        </button>
      </form>
    </div>
  );
}
