import { useState, useMemo } from "react";
import "./AppointmentTable.scss";

function AppointmentTable({
  appointments,
  onEdit,
  onView,
  currentPage,
  totalPages,
  onPageChange,
  onDelete,
  onConfirm,
}) {
  const [sortConfig, setSortConfig] = useState({
    key: "id",
    direction: "desc",
  });

  const statusLabels = {
    CONFIRMED: "Đã xác nhận",
    REJECTED: "Đã hủy",
    SCHEDULED: "Lên lịch",
    REMINDED: "Đã nhắc nhở",
  };

  const typeLabels = {
    ONLINE_MEETING: "Trực tuyến",
    OFFLINE_MEETING: "Trực tiếp",
    PHONE_CALL: "Gọi điện",
    EMAIL_QUOTE: "Gửi báo giá",
    CONTRACT_SIGNING: "Ký hợp đồng",
    CUSTOMER_SUPPORT: "Hỗ trợ",
    OTHER: "Khác",
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let items = [...appointments];
    items.sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return items;
  }, [appointments, sortConfig]);

  const canEditOrAction = (status) => {
    return (
      status !== "COMPLETED" && status !== "CANCELLED" && status !== "REJECTED" && status !== "CONFIRMED"
    );
  };

  return (
    <div className="table-container">
      <table className="appointment-table">
        <thead>
          <tr>
            <th>STT</th>
            <th onClick={() => requestSort("enterpriseName")}>Doanh nghiệp</th>
            <th>Người liên hệ</th>
            <th onClick={() => requestSort("scheduledTime")}>Thời gian</th>
            <th>Hình thức</th>
            {/* <th>Địa điểm</th> */}
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((e, index) => (
            <tr key={e.id}>
              <td>{currentPage * 10 + index + 1}</td>
              <td className="font-medium">{e.enterpriseName}</td>
              <td>{e.contactName}</td>
              <td>{e.scheduledTime}</td>
              <td>
                {/* 3. Dịch Hình thức ở đây */}
                {typeLabels[e.appointmentType] || e.appointmentType}
              </td>
              {/* <td>{e.location}</td> */}
              <td>
                <span className={`status ${e.status?.toLowerCase()}`}>
                  {/* 4. Dịch Trạng thái ở đây */}
                  {statusLabels[e.status] || e.status}
                </span>
              </td>
              <td>
                <div className="action-btns">
                  <button className="view-btn" onClick={() => onView(e)}>
                    Xem
                  </button>
                  {canEditOrAction(e.status) && (
                    <>
                      <button className="edit-btn" onClick={() => onEdit(e)}>
                        Sửa
                      </button>
                      <button
                        className="confirm-btn"
                        onClick={() => onConfirm(e)}
                      >
                        Xác nhận
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => onDelete(e)}
                      >
                        Huỷ
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="pagination">
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
                currentPage - Math.floor(maxVisible / 2),
              );
              let endPage = Math.min(
                totalPages - 1,
                startPage + maxVisible - 1,
              );

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
                  </button>,
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
        </div>
      )}
    </div>
  );
}

export default AppointmentTable;
