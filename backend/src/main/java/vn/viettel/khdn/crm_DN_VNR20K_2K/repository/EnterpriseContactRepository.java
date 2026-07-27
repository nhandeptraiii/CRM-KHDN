package vn.viettel.khdn.crm_DN_VNR20K_2K.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.EnterpriseContact;

@Repository
public interface EnterpriseContactRepository extends JpaRepository<EnterpriseContact, Long> {

    List<EnterpriseContact> findByEnterpriseIdOrderByIsPrimaryDescFullNameAsc(Long enterpriseId);

    void deleteAllByEnterpriseId(Long enterpriseId);

    List<EnterpriseContact> findByEnterpriseIdAndIsPrimaryTrue(Long enterpriseId);

    List<EnterpriseContact> findByEnterpriseIdInAndIsPrimaryTrue(List<Long> enterpriseIds);
}
