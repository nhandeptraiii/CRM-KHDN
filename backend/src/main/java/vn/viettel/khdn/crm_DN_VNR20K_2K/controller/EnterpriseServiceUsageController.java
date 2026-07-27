package vn.viettel.khdn.crm_DN_VNR20K_2K.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqUsageCreateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqUsageUpdateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResUsageDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.service.EnterpriseServiceUsageService;

@RestController
@RequestMapping("/enterprises/{enterpriseId}/services")
public class EnterpriseServiceUsageController {

    private final EnterpriseServiceUsageService usageService;

    public EnterpriseServiceUsageController(EnterpriseServiceUsageService usageService) {
        this.usageService = usageService;
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<ResUsageDTO> create(
            @PathVariable("enterpriseId") Long enterpriseId,
            @Valid @RequestBody ReqUsageCreateDTO dto) {
        ResUsageDTO created = usageService.createUsage(enterpriseId, dto, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<Page<ResUsageDTO>> list(
            @PathVariable("enterpriseId") Long enterpriseId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        int safeSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Order.desc("createdAt")));
        Page<ResUsageDTO> result = usageService.getUsagesByEnterprise(enterpriseId, status, pageable);
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{usageId}")
    public ResponseEntity<ResUsageDTO> getById(
            @PathVariable("enterpriseId") Long enterpriseId,
            @PathVariable("usageId") Long usageId) {
        return ResponseEntity.ok(usageService.getUsageById(enterpriseId, usageId));
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{usageId}")
    public ResponseEntity<ResUsageDTO> update(
            @PathVariable("enterpriseId") Long enterpriseId,
            @PathVariable("usageId") Long usageId,
            @Valid @RequestBody ReqUsageUpdateDTO dto) {
        return ResponseEntity.ok(usageService.updateUsage(enterpriseId, usageId, dto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{usageId}")
    public ResponseEntity<Void> delete(
            @PathVariable("enterpriseId") Long enterpriseId,
            @PathVariable("usageId") Long usageId) {
        usageService.deleteUsage(enterpriseId, usageId);
        return ResponseEntity.noContent().build();
    }
}
