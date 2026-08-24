import { Link } from "react-router-dom";
import { Plus, Check, ListFilter, Clock8, Star } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    console.log("선택됨:", option);
    setIsOpen(false);
  };

  return (
    <div>
      <div className="w-full bg-black flex flex-col px-[25px] pt-[70px] pb-[25px] gap-[10px]">
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

      <div className="px-[25px] pt-[20px] flex flex-col gap-[20px] bg-background min-h-screen">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-[2px]">
            <Check size={20} />
            <h2>To Do List</h2>
          </div>

          {/* 필터 드롭다운  */}
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="bg-black w-[32px] h-[32px] flex items-center justify-center rounded-full z-10 relative"
            >
              <ListFilter size={16} color="white" strokeWidth={3} />
            </button>

            {/*  열렸을 때 화면 바깥 아무데나 클릭해도 닫히는 투명 막 */}
            {isOpen && (
              <div
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-40"
              />
            )}

            <div
              className={`absolute right-0 top-[40px] z-10 ${
                isOpen ? "flex" : "hidden"
              }`}
            >
              <div className="bg-white w-[120px] rounded-[5px] shadow-xl flex flex-col border border-light-gray overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleSelect("마감 임박순")}
                  className="w-full text-left p-[10px] text-black"
                >
                  <h4>마감 임박순</h4>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect("중요도순")}
                  className="w-full text-left p-[10px] text-black"
                >
                  <h4>중요도순</h4>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelect("위험도순")}
                  className="w-full text-left p-[10px] text-black"
                >
                  <h4>위험도순</h4>
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* 할 일 목록 */}
        <div className="w-full space-y-[20px]">
          <div className="bg-white p-[15px] rounded-[10px] space-y-[15px]">
            <div className="flex gap-[10px]">
              <div className=" flex justify-center items-center gap-[5px]">
                <Clock8 size={15} color="#757575" />
                <h5 className="text-dark-gray">2026.00.00</h5>
              </div>
              <div className="bg-secondary w-fit px-[5px] h-[16px flex justify-center items-center]">
                <h6>D-00</h6>
              </div>
            </div>
            <div>
              <div className="flex gap-[2px] space-y-[5px]">
                <Star
                  size={12}
                  color="var(--color-important)"
                  fill="var(--color-important)"
                />
                <Star
                  size={12}
                  color="var(--color-important)"
                  fill="var(--color-important)"
                />
              </div>
              <h2>프로젝트 명</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
