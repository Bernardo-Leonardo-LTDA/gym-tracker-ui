import { Routes, Route } from "react-router-dom";
import { FindScreen } from "../features/FindScreen";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<FindScreen />} />
    </Routes>
  );
}
