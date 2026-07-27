package vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums;

public enum InteractionResult {
    PENDING, // Chờ xử lý / Chưa có thông tin rõ ràng
    NEED_FOLLOW_UP, // Cần gọi lại / Chăm sóc tiếp
    NEXT_APPOINTMENT, // Hẹn gặp tiếp theo
    INTERESTED, // Yêu thích / Tiềm năng
    IN_PROGRESS, // Đang thương thảo / Có tiến triển
    CLOSED_WON, // Chốt Hợp đồng thành công
    CLOSED_LOST // Thất bại / KH từ chối
}
