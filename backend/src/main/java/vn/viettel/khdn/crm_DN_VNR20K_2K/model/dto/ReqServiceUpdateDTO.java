package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqServiceUpdateDTO {

    @Size(max = 50, message = "Mã dịch vụ tối đa 50 ký tự")
    private String serviceCode;

    @Size(max = 255, message = "Tên dịch vụ tối đa 255 ký tự")
    private String serviceName;

    private String description;

    private vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.ServiceCategory category;

    private Boolean isActive;
}
