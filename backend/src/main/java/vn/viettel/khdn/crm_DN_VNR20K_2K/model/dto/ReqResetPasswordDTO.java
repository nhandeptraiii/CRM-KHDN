package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqResetPasswordDTO {
    @NotBlank(message = "Mật khẩu mới không được để trống")
    private String newPassword;
}
