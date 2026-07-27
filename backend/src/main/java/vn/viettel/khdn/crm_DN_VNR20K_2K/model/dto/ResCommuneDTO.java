package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResCommuneDTO {
    private Long id;
    private String name;
    private String code;
    private Long clusterId;
    private String clusterName;
}
