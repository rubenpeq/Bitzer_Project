// src/routes/index.tsx
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Orders from "../pages/Orders";
import Operations from "../pages/Operations";
import Tasks from "../pages/Task";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/order" element={<Orders />} />
      <Route path="/operation" element={<Operations />} />
      <Route path="/task" element={<Tasks />} />
    </Routes>
  );
}
