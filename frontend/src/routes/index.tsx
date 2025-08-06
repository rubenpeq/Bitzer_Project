import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import OrderDetail from "../pages/Orders";
import OperationDetail from "../pages/Operations";
import Task from "../pages/Task";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Orders list */}
      <Route path="/" element={<Home />} />

      {/* Order detail + operations */}
      <Route path="/order/:orderNumber" element={<OrderDetail />} />

      {/* Operation detail + tasks */}
      <Route path="/operation/:operationId" element={<OperationDetail />} />

      {/* Task detail */}
      <Route path="/task/:taskId" element={<Task />} />
    </Routes>
  );
}
