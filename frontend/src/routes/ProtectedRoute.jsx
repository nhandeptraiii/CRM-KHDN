import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

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

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { token, user, loading } = useSelector((state) => state.auth);
  const role = getNormalizedRole(user);

  // Chờ getMe() xong rồi mới kiểm tra quyền
  if (loading || (token && !user)) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
        Đang tải thông tin...
      </div>
    );
  }

  // 3. Không có token -> Chưa đăng nhập -> Về thẳng Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 4. Có token, ĐÃ CÓ user -> Bắt đầu check Role
  if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/404" replace />;
  }

  // 5. Vượt qua mọi bài kiểm tra -> Cho phép vào trang
  return children;
}

export default ProtectedRoute;