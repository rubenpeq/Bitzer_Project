import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";

export default function AdminLayout() {
  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#e6eef6" }}>
      <AdminNavbar />
      <main className="p-3">
        <Outlet />
      </main>
    </div>
  );
}
