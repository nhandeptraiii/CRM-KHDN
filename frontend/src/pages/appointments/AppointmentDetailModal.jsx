import "./AppointmentDetailModal.scss";

function AppointmentDetailModal({ appointment, close }) {
  if (!appointment) return null;

  const statusLabels = {
    PENDING: "Đang chờ",
    CONFIRMED: "Đã xác nhận",
    SCHEDULED: "Lên lịch",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    REJECTED: "Từ chối",
    IN_PROGRESS: "Đang thực hiện",
  };

  const typeLabels = {
    ONLINE_MEETING: "Họp trực tuyến",
    OFFLINE_MEETING: "Gặp trực tiếp",
    PHONE_CALL: "Gọi điện thoại",
    EMAIL_QUOTE: "Gửi báo giá",
    CONTRACT_SIGNING: "Ký hợp đồng",
    CUSTOMER_SUPPORT: "Hỗ trợ khách hàng",
    OTHER: "Khác",
  };

  return (
<div className="modal open" onClick={close}>
  <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title-row">
          <h3>Chi tiết lịch hẹn #{appointment.id}</h3>
          <button type="button" className="modal-close-btn" onClick={close}>
            ×
          </button>
        </div>

        <div className="detail-content">
          <div className="detail-row">
            <span className="label">Doanh nghiệp:</span>
            <span className="value font-medium">
              {appointment.enterpriseName}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Người liên hệ:</span>
            <span className="value">
              {appointment.contactName || "Không xác định"}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Chuyên viên phụ trách:</span>
            <span className="value">
              {appointment.consultantName} ({appointment.consultantEmail})
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Thời gian:</span>
            <span className="value">{appointment.scheduledTime}</span>
          </div>

          <div className="detail-row">
            <span className="label">Hình thức:</span>
            <span className="value">
              {/* Dịch hình thức sang tiếng Việt */}
              {typeLabels[appointment.appointmentType] ||
                appointment.appointmentType}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">Địa điểm:</span>
            <span className="value">{appointment.location || "Không xác định"}</span>
          </div>

          <div className="detail-row">
            <span className="label">Trạng thái:</span>
            <span className={`status ${appointment.status?.toLowerCase()}`}>
              {statusLabels[appointment.status] || appointment.status}
            </span>
          </div>

          <div className="detail-row full-row">
            <span className="label">Mục đích / Ghi chú:</span>
            <div className="value description-box">
              {appointment.purpose || "Chưa có nội dung"}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={close}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppointmentDetailModal;
