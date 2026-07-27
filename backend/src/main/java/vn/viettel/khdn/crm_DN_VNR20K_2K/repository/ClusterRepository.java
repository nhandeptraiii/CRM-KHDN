package vn.viettel.khdn.crm_DN_VNR20K_2K.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.Cluster;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum;

@Repository
public interface ClusterRepository extends JpaRepository<Cluster, Long> {
    List<Cluster> findByRegion(RegionEnum region);
}
