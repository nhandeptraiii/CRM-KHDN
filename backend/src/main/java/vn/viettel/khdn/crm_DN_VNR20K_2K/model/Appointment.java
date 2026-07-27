package vn.viettel.khdn.crm_DN_VNR20K_2K.model;

import java.time.Instant;

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
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.AppointmentStatus;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionType;

@Entity
@Table(name = "appointments")
@Getter
@Setter
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ===== Liên kết thực thể =====
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enterprise_id", nullable = false)
    private Enterprise enterprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id") // nullable: có thể hẹn cty mà chưa rõ người
    private EnterpriseContact contact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultant_id", nullable = false)
    private User consultant;

    // ===== Thông tin lịch hẹn =====
    @Enumerated(EnumType.STRING)
    @Column(name = "appointment_type", nullable = false, length = 50)
    private InteractionType appointmentType;

    @Column(name = "scheduled_time", nullable = false)
    private Instant scheduledTime;

    @Column(length = 255)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String purpose; // Mục đích / agenda cuộc hẹn

    // ===== Trạng thái =====
    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private AppointmentStatus status;

    @Column(name = "reminder_24h_sent", nullable = false)
    private Boolean reminder24hSent = false;

    @Column(name = "reminder_1h_sent", nullable = false)
    private Boolean reminder1hSent = false;

    // ===== Liên kết Interaction được tạo sau khi xác nhận =====
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interaction_id")
    private Interaction interaction; // null cho đến khi AM xác nhận

    // ===== Timestamps =====
    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.status == null) {
            this.status = AppointmentStatus.SCHEDULED;
        }
        if (this.reminder24hSent == null) {
            this.reminder24hSent = false;
        }
        if (this.reminder1hSent == null) {
            this.reminder1hSent = false;
        }
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedAt = Instant.now();
    }
}
