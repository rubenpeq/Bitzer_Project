import { Outlet } from "react-router-dom";
import AppNavbar from "../components/Navbar";

export default function PublicLayout() {
  return (
    <div>
      <AppNavbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
