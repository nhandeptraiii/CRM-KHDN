package vn.viettel.khdn.crm_DN_VNR20K_2K.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.Commune;
import java.util.Optional;

@Repository
public interface CommuneRepository extends JpaRepository<Commune, Long> {
    Optional<Commune> findByCode(String code);
    Optional<Commune> findFirstByName(String name);
    java.util.List<Commune> findByClusterId(Long clusterId);
    
    @org.springframework.data.jpa.repository.Query("SELECT c FROM Commune c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    java.util.List<Commune> searchByName(@org.springframework.data.repository.query.Param("keyword") String keyword);
}
