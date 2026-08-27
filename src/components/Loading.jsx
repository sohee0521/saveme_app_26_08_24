import { Oval } from "react-loader-spinner";

export default function Loading() {
  return (
    <div className="w-full h-screen bg-background flex flex-col items-center justify-center px-[20px] text-center overflow-hidden">
      <div className="flex flex-col items-center gap-[24px]">
        {/* 스피너 아이콘 */}
        <div className="relative flex items-center justify-center">
          <Oval
            visible={true}
            height="55"
            width="55"
            color="var(--color-primary, #2AD1B2)"
            secondaryColor="rgba(42, 209, 178, 0.2)"
            strokeWidth={4}
            strokeWidthSecondary={4}
            ariaLabel="oval-loading"
          />
        </div>

        {/* 안내 텍스트 */}
        <div className="space-y-[6px]">
          <h3 className="text-black font-bold animate-pulse">
            미래의 나를 구하는 중...
          </h3>
          <h5 className="text-dark-gray">잠시만 기다려주세요!</h5>
        </div>
      </div>
    </div>
  );
}
