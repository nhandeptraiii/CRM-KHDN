package vn.viettel.khdn.crm_DN_VNR20K_2K.service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.Appointment;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private static final DateTimeFormatter DATETIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy");
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Gửi email nhắc lịch hẹn đến AM (Gmail).
     *
     * @param toEmail     Địa chỉ Gmail của AM
     * @param appointment Lịch hẹn cần nhắc
     * @param leadMinutes Số phút còn lại (ví dụ: 1440, 60, 15)
     * @return true nếu gửi thành công, false nếu thất bại
     */
    public boolean sendAppointmentReminder(String toEmail, Appointment appointment, int leadMinutes) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(buildSubject(appointment, leadMinutes));
            helper.setText(buildHtmlContent(appointment, leadMinutes), true); // true = HTML

            mailSender.send(mimeMessage);
            return true;
        } catch (Exception e) {
            // Log lỗi nhưng không throw để không làm crash scheduler
            System.err.println("[EmailService] Lỗi gửi email nhắc lịch hẹn ID="
                    + appointment.getId() + " đến " + toEmail + ": " + e.getMessage());
            return false;
        }
    }

    /**
     * Gửi email xác nhận lên lịch thành công ngay khi vừa tạo hệ thống.
     */
    public void sendAppointmentConfirmation(String toEmail, Appointment appointment) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("✅ [CRM Viettel] Xác nhận lên lịch thành công — " + appointment.getEnterprise().getName());

            ZonedDateTime scheduledVN = appointment.getScheduledTime().atZone(VIETNAM_ZONE);
            String formattedTime = scheduledVN.format(DATETIME_FORMATTER);
            String typeLabel = mapTypeLabel(appointment.getAppointmentType().name());

            String htmlMsg = "<!DOCTYPE html>"
                + "<html lang='vi'><head><meta charset='UTF-8'></head><body style='font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;'>"
                + "<div style='max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);'>"
                + "<div style='background:#4CAF50; padding:24px 32px;'>"
                + "<h2 style='color:#fff; margin:0; font-size:20px;'>✅ Đặt Lịch Thành Công</h2>"
                + "<p style='color:#e8f5e9; margin:4px 0 0;'>Hệ thống ghi nhận bạn vừa lên lịch trên CRM!</p>"
                + "</div>"
                + "<div style='padding:28px 32px;'>"
                + "<p style='font-size:15px; color:#333;'>Xin chào <strong>" + appointment.getConsultant().getFullName() + "</strong>,</p>"
                + "<p style='color:#555;'>Lịch hẹn của bạn đã được ghi nhận. Chi tiết cuộc hẹn:</p>"
                + "<table style='width:100%; border-collapse:collapse; margin-top:16px;'>"
                + tableRow("🏢 Doanh nghiệp", "<strong>" + appointment.getEnterprise().getName() + "</strong>")
                + tableRow("📋 Loại hình", typeLabel)
                + tableRow("🕐 Thời gian", "<strong style='color:#4CAF50;'>" + formattedTime + "</strong>")
                + tableRow("📍 Địa điểm", appointment.getLocation() != null ? appointment.getLocation() : "(Chưa xác định)")
                + "</table>"
                + "</div></div></body></html>";

            helper.setText(htmlMsg, true);
            mailSender.send(mimeMessage);
            System.out.println("[EmailService] Đã gửi xác nhận TẠO MỚI lịch hẹn ID=" + appointment.getId() + " đến " + toEmail);
        } catch (Exception e) {
            System.err.println("[EmailService] Lỗi gửi xác nhận TẠO MỚI lịch hẹn ID=" 
                    + appointment.getId() + " đến " + toEmail + ": " + e.getMessage());
        }
    }

    private String buildSubject(Appointment appointment, int leadMinutes) {
        String timeLabel = formatLeadTime(leadMinutes);
        return "⏰ [CRM Viettel] Nhắc lịch hẹn sau " + timeLabel
                + " — " + appointment.getEnterprise().getName();
    }

    private String buildHtmlContent(Appointment appointment, int leadMinutes) {
        String timeLabel = formatLeadTime(leadMinutes) + " nữa";

        ZonedDateTime scheduledVN = appointment.getScheduledTime()
                .atZone(VIETNAM_ZONE);
        String formattedTime = scheduledVN.format(DATETIME_FORMATTER);

        String contactInfo = appointment.getContact() != null
                ? appointment.getContact().getFullName()
                : "(Chưa xác định người liên hệ)";

        String location = appointment.getLocation() != null
                ? appointment.getLocation()
                : "(Chưa có địa điểm)";

        String purpose = appointment.getPurpose() != null
                ? appointment.getPurpose()
                : "(Không có ghi chú)";

        String typeLabel = mapTypeLabel(appointment.getAppointmentType().name());

        return "<!DOCTYPE html>"
                + "<html lang='vi'><head><meta charset='UTF-8'></head><body "
                + "style='font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;'>"
                + "<div style='max-width:600px; margin:0 auto; background:#fff; "
                + "border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);'>"

                // Header
                + "<div style='background:#E3000E; padding:24px 32px;'>"
                + "<h2 style='color:#fff; margin:0; font-size:20px;'>⏰ Nhắc Lịch Hẹn</h2>"
                + "<p style='color:#ffd1d3; margin:4px 0 0;'>Còn " + timeLabel + " — Hãy chuẩn bị!</p>"
                + "</div>"

                // Body
                + "<div style='padding:28px 32px;'>"
                + "<p style='font-size:15px; color:#333;'>Xin chào <strong>"
                + appointment.getConsultant().getFullName() + "</strong>,</p>"
                + "<p style='color:#555;'>Bạn có lịch hẹn sắp diễn ra. Vui lòng kiểm tra thông tin bên dưới:</p>"

                // Info table
                + "<table style='width:100%; border-collapse:collapse; margin-top:16px;'>"
                + tableRow("🏢 Doanh nghiệp", "<strong>" + appointment.getEnterprise().getName() + "</strong>")
                + tableRow("👤 Người liên hệ", contactInfo)
                + tableRow("📋 Loại hình", typeLabel)
                + tableRow("🕐 Thời gian", "<strong style='color:#E3000E;'>" + formattedTime + "</strong>")
                + tableRow("📍 Địa điểm", location)
                + tableRow("📝 Mục đích", purpose)
                + "</table>"

                // Reminder note
                + "<div style='margin-top:24px; padding:12px 16px; background:#fff8e1; "
                + "border-left:4px solid #FFC107; border-radius:4px;'>"
                + "<p style='margin:0; color:#795548; font-size:13px;'>"
                + "💡 Sau khi hoàn thành cuộc hẹn, vui lòng vào hệ thống CRM để <strong>Xác nhận</strong> "
                + "và ghi lại kết quả tiếp xúc."
                + "</p>"
                + "</div>"
                + "</div>"

                // Footer
                + "<div style='background:#f4f4f4; padding:16px 32px; text-align:center;'>"
                + "<p style='color:#999; font-size:12px; margin:0;'>"
                + "Email này được gửi tự động từ hệ thống CRM KHDN Viettel. Vui lòng không trả lời email này."
                + "</p>"
                + "</div>"
                + "</div>"
                + "</body></html>";
    }

    private String formatLeadTime(int leadMinutes) {
        if (leadMinutes % 60 == 0) {
            int hours = leadMinutes / 60;
            return hours + " giờ";
        }
        return leadMinutes + " phút";
    }

    private String tableRow(String label, String value) {
        return "<tr>"
                + "<td style='padding:8px 0; color:#888; font-size:13px; width:140px; "
                + "vertical-align:top;'>" + label + "</td>"
                + "<td style='padding:8px 0; color:#333; font-size:14px;'>" + value + "</td>"
                + "</tr>";
    }

    private String mapTypeLabel(String type) {
        return switch (type) {
            case "PHONE_CALL" -> "📞 Gọi điện";
            case "EMAIL_QUOTE" -> "📧 Gửi email / Báo giá";
            case "SEND_MAIL" -> "✉️ Gửi mail";
            case "ONLINE_MEETING" -> "💻 Họp online";
            case "OFFLINE_MEETING" -> "🤝 Gặp mặt trực tiếp";
            case "DEMO" -> "🖥️ Demo sản phẩm";
            case "CONTRACT_SIGNING" -> "📑 Ký hợp đồng";
            case "CUSTOMER_SUPPORT" -> "🛠️ Hỗ trợ khách hàng";
            default -> type;
        };
    }
}
