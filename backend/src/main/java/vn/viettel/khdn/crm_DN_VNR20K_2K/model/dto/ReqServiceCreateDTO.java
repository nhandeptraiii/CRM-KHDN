package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import vn.viettel.khdn.crm_DN_VNR20K_2K.util.validator.ServiceCodeUnique;

@Getter
@Setter
public class ReqServiceCreateDTO {

    @ServiceCodeUnique(message = "Mã dịch vụ đã tồn tại trên hệ thống")
    @NotBlank(message = "Mã dịch vụ không được để trống")
    @Size(max = 50, message = "Mã dịch vụ tối đa 50 ký tự")
    private String serviceCode;

    @NotBlank(message = "Tên dịch vụ không được để trống")
    @Size(max = 255, message = "Tên dịch vụ tối đa 255 ký tự")
    private String serviceName;

    private String description;

    private vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.ServiceCategory category;

    private Boolean isActive;
}
