import Home from "./pages/Home.jsx";
import { Routes, Route } from "react-router-dom";
import PopulationDashboard from "./pages/PopulationDashboard.jsx";
import Layout from "./components/Layout.jsx";

export default function App() {
  return (
    
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/population-dashboard" element={<PopulationDashboard />} />
      </Route>
    </Routes>
  );
}
