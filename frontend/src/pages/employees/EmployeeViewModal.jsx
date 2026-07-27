import "./EmployeeViewModal.scss";

function EmployeeViewModal({ user, communes = [], close }) {
  if (!user) return null;

  const roleMap = {
    ADMIN: "Quản trị viên",
    CONSULTANT: "Nhân viên tư vấn",
    STAFF: "Nhân viên",
  };

  const regionMap = {
    CTO: "Cần Thơ",
    HUG: "Hậu Giang",
    STG: "Sóc Trăng",
    NONE: "Chưa phân công",
  };

  const getGenderLabel = (gender) => {
    if (!gender) return "-";
    const g = gender.toUpperCase();
    if (g === "MALE") return "Nam";
    if (g === "FEMALE") return "Nữ";
    if (g === "OTHER") return "Khác";
    return gender;
  };

const getCommuneNames = () => {
  if (!user?.communeIds?.length) return [];

  return user.communeIds.map((id) => {
    const found = communes.find((c) => c.id === id);
    return found?.name || `ID ${id}`;
  });
};

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    if (
      typeof dateString === "string" &&
      /^\d{2}-\d{2}-\d{4}$/.test(dateString)
    ) {
      const [day, month, year] = dateString.split("-");
      return `${day}/${month}/${year}`;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN");
  };

  const formatInstant = (instantStr) => {
    if (!instantStr) return "-";
    const date = new Date(instantStr);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts[parts.length - 1]?.[0]?.toUpperCase() || "?";
  };

  return (
    <div className="view-modal-overlay" onClick={close}>
      <div className="view-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Hồ sơ nhân viên</h3>
          <button className="close-icon-btn" onClick={close}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="view-content">
          <div className="avatar-section">
            <div className="avatar-circle">
              {getInitials(user.fullName || user.name)}
            </div>
            <div className="avatar-info">
              <div className="avatar-name">
                {user.fullName || user.name || "-"}
              </div>
              <div className="avatar-role">
                {roleMap[user.role] || user.role || "-"}
              </div>
              <span
                className={`status-badge ${user.status === "ACTIVE" ? "active" : "inactive"}`}
              >
                {user.status === "ACTIVE"
                  ? "Đang hoạt động"
                  : "Ngưng hoạt động"}
              </span>
            </div>
          </div>

          <div className="info-card">
            <h4 className="card-title">Thông tin cơ bản</h4>

            <div className="info-row">
              <span className="info-label">Họ và tên:</span>
              <span className="info-value">
                {user.fullName || user.name || "-"}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Email liên hệ:</span>
              <span className="info-value">{user.email || "-"}</span>
            </div>
            <div className="info-row no-border">
              <span className="info-label">Số điện thoại:</span>
              <span className="info-value">
                {user.phone || "Chưa cập nhật"}
              </span>
            </div>
          </div>
          <div className="info-grid">
            {/* Cột Trái: Cá nhân */}
            <div className="info-card half">
              <h4 className="card-title">Cá nhân</h4>
              <div className="info-block">
                <span className="info-label">Giới tính:</span>
                <span className="info-value">
                  {getGenderLabel(user.gender)}
                </span>
              </div>
              <div className="info-block">
                <span className="info-label">Ngày sinh:</span>
                <span className="info-value">
                  {formatDate(user.dateOfBirth)}
                </span>
              </div>
            </div>

            <div className="info-card half">
              <h4 className="card-title">Công việc</h4>
              <div className="info-block">
                <span className="info-label">Vai trò:</span>
                <span className="info-value">
                  {roleMap[user.role] || user.role || "-"}
                </span>
              </div>
              <div className="info-block">
                <span className="info-label">Khu vực:</span>
                <span className="info-value">
                  {user.region
                    ? regionMap[user.region] || user.region
                    : "Chưa phân công"}
                </span>
              </div>
<div className="info-block">
  <span className="info-label">Xã / Phường:</span>

  <span className="info-value">
    {getCommuneNames().length > 0
      ? getCommuneNames().join(", ")
      : "Chưa phân công"}
  </span>
</div>
            </div>
          </div>

          <div className="info-card">
            <h4 className="card-title">Thông tin hệ thống</h4>
            {/* <div className="info-row">
              <span className="info-label">ID nhân viên:</span>
              <span className="info-value">#{user.id}</span>
            </div> */}
            <div className="info-row">
              <span className="info-label">Ngày tạo:</span>
              <span className="info-value">
                {formatInstant(user.createdAt)}
              </span>
            </div>
            <div className="info-row no-border">
              <span className="info-label">Cập nhật lần cuối:</span>
              <span className="info-value">
                {formatInstant(user.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeViewModal;
