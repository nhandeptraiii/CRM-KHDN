package vn.viettel.khdn.crm_DN_VNR20K_2K.controller;

import java.util.List;

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
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqContactCreateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqContactUpdateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResContactDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.service.EnterpriseContactService;
import vn.viettel.khdn.crm_DN_VNR20K_2K.util.error.IdInvalidException;

@RestController
@RequestMapping("/enterprises/{enterpriseId}/contacts")
public class EnterpriseContactController {

    private final EnterpriseContactService contactService;

    public EnterpriseContactController(EnterpriseContactService contactService) {
        this.contactService = contactService;
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<ResContactDTO> create(
            @PathVariable("enterpriseId") Long enterpriseId,
            @Valid @RequestBody ReqContactCreateDTO dto) throws IdInvalidException {
        ResContactDTO created = contactService.createContact(enterpriseId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<List<ResContactDTO>> list(
            @PathVariable("enterpriseId") Long enterpriseId) throws IdInvalidException {
        return ResponseEntity.ok(contactService.getContactsByEnterprise(enterpriseId));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{contactId}")
    public ResponseEntity<ResContactDTO> getById(
            @PathVariable("enterpriseId") Long enterpriseId,
            @PathVariable("contactId") Long contactId) throws IdInvalidException {
        return ResponseEntity.ok(contactService.getContactById(enterpriseId, contactId));
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{contactId}")
    public ResponseEntity<ResContactDTO> update(
            @PathVariable("enterpriseId") Long enterpriseId,
            @PathVariable("contactId") Long contactId,
            @Valid @RequestBody ReqContactUpdateDTO dto) throws IdInvalidException {
        return ResponseEntity.ok(contactService.updateContact(enterpriseId, contactId, dto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{contactId}")
    public ResponseEntity<Void> delete(
            @PathVariable("enterpriseId") Long enterpriseId,
            @PathVariable("contactId") Long contactId) throws IdInvalidException {
        contactService.deleteContact(enterpriseId, contactId);
        return ResponseEntity.noContent().build();
    }
}
