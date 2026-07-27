import { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { getClusters, getCommunes } from "../../services/locationsService";
import "./EmployeeTable.scss";

function EmployeeTable({
  users,
  onEdit,
  onView,
  currentPage,
  totalPages,
  onPageChange,
}) {
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
  // 1. STATE SẮP XẾP
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const regionMap = {
    CTO: "Cần Thơ",
    HUG: "Hậu Giang",
    STG: "Sóc Trăng",
    NONE: "Chưa phân công",
  };

  // 2. STATE PHÂN TRANG

  const roleMap = {
    ADMIN: "Quản trị viên",
    CONSULTANT: "Nhân viên tư vấn",
    MANAGER: "Quản lý khu vực",
    OPERATOR: "Quản lý điều hành",
    ACCOUNT_MANAGER: "Nhân viên AM",
  };

  const [allClusters, setAllClusters] = useState([]);
  const [allCommunes, setAllCommunes] = useState([]);

  // Hàm xử lý hiển thị Giới tính
  // const getGenderLabel = (gender) => {
  //   if (!gender) return "-";
  //   const genderUpper = gender.toUpperCase();
  //   if (genderUpper === "MALE") return "Nam";
  //   if (genderUpper === "FEMALE") return "Nữ";
  //   if (genderUpper === "OTHER") return "Khác";
  //   return gender;
  // };

  // Hàm xử lý Sắp xếp
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Logic Sắp xếp toàn bộ dữ liệu
  const sortedUsers = useMemo(() => {
    let sortableItems = users ? [...users] : [];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? "";
        const bValue = b[sortConfig.key] ?? "";

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [users, sortConfig]);


  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // load tất cả clusters theo các region bạn dùng
        const regions = ["CTO", "HUG", "STG"];
        let clusters = [];
        let communes = [];

        for (const region of regions) {
          const resCluster = await getClusters(region);
          const listCluster = resCluster.data?.data || [];

          clusters = [...clusters, ...listCluster];

          // lấy communes của từng cluster
          for (const cl of listCluster) {
            const resCommune = await getCommunes(cl.id);
            const listCommune = resCommune.data?.data || [];

            // GẮN clusterId vào commune để map ngược
            const mapped = listCommune.map((c) => ({
              ...c,
              clusterId: cl.id,
              clusterName: cl.name,
            }));

            communes = [...communes, ...mapped];
          }
        }

        setAllClusters(clusters);
        setAllCommunes(communes);
      } catch (err) {
        console.error("Load location error:", err);
      }
    };

    fetchLocations();
  }, []);
  // ==========================================
  const getUserLocationDisplay = (user) => {
    if (!user?.communeIds?.length) return null;

    const userCommunes = allCommunes.filter((c) =>
      user.communeIds.includes(c.id)
    );

    if (userCommunes.length === 0) return null;

    const clusterName = userCommunes[0].clusterName;

    return {
      clusterName,
      communes: userCommunes.map((c) => c.name),
    };
  };


  // const formatDate = (dateString) => {
  //   if (!dateString) return "-";

  //   // detect format DD-MM-YYYY
  //   if (dateString.includes("-") && dateString.split("-")[0].length === 2) {
  //     const [day, month, year] = dateString.split("-");
  //     return `${day}/${month}/${year}`;
  //   }

  //   const date = new Date(dateString);
  //   if (!isNaN(date.getTime())) {
  //     return date.toLocaleDateString("vi-VN");
  //   }

  //   return "-";
  // };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="sort-arrow">↕</span>;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="table-container">
      <table className="employee-table">
        <thead>
          <tr>
