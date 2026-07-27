package vn.viettel.khdn.crm_DN_VNR20K_2K.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.ViettelService;

@Repository
public interface ViettelServiceRepository extends JpaRepository<ViettelService, Long> {

        boolean existsByServiceCode(String serviceCode);

        boolean existsByServiceCodeIgnoreCase(String serviceCode);

        @Query("SELECT s FROM ViettelService s WHERE "
                        + "(:keyword IS NULL OR LOWER(s.serviceName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(s.serviceCode) LIKE LOWER(CONCAT('%', :keyword, '%'))) "
                        + "AND (:isActive IS NULL OR s.isActive = :isActive)")
        Page<ViettelService> searchServices(@Param("keyword") String keyword,
                        @Param("isActive") Boolean isActive, Pageable pageable);

        @Query("SELECT COUNT(s) FROM ViettelService s WHERE s.isActive = true")
        long countActiveServices();
}
