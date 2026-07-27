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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.ByteArrayInputStream;
import java.io.IOException;

import jakarta.validation.Valid;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ImportResultDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqEnterpriseCreateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqEnterpriseUpdateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResEnterpriseDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.service.EnterpriseService;
import vn.viettel.khdn.crm_DN_VNR20K_2K.util.error.IdInvalidException;

@RestController
@RequestMapping("/enterprises")
public class EnterpriseController {

    private final EnterpriseService enterpriseService;

    public EnterpriseController(EnterpriseService enterpriseService) {
        this.enterpriseService = enterpriseService;
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<ResEnterpriseDTO> create(@Valid @RequestBody ReqEnterpriseCreateDTO dto)
            throws IdInvalidException {
        ResEnterpriseDTO created = enterpriseService.createEnterprise(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<Page<ResEnterpriseDTO>> list(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "industry", required = false) String industry,
            @RequestParam(value = "region", required = false) java.util.List<String> region,
            @RequestParam(value = "type", required = false) java.util.List<String> type,
            @RequestParam(value = "consultantId", required = false) Long consultantId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        int safeSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Order.desc("createdAt")));
        Page<ResEnterpriseDTO> result = enterpriseService.searchEnterprises(keyword, status, industry, region, type,
                consultantId, pageable);
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<ResEnterpriseDTO> getById(@PathVariable("id") Long id) throws IdInvalidException {
        return ResponseEntity.ok(enterpriseService.getEnterpriseById(id));
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{id}")
    public ResponseEntity<ResEnterpriseDTO> update(@PathVariable("id") Long id,
            @Valid @RequestBody ReqEnterpriseUpdateDTO dto) throws IdInvalidException {
        return ResponseEntity.ok(enterpriseService.updateEnterprise(id, dto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) throws IdInvalidException {
        enterpriseService.deleteEnterprise(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/industries")
    public ResponseEntity<java.util.List<vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResIndustryDTO>> getIndustries() {
        java.util.List<vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResIndustryDTO> industries = java.util.Arrays
                .stream(vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.Industry.values())
                .map(industry -> new vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResIndustryDTO(industry.name(),
                        industry.getDisplayName()))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(industries);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'MANAGER', 'CONSULTANT')")
    @GetMapping("/export")
    public ResponseEntity<Resource> exportEnterprises(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "industry", required = false) String industry,
            @RequestParam(value = "region", required = false) java.util.List<String> region,
            @RequestParam(value = "type", required = false) java.util.List<String> type,
            @RequestParam(value = "group", required = false, defaultValue = "VNR") String group) throws IOException {

        ByteArrayInputStream in = enterpriseService.exportToExcel(keyword, status, industry, region, type);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=doanh_nghiep_export.xlsx");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(
                        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/import/template")
    public ResponseEntity<Resource> downloadTemplate() throws IOException {
        ByteArrayInputStream in = enterpriseService.getTemplateExcel();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=doanh_nghiep_template.xlsx");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(
                        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/import")
    public ResponseEntity<ImportResultDTO> importEnterprises(
            @RequestParam("file") MultipartFile file) {
        ImportResultDTO result = enterpriseService.importFromExcel(file);
        return ResponseEntity.ok(result);
    }
}
