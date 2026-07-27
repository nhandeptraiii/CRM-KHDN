package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.UsageStatus;

@Getter
@Setter
public class ReqUsageUpdateDTO {

    @Size(max = 100, message = "Số hợp đồng tối đa 100 ký tự")
    private String contractNumber;

    private LocalDate startDate;

    private LocalDate endDate;

    private UsageStatus status;

    private Integer quantity;

    private Double revenue;
}
