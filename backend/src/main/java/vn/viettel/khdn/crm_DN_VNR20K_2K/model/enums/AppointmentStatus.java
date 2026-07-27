package vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums;

public enum AppointmentStatus {
    SCHEDULED,  // Đã đặt lịch, chờ tới giờ
    REMINDED,   // Đã gửi ít nhất 1 email nhắc
    CONFIRMED,  // AM đã xác nhận cuộc hẹn đã diễn ra (có Interaction)
    REJECTED    // Khách từ chối hẹn hoặc huỷ
}