<th>STT</th>
            <th
              onClick={() => requestSort("fullName")}
              className="sortable text-left"
            >
              Họ tên {getSortIcon("fullName")}
            </th>
            <th
              onClick={() => requestSort("email")}
              className="sortable text-left"
            >
              Email {getSortIcon("email")}
            </th>
            <th onClick={() => requestSort("phone")} className="sortable">
              SĐT {getSortIcon("phone")}
            </th>
            <th onClick={() => requestSort("role")} className="sortable">
              Vai trò {getSortIcon("role")}
            </th>
            <th onClick={() => requestSort("region")} className="sortable">
              Khu vực {getSortIcon("region")}
            </th>
            <th>Cụm phụ trách</th>
            <th className="text-center">Hành động</th>
          </tr>
        </thead>

        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="9" className="empty-state">
                Chưa có dữ liệu nhân viên nào hoặc không tìm thấy kết quả phù
                hợp
              </td>
            </tr>
          ) : (
            sortedUsers.map((user, index) => (
              <tr key={user.id}>
                <td>{currentPage * 10 + index + 1}</td>
                <td className="font-medium text-left">
                  <div className="employee-name-wrapper">
                    <span className="employee-name">
                      {user.fullName || user.name}
                    </span>

                    {user.status === "INACTIVE" && (
                      <span className="employee-inactive-text">
                        Ngừng hoạt động
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-left">{user.email}</td>
                <td>{user.phone || "-"}</td>
                <td>
                  <span className={`role-badge ${user.role?.toLowerCase()}`}>
                    {roleMap[user.role] || user.role}
                  </span>
                </td>
                <td>{regionMap[user.region] || user.region || "-"}</td>
                <td className="text-left">
                  {(() => {
                    const location = getUserLocationDisplay(user);

                    if (!location) return "-";

                    return (
                      <div>
                        <div className="cluster-name">{location.clusterName}</div>

                        {location.communes.map((name, index) => (
                          <div key={index} className="commune-item">
                            - {name}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </td>
                <td>
                  {/* Chỉ ADMIN mới thấy toàn bộ các nút hành động */}
                  {canManageEmployees ? (
                    <div className="action-btns">
                      {/* NÚT CHỮ "I" XEM CHI TIẾT */}
                      <button
                        className="view-btn"
                        title="Xem chi tiết"
                        onClick={() => onView && onView(user)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                      </button>

                      {/* NÚT SỬA */}
                      <button
                        className="edit-btn"
                        title="Sửa"
                        onClick={() => onEdit(user)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* GIAO DIỆN NÚT PHÂN TRANG */}
     {totalPages > 1 && (
  <div className="pagination">

    <button
      className="page-btn"
      disabled={currentPage === 0}
      onClick={() => onPageChange(0)}
    >
      &laquo;&laquo;
    </button>

    <button
      className="page-btn"
      disabled={currentPage === 0}
      onClick={() => onPageChange(currentPage - 1)}
    >
      &laquo; Trước
    </button>

    <div className="page-numbers">
      {(() => {
        const pages = [];
        const maxVisible = 5;

        let startPage = Math.max(
          0,
          currentPage - Math.floor(maxVisible / 2)
        );

        let endPage = Math.min(
          totalPages - 1,
          startPage + maxVisible - 1
        );

        if (endPage - startPage < maxVisible - 1) {
          startPage = Math.max(
            0,
            endPage - maxVisible + 1
          );
        }

        for (let i = startPage; i <= endPage; i++) {
          const pageNumber = i + 1;

          pages.push(
            <button
              key={pageNumber}
              className={`page-num ${
                currentPage === i ? "active" : ""
              }`}
              onClick={() => onPageChange(i)}
            >
              {pageNumber}
            </button>
          );
        }

        return pages;
      })()}
    </div>

    <button
      className="page-btn"
      disabled={currentPage === totalPages - 1}
      onClick={() => onPageChange(currentPage + 1)}
    >
      Sau &raquo;
    </button>

    <button
      className="page-btn"
      disabled={currentPage === totalPages - 1}
      onClick={() => onPageChange(totalPages - 1)}
    >
      &raquo;&raquo;
    </button>

  </div>
)}
    </div>
  );
}

export default EmployeeTable;
