import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import MainLayout from "../layouts/mainLayout/MainLayout";

import Login from "../pages/login/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import Employees from "../pages/employees/Employees";
import ProtectedRoute from "./ProtectedRoute";
import Profile from "../pages/profile/Profile";
import Services from "../pages/service/Services";
import Enterprises from "../pages/enterprises/Enterprises";
import Appointments from "../pages/appointments/Appointments";
import Users from "../pages/users/Users";
// import Forbidden from "../pages/Forbidden";
import NotFound from "../pages/NotFound";

const getNormalizedRole = (user) => {
  const directRole = user?.role || user?.roleName;
  if (typeof directRole === "string" && directRole.trim()) {
    return directRole.trim().toUpperCase();
  }

  const firstRole = user?.roles?.[0];
  if (typeof firstRole === "string" && firstRole.trim()) {
    return firstRole.trim().toUpperCase();
  }
  if (firstRole?.name && typeof firstRole.name === "string") {
    return firstRole.name.trim().toUpperCase();
  }

  return "";
};

function HomeByRole() {
  const user = useSelector((state) => state.auth.user);
  const role = getNormalizedRole(user);

  if (role === "USER" || role === "CONSULTANT") {
    return <Dashboard />;
  }

  return <Dashboard />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* <Route path="/403" element={<Forbidden />} /> */}

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomeByRole />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "OPERATOR", "MANAGER", "CONSULTANT", "ACCOUNT_MANAGER"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "OPERATOR", "MANAGER", "CONSULTANT", "ACCOUNT_MANAGER"]}>
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "OPERATOR", "MANAGER", "CONSULTANT", "ACCOUNT_MANAGER"]}>
                <Services />
              </ProtectedRoute>
            }
          />
          <Route
            path="/enterprises"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "OPERATOR", "MANAGER", "CONSULTANT", "ACCOUNT_MANAGER"]}>
                <Enterprises />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "OPERATOR", "MANAGER", "CONSULTANT", "ACCOUNT_MANAGER"]}>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "OPERATOR", "MANAGER", "CONSULTANT", "ACCOUNT_MANAGER"]}>
                <Users />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
