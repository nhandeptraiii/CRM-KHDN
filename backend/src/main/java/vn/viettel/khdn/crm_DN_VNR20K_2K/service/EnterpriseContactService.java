package vn.viettel.khdn.crm_DN_VNR20K_2K.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.Enterprise;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.EnterpriseContact;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqContactCreateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqContactUpdateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResContactDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.EnterpriseContactRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.EnterpriseRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.util.error.IdInvalidException;

@Service
@Transactional
public class EnterpriseContactService {

    private final EnterpriseContactRepository contactRepository;
    private final EnterpriseRepository enterpriseRepository;

    public EnterpriseContactService(EnterpriseContactRepository contactRepository,
            EnterpriseRepository enterpriseRepository) {
        this.contactRepository = contactRepository;
        this.enterpriseRepository = enterpriseRepository;
    }

    // --- Tạo mới ---
    public ResContactDTO createContact(Long enterpriseId, ReqContactCreateDTO dto) throws IdInvalidException {
        Enterprise enterprise = enterpriseRepository.findById(enterpriseId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy doanh nghiệp với ID: " + enterpriseId));

        EnterpriseContact contact = new EnterpriseContact();
        contact.setEnterprise(enterprise);
        contact.setFullName(dto.getFullName());
        contact.setPosition(dto.getPosition());
        contact.setEmail(dto.getEmail());
        contact.setPhone(dto.getPhone());

        Boolean isPrimary = dto.getIsPrimary() != null ? dto.getIsPrimary() : false;
        if (isPrimary) {
            clearPrimaryContacts(enterpriseId);
        }
        contact.setIsPrimary(isPrimary);

        EnterpriseContact saved = contactRepository.save(contact);
        return toDTO(saved);
    }

    // --- Lấy danh sách theo DN ---
    public List<ResContactDTO> getContactsByEnterprise(Long enterpriseId) throws IdInvalidException {
        if (!enterpriseRepository.existsById(enterpriseId)) {
            throw new IdInvalidException("Không tìm thấy doanh nghiệp với ID: " + enterpriseId);
        }
        return contactRepository.findByEnterpriseIdOrderByIsPrimaryDescFullNameAsc(enterpriseId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // --- Lấy chi tiết ---
    public ResContactDTO getContactById(Long enterpriseId, Long contactId) throws IdInvalidException {
        EnterpriseContact contact = findAndValidate(enterpriseId, contactId);
        return toDTO(contact);
    }

    // --- Cập nhật ---
    public ResContactDTO updateContact(Long enterpriseId, Long contactId, ReqContactUpdateDTO dto)
            throws IdInvalidException {
        EnterpriseContact contact = findAndValidate(enterpriseId, contactId);

        if (dto.getFullName() != null)
            contact.setFullName(dto.getFullName());
        if (dto.getPosition() != null)
            contact.setPosition(dto.getPosition());
        if (dto.getEmail() != null)
            contact.setEmail(dto.getEmail());
        if (dto.getPhone() != null)
            contact.setPhone(dto.getPhone());
        if (dto.getIsPrimary() != null) {
            if (dto.getIsPrimary() && !Boolean.TRUE.equals(contact.getIsPrimary())) {
                clearPrimaryContacts(enterpriseId);
            }
            contact.setIsPrimary(dto.getIsPrimary());
        }

        EnterpriseContact updated = contactRepository.save(contact);
        return toDTO(updated);
    }

    // --- Xóa ---
    public void deleteContact(Long enterpriseId, Long contactId) throws IdInvalidException {
        EnterpriseContact contact = findAndValidate(enterpriseId, contactId);
        contactRepository.delete(contact);
    }

    // --- Helper: Validate contact thuộc về DN ---
    private EnterpriseContact findAndValidate(Long enterpriseId, Long contactId) throws IdInvalidException {
        if (!enterpriseRepository.existsById(enterpriseId)) {
            throw new IdInvalidException("Không tìm thấy doanh nghiệp với ID: " + enterpriseId);
        }
        EnterpriseContact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy liên hệ với ID: " + contactId));
        if (!contact.getEnterprise().getId().equals(enterpriseId)) {
            throw new IdInvalidException("Liên hệ ID " + contactId + " không thuộc doanh nghiệp ID " + enterpriseId);
        }
        return contact;
    }

    // --- Helper: Entity → DTO ---
    private ResContactDTO toDTO(EnterpriseContact c) {
        ResContactDTO dto = new ResContactDTO();
        dto.setId(c.getId());
        dto.setEnterpriseId(c.getEnterprise().getId());
        dto.setEnterpriseName(c.getEnterprise().getName());
        dto.setFullName(c.getFullName());
        dto.setPosition(c.getPosition());
        dto.setEmail(c.getEmail());
        dto.setPhone(c.getPhone());
        dto.setIsPrimary(c.getIsPrimary());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        return dto;
    }

    // --- Helper: Clear existing primary contacts ---
    private void clearPrimaryContacts(Long enterpriseId) {
        List<EnterpriseContact> oldPrimaries = contactRepository.findByEnterpriseIdAndIsPrimaryTrue(enterpriseId);
        if (!oldPrimaries.isEmpty()) {
            for (EnterpriseContact old : oldPrimaries) {
                old.setIsPrimary(false);
            }
            contactRepository.saveAll(oldPrimaries);
        }
    }
}
