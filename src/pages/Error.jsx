import { Link } from "react-router-dom";
import vector3 from "../img/Vector3.svg";

export default function Error() {
  return (
    <div className="w-full h-screen bg-background flex flex-col items-center justify-center px-[20px] text-center overflow-hidden">
      <div className="max-w-[320px] w-full bg-white rounded-[16px] p-[30px] flex flex-col items-center gap-[20px] shadow-sm border border-light-gray/40">
        <div className="w-[80px] h-[80px] flex items-center ">
          <img
            src={vector3}
            alt="길 잃은 캐릭터"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="space-y-[6px]">
          <h1 className="text-primary font-bold !text-[28px]">404 ERROR</h1>
          <h3 className="text-black font-bold">여긴 어디 나는 누구</h3>
          <h5 className="text-dark-gray leading-relaxed">
            길을 잃어버렸어요! <br />
            마감일보다 더 급하게 돌아가야 해요.
          </h5>
        </div>

        <Link to="/" className="w-full">
          <button
            type="button"
            className="w-full bg-primary text-white py-[12px] rounded-[10px] transition-all cursor-pointer font-bold hover:opacity-90"
          >
            <h3>돌아가기</h3>
          </button>
        </Link>
      </div>
    </div>
  );
}
