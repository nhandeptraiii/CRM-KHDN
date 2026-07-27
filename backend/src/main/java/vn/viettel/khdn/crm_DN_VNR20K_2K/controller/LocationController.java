package vn.viettel.khdn.crm_DN_VNR20K_2K.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResClusterDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResCommuneDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.service.LocationService;

@RestController
@RequestMapping("/locations")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping("/clusters")
    public ResponseEntity<List<ResClusterDTO>> getClustersByRegion(@RequestParam("region") String region) {
        return ResponseEntity.ok(locationService.getClustersByRegion(region));
    }

    @GetMapping("/communes")
    public ResponseEntity<List<ResCommuneDTO>> getCommunesByClusterId(@RequestParam("clusterId") Long clusterId) {
        return ResponseEntity.ok(locationService.getCommunesByCluster(clusterId));
    }

    @GetMapping("/communes/search")
    public ResponseEntity<List<ResCommuneDTO>> searchCommunes(@RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(locationService.searchCommunes(keyword));
    }
}
