package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionType;

@Getter
@Setter
public class ReqAppointmentUpdateDTO {

    private InteractionType appointmentType;

    @Future(message = "Thời gian hẹn mới phải ở trong tương lai")
    @JsonFormat(pattern = "dd/MM/yyyy HH:mm", timezone = "Asia/Ho_Chi_Minh")
    private Instant scheduledTime; // null = không thay đổi

    @Size(max = 255, message = "Địa điểm tối đa 255 ký tự")
    private String location;

    private String purpose;
}
