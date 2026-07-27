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
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqServiceCreateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqServiceUpdateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResServiceDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.service.ViettelServiceService;

@RestController
@RequestMapping("/viettel-services")
public class ViettelServiceController {

    private final ViettelServiceService serviceService;

    public ViettelServiceController(ViettelServiceService serviceService) {
        this.serviceService = serviceService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'MANAGER')")
    @PostMapping
    public ResponseEntity<ResServiceDTO> create(@Valid @RequestBody ReqServiceCreateDTO dto) {
        ResServiceDTO created = serviceService.createService(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<Page<ResServiceDTO>> list(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "isActive", required = false) Boolean isActive,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        int safeSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Order.asc("serviceName")));
        Page<ResServiceDTO> result = serviceService.searchServices(keyword, isActive, pageable);
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<ResServiceDTO> getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(serviceService.getServiceById(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<ResServiceDTO> update(@PathVariable("id") Long id,
            @Valid @RequestBody ReqServiceUpdateDTO dto) {
        return ResponseEntity.ok(serviceService.updateService(id, dto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        serviceService.deleteService(id);
        return ResponseEntity.noContent().build();
    }
}
