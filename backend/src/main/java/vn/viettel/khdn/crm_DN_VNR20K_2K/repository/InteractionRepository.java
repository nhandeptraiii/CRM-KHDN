package vn.viettel.khdn.crm_DN_VNR20K_2K.repository;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.Interaction;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.EmployeeInteractionDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionType;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionResult;

@Repository
public interface InteractionRepository extends JpaRepository<Interaction, Long> {

        @Query("SELECT i FROM Interaction i "
                        + "LEFT JOIN i.enterprise.commune c "
                        + "LEFT JOIN c.cluster cl "
                        + "WHERE (:enterpriseId IS NULL OR i.enterprise.id = :enterpriseId) "
                        + "AND (:consultantId IS NULL OR i.enterprise.consultant.id = :consultantId) "
                        + "AND (:type IS NULL OR i.interactionType = :type) "
                        + "AND (:result IS NULL OR i.result = :result) "
                        + "AND (:regionFilter IS NULL OR cl.region = :regionFilter) "
                        + "AND (:hasRestrictTypes = false OR i.enterprise.type IN :restrictTypes)")
        Page<Interaction> searchInteractions(@Param("enterpriseId") Long enterpriseId,
                        @Param("consultantId") Long consultantId,
                        @Param("type") InteractionType type,
                        @Param("result") InteractionResult result,
                        @Param("regionFilter") vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum regionFilter,
                        @Param("hasRestrictTypes") boolean hasRestrictTypes,
                        @Param("restrictTypes") java.util.List<vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseTypeEnum> restrictTypes,
                        Pageable pageable);

        /**
         * Trả về danh sách doanh nghiệp kèm số lần tiếp xúc và ngày tiếp xúc gần nhất,
         * hỗ trợ phân trang phía server. Mỗi phần tử là Object[]{enterpriseId, enterpriseName,
         * count, latestTime, consultantName}
         */
        @Query("SELECT i.enterprise.id, i.enterprise.name, COUNT(i), MAX(i.interactionTime), " +
               "MAX(i.enterprise.consultant.fullName) " +
               "FROM Interaction i " +
               "LEFT JOIN i.enterprise.commune c " +
               "LEFT JOIN c.cluster cl " +
               "WHERE (:consultantId IS NULL OR i.enterprise.consultant.id = :consultantId) " +
               "AND (:regionFilter IS NULL OR cl.region = :regionFilter) " +
               "AND (:hasRestrictTypes = false OR i.enterprise.type IN :restrictTypes) " +
               "GROUP BY i.enterprise.id, i.enterprise.name " +
               "ORDER BY MAX(i.interactionTime) DESC")
        Page<Object[]> searchEnterpriseInteractionSummary(
                        @Param("consultantId") Long consultantId,
                        @Param("regionFilter") vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum regionFilter,
                        @Param("hasRestrictTypes") boolean hasRestrictTypes,
                        @Param("restrictTypes") java.util.List<vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseTypeEnum> restrictTypes,
                        Pageable pageable);


        @Query("SELECT new vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.EmployeeInteractionDTO(c.fullName, COUNT(i)) "
                        + "FROM Interaction i JOIN i.enterprise.consultant c "
                        + "WHERE MONTH(i.createdAt) = MONTH(CURRENT_DATE) "
                        + "AND YEAR(i.createdAt) = YEAR(CURRENT_DATE) "
                        + "GROUP BY c.id, c.fullName")
        List<EmployeeInteractionDTO> countInteractionsByEmployeeThisMonth();

        @Query("SELECT new vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.EmployeeInteractionDTO(c.fullName, COUNT(i)) "
                        + "FROM Interaction i JOIN i.enterprise.consultant c " + "GROUP BY c.id, c.fullName")
        List<EmployeeInteractionDTO> countInteractionsByEmployee();

        @Query("SELECT new vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.EmployeeInteractionDTO(c.fullName, COUNT(i)) "
                        + "FROM Interaction i JOIN i.enterprise.consultant c "
                        + "WHERE MONTH(i.createdAt) = :month " + "AND YEAR(i.createdAt) = :year "
                        + "GROUP BY c.id, c.fullName")
        List<EmployeeInteractionDTO> countInteractionsByMonthAndYear(@Param("month") int month,
                        @Param("year") int year);

        @Query("SELECT COUNT(DISTINCT i.enterprise.id) FROM Interaction i "
                        + "WHERE MONTH(i.interactionTime) = :month AND YEAR(i.interactionTime) = :year")
        long countContactedEnterprisesInMonth(@Param("month") int month, @Param("year") int year);

        @Query(value = "SELECT DAY(CONVERT_TZ(interaction_time, '+00:00', '+07:00')), "
                        + "COUNT(DISTINCT enterprise_id) "
                        + "FROM interactions "
                        + "WHERE interaction_time >= :startOfMonth "
                        + "AND interaction_time < :startOfNextMonth "
                        + "GROUP BY DAY(CONVERT_TZ(interaction_time, '+00:00', '+07:00'))",
                        nativeQuery = true)
        java.util.List<Object[]> countContactedByDayInMonth(
                        @Param("startOfMonth") java.time.Instant startOfMonth,
                        @Param("startOfNextMonth") java.time.Instant startOfNextMonth);
}
