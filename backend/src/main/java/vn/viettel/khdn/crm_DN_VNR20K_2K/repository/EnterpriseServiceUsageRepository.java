package vn.viettel.khdn.crm_DN_VNR20K_2K.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.EnterpriseServiceUsage;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.UsageStatus;

@Repository
public interface EnterpriseServiceUsageRepository extends JpaRepository<EnterpriseServiceUsage, Long> {

    @Query("SELECT u FROM EnterpriseServiceUsage u WHERE u.enterprise.id = :enterpriseId " +
            "AND (:status IS NULL OR u.status = :status)")
    Page<EnterpriseServiceUsage> findByEnterpriseIdAndStatus(
            @Param("enterpriseId") Long enterpriseId,
            @Param("status") UsageStatus status,
            Pageable pageable);

    void deleteAllByEnterpriseId(Long enterpriseId);

    java.util.List<EnterpriseServiceUsage> findByEnterpriseIdInAndStatus(java.util.List<Long> enterpriseIds, UsageStatus status);
}
