import { lazy, Suspense } from "react";
import Home from "./pages/Home.jsx";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { SHOW_POPULATION_DASHBOARD } from "./config/features.js";

// Loaded only when the page is switched on and opened, so visitors never download it
// while it is hidden.
const PopulationDashboard = lazy(
  () => import("./pages/PopulationDashboard.jsx"),
);

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        {SHOW_POPULATION_DASHBOARD && (
          <Route
            path="/population-dashboard"
            element={
              <Suspense fallback={null}>
                <PopulationDashboard />
              </Suspense>
            }
          />
        )}

        {/* Any other address (including the hidden page) goes back to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
