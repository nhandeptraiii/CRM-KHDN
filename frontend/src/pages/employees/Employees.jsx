import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import "./Employees.scss";

import { getUsers } from "../../services/userService";
import { getClusters, getCommunes } from "../../services/locationsService";
import EmployeeModal from "./EmployeeModal";
import EmployeeTable from "./EmployeeTable";
import EmployeeViewModal from "./EmployeeViewModal";

function Employees() {
  const user = useSelector((state) => state.auth.user);
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
  const role = getNormalizedRole(user);
  const canManageEmployees = role === "ADMIN";
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;
  const [openModal, setOpenModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // State quản lý bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // State quản lý Custom Dropdown
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const [communes, setCommunes] = useState([]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers(
        currentPage,
        pageSize,
        searchTerm,
        filterRole === "ALL" ? "" : filterRole,
        filterStatus === "ALL" ? "" : filterStatus
      );
      const responseData = res.data?.data;

      setUsers(responseData?.content || []);
      setTotalPages(responseData?.totalPages || 0);
    } catch (error) {
      console.error(error);
    }
  }, [currentPage, searchTerm, filterRole, filterStatus]);
  useEffect(() => {
    // eslint-disable-next-line
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setOpenModal(true);
  };

  const handleView = async (user) => {
    setSelectedUser(user);

    try {
      // 1. Lấy clusters theo region
      const clusterRes = await getClusters(user.region);
      const clusters = clusterRes.data?.data || [];

      let allCommunes = [];

      // 2. Lấy tất cả communes của các cluster
      for (const cluster of clusters) {
        const res = await getCommunes(cluster.id);
        const list = res.data?.data || [];
        allCommunes = [...allCommunes, ...list];
      }

      setCommunes(allCommunes);
    } catch (err) {
      console.error(err);
    }

    setOpenViewModal(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setOpenModal(true);
  };

  // Dữ liệu cho Dropdown
  const roleOptions = [
    { value: "ALL", label: "Tất cả vai trò" },
    { value: "ADMIN", label: "Quản trị viên" },
    { value: "CONSULTANT", label: "Nhân viên tư vấn" },
    { value: "OPERATOR", label: "Quản lý điều hành" },
    { value: "MANAGER", label: "Quản lý khu vực" },
    { value: "ACCOUNT_MANAGER", label: "Nhân viên AM" },
  ];

  const statusOptions = [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "ACTIVE", label: "Hoạt động" },
    { value: "INACTIVE", label: "Ngưng hoạt động" },
  ];

  return (
    <div className="employees-page">
      <div className="header">
        <h2>Quản lý nhân viên</h2>

        <div className="header-actions" ref={dropdownRef}>
          {/* Bẫy Autofill */}
          <input
            type="text"
            style={{ position: "absolute", opacity: 0, width: 0, zIndex: -1 }}
            tabIndex="-1"
          />
          <input
            type="password"
            style={{ position: "absolute", opacity: 0, width: 0, zIndex: -1 }}
            tabIndex="-1"
          />

          {/* Ô Tìm kiếm */}
          <div className="search-box">
            <svg
              className="icon-search"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              name="search_real_field"
              autoComplete="off"
              placeholder="Tìm tên, email, sđt..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
            />

            {/* THÊM NÚT X XÓA NHANH Ở ĐÂY */}
            {searchTerm && (
              <svg
                className="icon-clear"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                onClick={() => setSearchTerm("")}
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            )}
          </div>

          {/* =========================================
              CUSTOM DROPDOWN - VAI TRÒ
          ========================================== */}
          <div className="custom-dropdown">
            <div
              className={`dropdown-trigger ${openDropdown === "role" ? "active" : ""}`}
              onClick={() =>
                setOpenDropdown(openDropdown === "role" ? null : "role")
              }
            >
              <span>
                {roleOptions.find((opt) => opt.value === filterRole)?.label}
              </span>
              <svg
                className={`icon-chevron ${openDropdown === "role" ? "open" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {openDropdown === "role" && (
              <div className="dropdown-menu">
                {roleOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`dropdown-item ${filterRole === opt.value ? "selected" : ""}`}
                    onClick={() => {
                      setCurrentPage(0);
                      setFilterRole(opt.value);
                      setOpenDropdown(null);
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =========================================
              CUSTOM DROPDOWN - TRẠNG THÁI
          ========================================== */}
          <div className="custom-dropdown">
            <div
              className={`dropdown-trigger ${openDropdown === "status" ? "active" : ""}`}
              onClick={() =>
                setOpenDropdown(openDropdown === "status" ? null : "status")
              }
            >
              <span>
                {statusOptions.find((opt) => opt.value === filterStatus)?.label}
              </span>
              <svg
                className={`icon-chevron ${openDropdown === "status" ? "open" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {openDropdown === "status" && (
              <div className="dropdown-menu">
                {statusOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`dropdown-item ${filterStatus === opt.value ? "selected" : ""}`}
                    onClick={() => {
                      setCurrentPage(0);
                      setFilterStatus(opt.value);
                      setOpenDropdown(null);
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chỉ ADMIN mới thấy nút Thêm nhân viên */}
          {canManageEmployees && (
            <button type="button" className="add-btn" onClick={handleCreate}>
              + Thêm nhân viên
            </button>
          )}
        </div>
      </div>

      <div className="table-card">
        <EmployeeTable
          users={users}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          refresh={fetchUsers}
          onEdit={handleEdit}
          onView={handleView}
        />
      </div>

      {/* MODAL THÊM / SỬA */}
      {openModal && (
        <EmployeeModal
          user={selectedUser}
          close={() => setOpenModal(false)}
          reload={fetchUsers}
        />
      )}

      {/* MODAL XEM CHI TIẾT (ĐOẠN VỪA THÊM) */}
      {openViewModal && (
        <EmployeeViewModal
          user={selectedUser}
          communes={communes}
          close={() => setOpenViewModal(false)}
        />
      )}
    </div>
  );
}

export default Employees;
