package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.time.Instant;
import java.time.LocalDate;

import lombok.Getter;
import lombok.Setter;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.UsageStatus;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionType;

@Getter
@Setter
public class ResUsageDTO {
    private Long id;

    // Enterprise Info
    private Long enterpriseId;
    private String enterpriseName;

    // Viettel Service Info
    private Long viettelServiceId;
    private String serviceCode;
    private String serviceName;

    // Usage Info
    private String contractNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private UsageStatus status;
    private Integer quantity;
    private Double revenue;

    // Liên kết với Interaction (nếu hợp đồng sinh ra từ tiếp xúc/chốt sale)
    private Long interactionId;
    private InteractionType interactionType;

    private Instant createdAt;
    private Instant updatedAt;
}
