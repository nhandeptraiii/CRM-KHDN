package vn.viettel.khdn.crm_DN_VNR20K_2K.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResClusterDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResCommuneDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.ClusterRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.CommuneRepository;

@Service
public class LocationService {

    private final ClusterRepository clusterRepository;
    private final CommuneRepository communeRepository;

    public LocationService(ClusterRepository clusterRepository, CommuneRepository communeRepository) {
        this.clusterRepository = clusterRepository;
        this.communeRepository = communeRepository;
    }

    public List<ResClusterDTO> getClustersByRegion(String regionStr) {
        RegionEnum region;
        try {
            region = RegionEnum.valueOf(regionStr.toUpperCase());
        } catch (Exception e) {
            return List.of();
        }

        return clusterRepository.findByRegion(region).stream().map(c -> {
            ResClusterDTO dto = new ResClusterDTO();
            dto.setId(c.getId());
            dto.setName(c.getName());
            dto.setRegion(c.getRegion().name());
            return dto;
        }).collect(Collectors.toList());
    }

    public List<ResCommuneDTO> getCommunesByCluster(Long clusterId) {
        return communeRepository.findByClusterId(clusterId).stream().map(c -> {
            ResCommuneDTO dto = new ResCommuneDTO();
            dto.setId(c.getId());
            dto.setName(c.getName());
            dto.setCode(c.getCode());
            dto.setClusterId(c.getCluster().getId());
            dto.setClusterName(c.getCluster().getName());
            return dto;
        }).collect(Collectors.toList());
    }

    public List<ResCommuneDTO> searchCommunes(String keyword) {
        return communeRepository.searchByName(keyword).stream().map(c -> {
            ResCommuneDTO dto = new ResCommuneDTO();
            dto.setId(c.getId());
            dto.setName(c.getName());
            dto.setCode(c.getCode());
            dto.setClusterId(c.getCluster().getId());
            dto.setClusterName(c.getCluster().getName());
            return dto;
        }).collect(Collectors.toList());
    }
}
