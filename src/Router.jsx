import { HashRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import Archive from "./pages/archive/Archive";
import Predict from "./pages/home/Predict";
import ScheduleDetail from "./pages/home/ScheduleDetail";
import AddSchedule from "./pages/home/AddSchedule";
import Error from "./pages/Error";
import Nav from "./components/Nav";

export default function Router() {
  return (
    <div className=" mx-auto max-w-md min-w-s min-h-screen bg-white shadow-xl">
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/archive" element={<Archive />}></Route>
          <Route path="/predict/:id" element={<Predict />}></Route>
          <Route path="/schedule/:id" element={<ScheduleDetail />}></Route>
          <Route path="/add-schedule" element={<AddSchedule />}></Route>

          <Route path="/*" element={<Error />}></Route>
        </Routes>
        <Nav />
      </HashRouter>
    </div>
  );
}
