import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function Prev({ title = "페이지명" }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="flex items-center gap-[2px] text-black cursor-pointer"
    >
      <ChevronLeft size={24} />
      <h3>{title}</h3>
    </button>
  );
}
