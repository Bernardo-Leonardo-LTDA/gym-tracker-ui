import { Routes, Route } from "react-router-dom";
import { FindScreen } from "../features/FindScreen";
import { GymsNearbyScreen } from "../features/GymsNearbyScreen";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<FindScreen />} />
      <Route path="/nearby" element={<GymsNearbyScreen />} />
    </Routes>
  );
}
