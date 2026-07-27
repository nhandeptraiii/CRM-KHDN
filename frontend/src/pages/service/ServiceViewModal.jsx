import React from "react";
import "./ServiceViewModal.scss";

function ServiceViewModal({ isOpen, onClose, service }) {
  if (!isOpen || !service) return null;

  // Cập nhật lại biến cleanHtmlContent ở đầu component
  const cleanHtmlContent = service.description
    ? service.description
      .replace(/style="[^"]*"/gi, "") // Xóa mọi inline-style ép buộc
      .replace(/&nbsp;/gi, " ")       //  ĐÂY LÀ CHÌA KHÓA: Đổi khoảng-trắng-liền-khối thành khoảng trắng tự nhiên
    : "";

  return (
    <div className="view-modal-backdrop" onClick={onClose}>
      <div className="view-modal-box" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="view-modal-header">
          <h2>Chi tiết dịch vụ</h2>
          <button className="btn-close-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="view-modal-body">
          <div className="meta-grid">
            <div className="meta-item">
              <span className="meta-label">Mã dịch vụ</span>
              <span className="meta-code">{service.displayCode}</span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Tình trạng</span>
              <div>
                <span className={`status-badge-view ${service.displayStatus ? "active" : "inactive"}`}>
                  <span className="status-dot"></span>
                  {service.displayStatus ? "Đang bán" : "Ngừng cung cấp"}
                </span>
              </div>
            </div>

            <div className="meta-item full-width">
              <span className="meta-label">Tên dịch vụ</span>
              <span className="meta-name">{service.displayName}</span>
            </div>
          </div>

          <div className="desc-section">
            <div className="desc-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Nội dung mô tả</span>
            </div>

            <div className="desc-content-box">
              {service.description ? (
                <div
                  // Thêm class ql-editor để mượn lại CSS chuẩn của thư viện
                  className="quill-content view-only ql-editor"
                  dangerouslySetInnerHTML={{ __html: cleanHtmlContent }}
                />
              ) : (
                <span className="empty-desc">
                  Chưa có mô tả chi tiết cho dịch vụ này.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="view-modal-footer">
          <button className="btn-close-view" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default ServiceViewModal;