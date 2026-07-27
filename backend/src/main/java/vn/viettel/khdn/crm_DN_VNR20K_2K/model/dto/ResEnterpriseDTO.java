package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.time.Instant;
import java.time.LocalDate;

import lombok.Getter;
import lombok.Setter;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseStatus;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseTypeEnum;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.Industry;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RevenueRange;

@Getter
@Setter
public class ResEnterpriseDTO {
    private Long id;
    private String name;
    private String taxCode;
    private Industry industry;
    private Integer employeeCount;
    private String address;
    private String website;
    private LocalDate establishedDate;
    private String phone;
    private String email;
    private EnterpriseStatus status;
    private String note;
    private String taxAuthority;
    private RevenueRange revenueRange;
    private Instant createdAt;
    private Instant updatedAt;
    private RegionEnum region;         
    private EnterpriseTypeEnum type;   
    private Long consultantId;
    private String consultantName;
    private String consultantPhone;
    private Long amId;
    private String amName;
    private String amPhone;
    
    // Thêm các trường cho xuất Excel (Người đại diện)
    private String contactFullName;
    private String contactEmail;
    private String contactPhone;
    private String contactPosition;
    
    private Long communeId;
    private String communeCode;
    private String communeName;
    
    private String usedViettelServices;
}
