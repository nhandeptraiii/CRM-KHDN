package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.time.Instant;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResContactDTO {
    private Long id;
    private Long enterpriseId;
    private String enterpriseName;
    private String fullName;
    private String position;
    private String email;
    private String phone;
    private Boolean isPrimary;
    private Instant createdAt;
    private Instant updatedAt;
}
