package vn.viettel.khdn.crm_DN_VNR20K_2K.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    @Query(value = """
            SELECT u FROM User u
            WHERE (:role IS NULL OR u.role = :role)
              AND (:status IS NULL OR UPPER(u.status) = UPPER(:status))
              AND (:regionFilter IS NULL OR u.managedRegion = :regionFilter)
              AND (
                :keyword IS NULL
                OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR u.phone LIKE CONCAT('%', :keyword, '%')
              )
            """)
    Page<User> searchUsers(
            @Param("role") vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum role,
            @Param("status") String status,
            @Param("keyword") String keyword, 
            @Param("regionFilter") vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum regionFilter,
            Pageable pageable);

    @Query("SELECT c.id, u FROM User u JOIN u.managedCommunes c WHERE u.role = :role AND c.id IN :communeIds")
    java.util.List<Object[]> findUsersByRoleAndCommuneIds(@Param("role") vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum role, @Param("communeIds") java.util.List<Long> communeIds);

    @Query("SELECT u FROM User u JOIN u.managedCommunes c WHERE u.role = :role AND c.id = :communeId")
    java.util.List<User> findUsersByRoleAndCommuneId(@Param("role") vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum role, @Param("communeId") Long communeId);
}
