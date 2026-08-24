import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Archive } from "lucide-react";

export default function Nav() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[25px] w-[148px] px-[15px] py-[10px] flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm gap-[20px]">
      <Link
        to="/"
        onClick={() => setActiveTab("home")}
        className={`w-[48px] h-[48px] flex items-center justify-center rounded-full transition-colors ${
          activeTab === "home" ? "bg-secondary" : "bg-transparent"
        }`}
      >
        <CalendarCheck
          size={24}
          strokeWidth={1.5}
          color={activeTab === "home" ? "#000000" : "#ffffff"}
        />
      </Link>

      <Link
        to="/archive"
        onClick={() => setActiveTab("archive")}
        className={`w-[48px] h-[48px] flex items-center justify-center rounded-full transition-colors ${
          activeTab === "archive" ? "bg-secondary" : "bg-transparent "
        }`}
      >
        <Archive
          size={24}
          strokeWidth={1.5}
          color={activeTab === "archive" ? "#000000" : "#ffffff"}
        />
      </Link>
    </div>
  );
}
