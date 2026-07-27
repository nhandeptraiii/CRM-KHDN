package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqContactUpdateDTO {

    @Size(max = 150, message = "Họ tên tối đa 150 ký tự")
    private String fullName;

    @Size(max = 100, message = "Chức vụ tối đa 100 ký tự")
    private String position;

    @Size(max = 100, message = "Email tối đa 100 ký tự")
    private String email;

    @Size(max = 100, message = "SĐT tối đa 100 ký tự")
    private String phone;

    private Boolean isPrimary;
}
