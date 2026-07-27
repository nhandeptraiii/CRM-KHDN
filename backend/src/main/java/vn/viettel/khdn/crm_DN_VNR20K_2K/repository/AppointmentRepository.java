package vn.viettel.khdn.crm_DN_VNR20K_2K.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.Appointment;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.AppointmentStatus;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {


        // ─── MỚI: Dashboard queries ────────────────────────────────────────────────

        // Đếm lịch hẹn trong khoảng thời gian (dùng cho lịch tuần)
        @Query("SELECT COUNT(a) FROM Appointment a " + "WHERE a.scheduledTime >= :start "
                        + "AND a.scheduledTime < :end " + "AND a.status NOT IN ('REJECTED')")
        long countAppointmentsInRange(@Param("start") Instant start, @Param("end") Instant end);

        // Đếm lịch hẹn CONFIRMED trong tháng (tử số của tỷ lệ chuyển đổi)
        @Query("SELECT COUNT(a) FROM Appointment a " + "WHERE a.status = 'CONFIRMED' "
                        + "AND MONTH(a.scheduledTime) = :month "
                        + "AND YEAR(a.scheduledTime) = :year")
        long countConfirmedInMonth(@Param("month") int month, @Param("year") int year);

        // Đếm tổng lịch hẹn trong tháng (mẫu số của tỷ lệ chuyển đổi)
        @Query("SELECT COUNT(a) FROM Appointment a " + "WHERE MONTH(a.scheduledTime) = :month "
                        + "AND YEAR(a.scheduledTime) = :year " + "AND a.status NOT IN ('REJECTED')")
        long countTotalInMonth(@Param("month") int month, @Param("year") int year);

        // Đếm DN đã có lịch hẹn CONFIRMED trong tháng (KPI: DN tiếp xúc)
        @Query("SELECT COUNT(DISTINCT a.enterprise.id) FROM Appointment a "
                        + "WHERE a.status = 'CONFIRMED' " + "AND MONTH(a.scheduledTime) = :month "
                        + "AND YEAR(a.scheduledTime) = :year")
        long countContactedEnterprisesInMonth(@Param("month") int month, @Param("year") int year);

        // Lấy danh sách lịch hẹn trong ngày (hôm nay / ngày mai)
        // Dùng Instant vì scheduledTime của Appointment là Instant
        @Query("SELECT a.id, e.name, u.fullName, a.scheduledTime, a.status, a.appointmentType "
                        + "FROM Appointment a " + "JOIN a.enterprise e "
                        + "LEFT JOIN a.consultant u " + "WHERE a.scheduledTime >= :dayStart "
                        + "AND a.scheduledTime < :dayEnd " + "AND a.status NOT IN ('REJECTED') "
                        + "ORDER BY a.scheduledTime ASC")
        List<Object[]> findAppointmentsInDay(@Param("dayStart") Instant dayStart,
                        @Param("dayEnd") Instant dayEnd);

        // Đếm DN đã tiếp xúc theo khu vực trong tháng (dùng cho phân bổ khu vực)
        // commune -> cluster -> region (theo cấu trúc Enterprise thực tế)
        @Query("SELECT e.commune.cluster.region, COUNT(DISTINCT a.enterprise.id) "
                        + "FROM Appointment a " + "JOIN a.enterprise e "
                        + "WHERE a.status = 'CONFIRMED' " + "AND MONTH(a.scheduledTime) = :month "
                        + "AND YEAR(a.scheduledTime) = :year "
                        + "GROUP BY e.commune.cluster.region")
        List<Object[]> countContactedByRegionInMonth(@Param("month") int month,
                        @Param("year") int year);

        // Đếm DN CONFIRMED group by DAY trong tháng — dùng Instant range thay vì MONTH()/DAY()
        @Query(value = "SELECT DAY(CONVERT_TZ(scheduled_time, '+00:00', '+07:00')), "
                        + "COUNT(DISTINCT enterprise_id) " + "FROM appointments "
                        + "WHERE status = 'CONFIRMED' " + "AND scheduled_time >= :startOfMonth "
                        + "AND scheduled_time < :startOfNextMonth "
                        + "GROUP BY DAY(CONVERT_TZ(scheduled_time, '+00:00', '+07:00'))",
                        nativeQuery = true)
        List<Object[]> countContactedByDayInMonth(@Param("startOfMonth") Instant startOfMonth,
                        @Param("startOfNextMonth") Instant startOfNextMonth);
    /**
     * Tìm lịch hẹn cần gửi email nhắc trước 24h.
     * Điều kiện:
     *   - status không phải CONFIRMED / CANCELLED
     *   - reminder_24h_sent = false
     *   - scheduledTime nằm trong khoảng (from, to) — tức là (now+23h, now+25h)
     */
    @Query("SELECT a FROM Appointment a "
            + "JOIN FETCH a.consultant "
            + "JOIN FETCH a.enterprise "
            + "LEFT JOIN FETCH a.contact "
            + "WHERE a.status NOT IN ('CONFIRMED', 'REJECTED') "
            + "AND a.reminder24hSent = false "
            + "AND a.scheduledTime > :from "
            + "AND a.scheduledTime <= :to")
    List<Appointment> findRemindable24h(@Param("from") Instant from, @Param("to") Instant to);

    /**
     * Tìm lịch hẹn cần gửi email nhắc trước 1h.
     */
    @Query("SELECT a FROM Appointment a "
            + "JOIN FETCH a.consultant "
            + "JOIN FETCH a.enterprise "
            + "LEFT JOIN FETCH a.contact "
            + "WHERE a.status NOT IN ('CONFIRMED', 'REJECTED') "
            + "AND a.reminder1hSent = false "
            + "AND a.scheduledTime > :from "
            + "AND a.scheduledTime <= :to")
    List<Appointment> findRemindable1h(@Param("from") Instant from, @Param("to") Instant to);

    /**
     * Tìm kiếm lịch hẹn có lọc + phân trang.
     */
    @Query("SELECT a FROM Appointment a WHERE "
            + "(:enterpriseId IS NULL OR a.enterprise.id = :enterpriseId) "
            + "AND (:consultantId IS NULL OR a.consultant.id = :consultantId) "
            + "AND (:status IS NULL OR a.status = :status) "
            + "AND (:regionFilter IS NULL OR a.enterprise.commune.cluster.region = :regionFilter) "
            + "AND (:hasRestrictTypes = false OR a.enterprise.type IN :restrictTypes)")
    Page<Appointment> searchAppointments(
            @Param("enterpriseId") Long enterpriseId,
            @Param("consultantId") Long consultantId,
            @Param("status") AppointmentStatus status,
            @Param("regionFilter") vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum regionFilter,
            @Param("hasRestrictTypes") boolean hasRestrictTypes,
            @Param("restrictTypes") java.util.List<vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseTypeEnum> restrictTypes,
            Pageable pageable);
}

