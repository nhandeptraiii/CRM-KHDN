package vn.viettel.khdn.crm_DN_VNR20K_2K.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.Enterprise;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseStatus;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseTypeEnum;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.Industry;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum;

@Repository
public interface EnterpriseRepository extends JpaRepository<Enterprise, Long> {

        // ─── CŨ (giữ nguyên hoàn toàn) ────────────────────────────────────────────

        @Query("SELECT e FROM Enterprise e " + "LEFT JOIN e.commune c " + "LEFT JOIN c.cluster cl "
                        + "WHERE (:keyword IS NULL OR LOWER(e.name) LIKE LOWER(CONCAT('%', :keyword, '%')) "
                        + "OR LOWER(e.taxCode) LIKE LOWER(CONCAT('%', :keyword, '%')) "
                        + "OR LOWER(e.phone) LIKE LOWER(CONCAT('%', :keyword, '%'))) "
                        + "AND (:status IS NULL OR e.status = :status) "
                        + "AND (:industry IS NULL OR e.industry = :industry) "
                        + "AND (:hasRegions = false OR cl.region IN :regions) "
                        + "AND (:hasTypes = false OR e.type IN :types) "
                        + "AND (:consultantId IS NULL OR e.consultant.id = :consultantId) "
                        + "AND (:hasCommunes = false OR c.id IN :communeIds) "
                        + "AND (:hasRestrictTypes = false OR e.type IN :restrictTypes)")
        Page<Enterprise> searchEnterprises(@Param("keyword") String keyword,
                        @Param("status") EnterpriseStatus status,
                        @Param("industry") Industry industry, 
                        @Param("hasRegions") boolean hasRegions,
                        @Param("regions") java.util.List<RegionEnum> regions,
                        @Param("hasTypes") boolean hasTypes,
                        @Param("types") java.util.List<EnterpriseTypeEnum> types, 
                        @Param("consultantId") Long consultantId,
                        @Param("hasCommunes") boolean hasCommunes,
                        @Param("communeIds") java.util.List<Long> communeIds,
                        @Param("hasRestrictTypes") boolean hasRestrictTypes,
                        @Param("restrictTypes") java.util.List<EnterpriseTypeEnum> restrictTypes,
                        Pageable pageable);

        @Query("SELECT COALESCE(MAX(e.id), 0) FROM Enterprise e")
        long findMaxId();

        @Query("SELECT COUNT(DISTINCT i.enterprise.id) FROM Interaction i")
        long countInteractedEnterprises();

        @Query("SELECT e FROM Enterprise e " + "LEFT JOIN e.commune c " + "LEFT JOIN c.cluster cl "
                        + "WHERE (:region IS NULL OR cl.region = :region) AND "
                        + "(:status IS NULL OR e.status = :status) AND "
                        + "(:industry IS NULL OR e.industry = :industry) AND "
                        + "(:kw IS NULL OR LOWER(e.name) LIKE LOWER(CONCAT('%', :kw, '%')) OR e.taxCode LIKE CONCAT('%', :kw, '%'))")
        Page<Enterprise> searchEnterprisesWithRegion(String kw, EnterpriseStatus status,
                        Industry industry, RegionEnum region, Pageable pageable);

        @Query("SELECT e FROM Enterprise e " + "WHERE :roleName IN ('ADMIN', 'OPERATOR') "
                        + "   OR (:roleName = 'MANAGER' AND :regionName = 'DA' AND e.type IN :daTypes) "
                        + "   OR (:roleName = 'MANAGER' AND :regionName != 'DA' AND e.type IN :smeTypes AND e.commune.cluster.region = :managedRegion) "
                        + "   OR (:roleName = 'CONSULTANT' AND e.type IN :smeTypes AND e.commune IN :managedCommunes)")
        Page<Enterprise> findAllByDataVisibility(@Param("roleName") String roleName,
                        @Param("regionName") String regionName,
                        @Param("managedRegion") RegionEnum managedRegion,
                        @Param("daTypes") java.util.Collection<EnterpriseTypeEnum> daTypes,
                        @Param("smeTypes") java.util.Collection<EnterpriseTypeEnum> smeTypes,
                        @Param("managedCommunes") java.util.Collection<vn.viettel.khdn.crm_DN_VNR20K_2K.model.Commune> managedCommunes,
                        Pageable pageable);

        // ─── MỚI: Dashboard queries ────────────────────────────────────────────────

        // Đếm DN theo type (SME / HKD / DN_2000 / DN_20K)
        @Query("SELECT COUNT(e) FROM Enterprise e "
                        + "WHERE e.type = :type AND e.status != 'DELETED'")
        long countByType(@Param("type") EnterpriseTypeEnum type);

        // Đếm DN mới được tạo trong vòng N ngày
        @Query("SELECT COUNT(e) FROM Enterprise e "
                        + "WHERE e.createdAt >= :from AND e.status != 'DELETED'")
        long countNewEnterprisesSince(@Param("from") Instant from);

        // Tổng DN theo khu vực (commune -> cluster -> region)
        @Query("SELECT e.commune.cluster.region, COUNT(e) " + "FROM Enterprise e "
                        + "WHERE e.status != 'DELETED' " + "GROUP BY e.commune.cluster.region")
        List<Object[]> countGroupByRegion();

        // Đếm DN 2000/20K chưa tiếp xúc trong 3 tháng (hoặc chưa từng tiếp xúc)
        @Query("SELECT COUNT(e) FROM Enterprise e "
                        + "WHERE e.type = :type AND e.status != 'DELETED' "
                        + "AND e.id NOT IN ("
                        + "    SELECT i.enterprise.id FROM Interaction i WHERE i.interactionTime >= :threshold)")
        long countUncontactedByType(@Param("type") EnterpriseTypeEnum type, @Param("threshold") Instant threshold);

        // Danh sách DN 2000 + 20K chưa tiếp xúc trong 3 tháng (hoặc chưa từng tiếp xúc)
        @Query("SELECT e.id, e.name, e.taxCode, e.type, e.commune.cluster.region, e.consultant.fullName "
                        + "FROM Enterprise e " + "WHERE e.type IN :types AND e.status != 'DELETED' "
                        + "AND e.id NOT IN ("
                        + "    SELECT i.enterprise.id FROM Interaction i WHERE i.interactionTime >= :threshold) "
                        + "ORDER BY e.type, e.name")
        List<Object[]> findUncontactedEnterprises2000And20K(
                        @Param("types") List<EnterpriseTypeEnum> types, @Param("threshold") Instant threshold);
}
