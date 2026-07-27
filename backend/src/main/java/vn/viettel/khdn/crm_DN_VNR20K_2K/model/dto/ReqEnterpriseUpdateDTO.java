package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseStatus;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.Industry;

@Getter
@Setter
public class ReqEnterpriseUpdateDTO {

    @Size(max = 255, message = "Tên doanh nghiệp tối đa 255 ký tự")
    private String name;

    @Size(max = 20, message = "Mã số thuế tối đa 20 ký tự")
    private String taxCode;

    private Industry industry;

    private Integer employeeCount;

    @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự")
    private String address;

    @Size(max = 255, message = "Website tối đa 255 ký tự")
    private String website;

    private LocalDate establishedDate;

    @Size(max = 100, message = "SĐT tối đa 100 ký tự")
    private String phone;

    @jakarta.validation.constraints.Size(max = 255, message = "Email doanh nghiệp tối đa 255 ký tự")
    private String email;

    private EnterpriseStatus status;

    @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
    private String note;

    @Size(max = 255, message = "Cơ quan thuế tối đa 255 ký tự")
    private String taxAuthority;

    private vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RevenueRange revenueRange;

    private vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum region;
    
    @jakarta.validation.constraints.NotNull(message = "Loại hình doanh nghiệp không được để trống")
    private vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseTypeEnum type;
    
    private Long consultantId;
    
    // Thêm trường communeId để hỗ trợ Frontend truyền bằng dạng số thay vì gõ text
    private Long communeId;
}
