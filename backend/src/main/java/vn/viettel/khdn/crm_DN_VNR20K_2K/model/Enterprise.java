package vn.viettel.khdn.crm_DN_VNR20K_2K.model;

import java.time.Instant;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseStatus;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseTypeEnum;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.Industry;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RevenueRange;

@Entity
@Table(name = "enterprises")
@Getter
@Setter
public class Enterprise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "tax_code", nullable = false, length = 20)
    private String taxCode;

    @Enumerated(EnumType.STRING)
    @Column(length = 100)
    private Industry industry;

    @Column(name = "employee_count")
    private Integer employeeCount;

    @Column(length = 500)
    private String address;

    @Column(length = 255)
    private String website;

    @Column(name = "established_date")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy")
    private LocalDate establishedDate;

    @Column(length = 100)
    private String phone;

    @Column(length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private EnterpriseStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commune_id")
    private Commune commune;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EnterpriseTypeEnum type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id")
    private User consultant; // Người phụ trách (Consultant)

    @Column(length = 1000)
    private String note;

    @Column(name = "tax_authority", length = 255)
    private String taxAuthority;

    @Enumerated(EnumType.STRING)
    @Column(name = "revenue_range", length = 50)
    private RevenueRange revenueRange;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.status == null) {
            this.status = EnterpriseStatus.ACTIVE;
        }
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedAt = Instant.now();
    }

    @jakarta.persistence.Transient
    public RegionEnum getRegion() {
        if (this.commune != null && this.commune.getCluster() != null) {
            return this.commune.getCluster().getRegion();
        }
        return null;
    }

    @jakarta.persistence.Transient
    public void setRegion(RegionEnum region) {
        // Obsolete, left for backwards compatibility with DTO mapping.
        // Needs Commune parameter to be properly assigned in the Service layer.
    }

    @jakarta.persistence.Transient
    public String getCommuneCode() {
        return this.commune != null ? this.commune.getCode() : null;
    }
}
