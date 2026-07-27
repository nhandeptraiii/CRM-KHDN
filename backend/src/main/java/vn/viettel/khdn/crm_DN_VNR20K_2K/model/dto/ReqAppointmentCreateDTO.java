package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionType;

@Getter
@Setter
public class ReqAppointmentCreateDTO {

    @NotNull(message = "ID Doanh nghiệp không được để trống")
    private Long enterpriseId;

    private Long contactId; // Tuỳ chọn

    @NotNull(message = "Loại hình cuộc hẹn không được để trống")
    private InteractionType appointmentType;

    @NotNull(message = "Thời gian hẹn không được để trống")
    @Future(message = "Thời gian hẹn phải ở trong tương lai")
    @JsonFormat(pattern = "dd/MM/yyyy HH:mm", timezone = "Asia/Ho_Chi_Minh")
    private Instant scheduledTime;

    @Size(max = 255, message = "Địa điểm tối đa 255 ký tự")
    private String location;

    private String purpose; // Mục đích / agenda cuộc hẹn
}
