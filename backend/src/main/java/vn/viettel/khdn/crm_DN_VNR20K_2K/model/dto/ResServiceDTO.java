package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.time.Instant;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResServiceDTO {
    private Long id;
    private String serviceCode;
    private String serviceName;
    private String description;
    private vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.ServiceCategory category;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}
