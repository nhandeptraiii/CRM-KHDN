import { useState, useMemo, useEffect } from "react";
import "./ServiceTable.scss";
import ServiceViewModal from "./ServiceViewModal";

// Component Modal Xác nhận Xóa Dịch vụ Tùy chỉnh
function DeleteServiceModal({ isOpen, onClose, onConfirm, serviceName }) {
  if (!isOpen) return null;

  return (
    <div className="delete-modal-backdrop" onClick={onClose}>
      <div className="delete-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-icon-container">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="delete-modal-svg-icon">
            <circle cx="12" cy="12" r="10" fill="#fecaca" stroke="#ef4444" />
            <line x1="12" y1="8" x2="12" y2="12" stroke="#ef4444" strokeWidth="3" />
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="#ef4444" strokeWidth="3" />
          </svg>
        </div>
        <div className="delete-modal-content">
          <h2 className="delete-modal-title">Xóa dịch vụ</h2>
          <p className="delete-modal-text">
            Bạn có chắc chắn muốn xóa dịch vụ <strong>{serviceName}</strong> không? <br />
            Hành động này không thể hoàn tác.
          </p>
        </div>
        <div className="delete-modal-actions">
          <button className="delete-modal-btn cancel-btn" onClick={onClose}>Hủy</button>
          <button className="delete-modal-btn delete-btn" onClick={onConfirm}>Xóa</button>
        </div>
      </div>
    </div>
  );
}

function ServiceTable({
  services,
  totalPages,
  currentPage,
  setCurrentPage,
  onEdit,
  onDelete,
  currentUserRole,
}) {
    const [sortConfig, setSortConfig] = useState({
      key: "originalIndex",
      direction: "asc",
    });



  const processedServices = useMemo(() => {
    return (services || []).map((service, index) => ({
      ...service,
      displayCode: service.service_code || service.serviceCode || "N/A",
      displayName: service.service_name || service.serviceName || "N/A",
      displayStatus: service.is_active ?? service.isActive ?? false,
      originalIndex: (currentPage - 1) * 10 + index + 1,
    }));
  }, [services]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedServices = useMemo(() => {
    let sortableItems = [...processedServices];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const keyMap = {
          serviceCode: "displayCode",
          serviceName: "displayName",
          isActive: "displayStatus",
          originalIndex: "originalIndex",
        };
        const sortKey = keyMap[sortConfig.key] || sortConfig.key;
        const aValue = a[sortKey] ?? "";
        const bValue = b[sortKey] ?? "";
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [processedServices, sortConfig]);


  // ==========================================
  // LOGIC PHÂN TRANG THÔNG MINH (THEO ĐÚNG Ý BẠN)
  // Chỉ tự động lùi trang khi dữ liệu bị lọc mất đi quá nhiều
  // Nếu dữ liệu vẫn đủ dài, giữ nguyên người dùng ở trang hiện tại
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages); // Kéo về trang cuối cùng có dữ liệu
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1); // Nếu không có kết quả nào, đưa về 1
    }
  }, [totalPages, currentPage]);
  // ==========================================

  const currentTableData = sortedServices;

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="sort-arrow">↕</span>;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  // STATE CHO CHỨC NĂNG XEM CHI TIẾT
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [serviceToView, setServiceToView] = useState(null);

  const handleOpenDeleteDialog = (service) => {
    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setServiceToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (serviceToDelete) {
      onDelete(serviceToDelete.id);
    }
    handleCloseDeleteDialog();
  };

  const handleOpenViewDialog = (service) => {
    setServiceToView(service);
    setIsViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setIsViewDialogOpen(false);
    setServiceToView(null);
  };

  return (
    <div className="table-container">
      <table className="service-table">
        <thead>
          <tr>
            <th onClick={() => requestSort("originalIndex")} className="sortable text-center" style={{ width: "80px" }}>STT {getSortIcon("originalIndex")}</th>
            <th onClick={() => requestSort("serviceCode")} className="sortable">Mã dịch vụ {getSortIcon("serviceCode")}</th>
            <th onClick={() => requestSort("serviceName")} className="sortable">Tên dịch vụ {getSortIcon("serviceName")}</th>
            <th onClick={() => requestSort("isActive")} className="sortable text-center">Tình trạng bán {getSortIcon("isActive")}</th>
            {currentUserRole === "ADMIN" && (<th className="text-center">Hành động</th>)}
          </tr>
        </thead>

        <tbody>
          {currentTableData.length === 0 ? (
            <tr><td colSpan={currentUserRole === "ADMIN" ? "5" : "4"} className="empty-state text-center">Chưa có dịch vụ nào trong hệ thống hoặc phù hợp với tìm kiếm</td></tr>
          ) : (
            currentTableData.map((service) => (
              <tr key={service.id || service.displayCode}>
                <td className="text-center font-bold text-muted">{service.originalIndex}</td>
                <td className="font-bold highlight-code">{service.displayCode}</td>
                <td className="font-medium">{service.displayName}</td>
                <td className="text-center">
                  <span className={`status-badge ${service.displayStatus ? "active" : "inactive"}`}>
                    {service.displayStatus ? "Đang bán" : "Ngừng cung cấp"}
                  </span>
                </td>

                {currentUserRole === "ADMIN" && (
                  <td className="text-center">
                    <div className="action-btns">
                      <button className="view-btn" title="Xem chi tiết" onClick={() => handleOpenViewDialog(service)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                      </button>
                      <button className="edit-btn" title="Sửa" onClick={() => onEdit(service)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>

                      <button className="delete-btn" title="Xóa" onClick={() => handleOpenDeleteDialog(service)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

{totalPages > 1 && (
  <div className="pagination">
    {/* VỀ TRANG ĐẦU */}
    <button
      className="page-btn"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(1)}
    >
      ⏮
    </button>

    {/* TRANG TRƯỚC */}
    <button
      className="page-btn"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((c) => c - 1)}
    >
      &laquo; Trước
    </button>

    {/* PAGE NUMBERS (CHỈ HIỂN THỊ 5 TRANG XUNG QUANH) */}
    <div className="page-numbers">
      {(() => {
        const pageNumbers = [];
        const maxVisible = 5;

        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, currentPage + 2);

        // fix khi gần đầu
        if (currentPage <= 3) {
          start = 1;
          end = Math.min(totalPages, maxVisible);
        }

        // fix khi gần cuối
        if (currentPage >= totalPages - 2) {
          start = Math.max(1, totalPages - maxVisible + 1);
          end = totalPages;
        }

        for (let i = start; i <= end; i++) {
          pageNumbers.push(
            <button
              key={i}
              className={`page-num ${currentPage === i ? "active" : ""}`}
              onClick={() => setCurrentPage(i)}
            >
              {i}
            </button>
          );
        }

        return pageNumbers;
      })()}
    </div>

    {/* TRANG SAU */}
    <button
      className="page-btn"
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((c) => c + 1)}
    >
      Sau &raquo;
    </button>

    {/* ĐẾN TRANG CUỐI */}
    <button
      className="page-btn"
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(totalPages)}
    >
      ⏭
    </button>
  </div>
)}

      {/* MODAL XÓA */}
      <DeleteServiceModal isOpen={isDeleteDialogOpen} onClose={handleCloseDeleteDialog} onConfirm={handleConfirmDelete} serviceName={serviceToDelete?.displayName || ""} />

      {/* MODAL XEM CHI TIẾT */}
      <ServiceViewModal isOpen={isViewDialogOpen} onClose={handleCloseViewDialog} service={serviceToView} />
    </div>
  );
}

export default ServiceTable;