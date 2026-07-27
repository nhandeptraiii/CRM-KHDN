import { useState, useMemo } from "react";
import "./EnterpriseTable.scss";


function EnterpriseTable({ enterprises, onView, currentPage, totalPages, onPageChange }) {
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const isPotentialEnterprise = (item) => {
    const raw =
      item?.isPotential ??
      item?.potential ??
      item?.is_potential ??
      item?.potentialFlag ??
      item?.isPotentialCustomer ??
      item?.potentialCustomer;

    if (typeof raw === "boolean") return raw;
    if (typeof raw === "number") return raw === 1;
    if (typeof raw === "string") {
      const normalized = raw.trim().toLowerCase();
      return ["true", "1", "yes", "y", "potential", "tiem_nang"].includes(normalized);
    }
    return false;
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const isInactiveEnterprise = (item) => {
    const normalized = String(item?.status || "").trim().toUpperCase();
    return normalized === "INACTIVE";
  };

  const sortedData = useMemo(() => {
    let items = [...enterprises];

    items.sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;

      return 0;
    });

    return items;
  }, [enterprises, sortConfig]);
  //   const handlePageChange = (pageNumber) => {
  //   onPageChange(pageNumber - 1); // 👈 convert về 0-based
  // };

  return (
    <div className="table-container">
      <table className="enterprise-table">
        <thead>
          <tr>
            <th>STT</th>
            <th onClick={() => requestSort("name")}>Tên doanh nghiệp</th>
            <th>MST</th>
            <th>Cụm</th>
            <th>Loại</th>
            <th>Nhân sự</th>
            <th>Điện thoại</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {sortedData.map((e, index) => (
            <tr key={e.id}>
              <td>
                {currentPage * 10 + index + 1}
              </td>
              <td className="font-medium">
                <div className="enterprise-name-wrapper">
                  <span className="enterprise-name-cell">
                    <span>{e.name}</span>
                    {isPotentialEnterprise(e) && (
                      <span className="potential-star" title="Doanh nghiệp tiềm năng">
                        ★
                      </span>
                    )}
                  </span>
                  {isInactiveEnterprise(e) && (
                    <span className="enterprise-inactive-text">Ngừng hoạt động</span>
                  )}
                </div>
              </td>
              <td>{e.taxCode}</td>
              <td>{e.region}</td>
              <td>{e.type}</td>
              <td>{e.employeeCount}</td>
              <td>{e.phone}</td>

              <td>
                <div className="action-btns">
                  <button className="view-btn" onClick={() => onView(e)}>
                    Xem
                  </button>

                  {/* <button className="delete-btn" onClick={() => onDelete(e)}>
                    Xóa
                  </button> */}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="pagination">

          {/* Nút về trang đầu */}
          <button
            className="page-btn"
            disabled={currentPage === 0}
            onClick={() => onPageChange(0)}
          >
            &laquo;&laquo;
          </button>

          {/* Nút trang trước */}
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

              let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
              let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);

              if (endPage - startPage < maxVisible - 1) {
                startPage = Math.max(0, endPage - maxVisible + 1);
              }

              for (let i = startPage; i <= endPage; i++) {
                const pageNumber = i + 1;
                pages.push(
                  <button
                    key={pageNumber}
                    className={`page-num ${currentPage === i ? "active" : ""}`}
                    onClick={() => onPageChange(i)}
                  >
                    {pageNumber}
                  </button>
                );
              }
              return pages;
            })()}
          </div>

          {/* Nút trang sau */}
          <button
            className="page-btn"
            disabled={currentPage === totalPages - 1}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Sau &raquo;
          </button>

          {/* Nút về trang cuối */}
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

export default EnterpriseTable;