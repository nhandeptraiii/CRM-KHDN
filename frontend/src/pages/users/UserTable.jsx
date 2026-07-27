import { useMemo, useState } from "react";
import "./UserTable.scss";

function UserTable({ interactions, onView, onDeleteEnterprise, isLoading, currentPage = 0, totalPages = 0, onPageChange }) {
  const [sortConfig, setSortConfig] = useState({ key: "latestInteractionDate", direction: "desc" });

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const parseDateStr = (str) => {
    if (!str) return 0;
    return new Date(str).getTime() || 0;
  };

  // Sort phía client trong trang hiện tại (data ít, nhanh)
  const sortedData = useMemo(() => {
    const data = [...(interactions || [])];
    data.sort((a, b) => {
      let aVal = a[sortConfig.key] ?? "";
      let bVal = b[sortConfig.key] ?? "";
      
      if (sortConfig.key === "latestInteractionDate") {
        aVal = parseDateStr(aVal);
        bVal = parseDateStr(bVal);
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [interactions, sortConfig]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN");
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="sort-arrow">↕</span>;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  // Tính STT tuyệt đối theo trang (currentPage là 0-indexed)
  const PAGE_SIZE = 10;
  const baseIndex = currentPage * PAGE_SIZE;

  return (
    <>
      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>STT</th>
              <th onClick={() => requestSort("enterpriseName")} className="sortable">
                Doanh nghiệp {getSortIcon("enterpriseName")}
              </th>
              <th onClick={() => requestSort("interactionCount")} className="sortable">
                Số lần tiếp xúc {getSortIcon("interactionCount")}
              </th>
              <th onClick={() => requestSort("latestInteractionDate")} className="sortable">
                Ngày tiếp xúc gần nhất {getSortIcon("latestInteractionDate")}
              </th>
              <th className="text-center">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              // Skeleton loading rows
              [...Array(10)].map((_, i) => (
                <tr key={`skeleton-${i}`} className="skeleton-row">
                  <td><div className="skeleton-cell" style={{ width: "30px" }} /></td>
                  <td className="td-enterprise"><div className="skeleton-cell" style={{ width: "180px" }} /></td>
                  <td><div className="skeleton-cell" style={{ width: "50px", margin: "0 auto" }} /></td>
                  <td><div className="skeleton-cell" style={{ width: "100px", margin: "0 auto" }} /></td>
                  <td><div className="skeleton-cell" style={{ width: "120px", margin: "0 auto" }} /></td>
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  Chưa có dữ liệu tiếp xúc
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr key={item.enterpriseId || index}>
                  <td>{baseIndex + index + 1}</td>
                  <td className="td-enterprise">
                    <span className="enterprise-name-cell">
                      <span>{item.enterpriseName || "-"}</span>
                      {Boolean(item?.isPotential) && (
                        <span className="potential-star" title="Doanh nghiệp tiềm năng">
                          ★
                        </span>
                      )}
                    </span>
                  </td>
                  <td>{item.interactionCount || 0}</td>
                  <td>{formatDate(item.latestInteractionDate)}</td>
                  <td>
                    <div className="action-btns">
                      <button className="view-edit-btn" title="Xem chi tiết" onClick={() => onView(item)}>
                        <span>Xem chi tiết</span>
                      </button>

                      <button className="delete-btn" title="Xóa doanh nghiệp" onClick={() => onDeleteEnterprise(item)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                          <path d="M10 11v6"></path>
                          <path d="M14 11v6"></path>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && !isLoading && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={currentPage === 0}
              onClick={() => onPageChange(currentPage - 1)}
            >
              &laquo; Trước
            </button>

            <div className="page-numbers">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`page-num ${currentPage === index ? "active" : ""}`}
                  onClick={() => onPageChange(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              className="page-btn"
              disabled={currentPage === totalPages - 1}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Sau &raquo;
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default UserTable;
