package vn.viettel.khdn.crm_DN_VNR20K_2K.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.ViettelService;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqServiceCreateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqServiceUpdateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResServiceDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.ViettelServiceRepository;
import jakarta.persistence.EntityNotFoundException;

@Service
public class ViettelServiceService {

    private final ViettelServiceRepository serviceRepository;

    public ViettelServiceService(ViettelServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    public ResServiceDTO createService(ReqServiceCreateDTO dto) {
        ViettelService service = new ViettelService();
        service.setServiceCode(dto.getServiceCode());
        service.setServiceName(dto.getServiceName());
        service.setDescription(dto.getDescription());
        service.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        ViettelService saved = serviceRepository.save(service);
        return toDTO(saved);
    }

    public Page<ResServiceDTO> searchServices(String keyword, Boolean isActive, Pageable pageable) {
        Page<ViettelService> page = serviceRepository.searchServices(
                keyword != null && !keyword.isBlank() ? keyword.trim() : null,
                isActive,
                pageable);
        return page.map(this::toDTO);
    }

    public ResServiceDTO getServiceById(Long id) {
        ViettelService service = serviceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy dịch vụ Viettel với ID: " + id));
        return toDTO(service);
    }

    public ResServiceDTO updateService(Long id, ReqServiceUpdateDTO dto) {
        ViettelService service = serviceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy dịch vụ Viettel với ID: " + id));

        if (dto.getServiceCode() != null)
            service.setServiceCode(dto.getServiceCode());
        if (dto.getServiceName() != null)
            service.setServiceName(dto.getServiceName());
        if (dto.getDescription() != null)
            service.setDescription(dto.getDescription());
        if (dto.getIsActive() != null)
            service.setIsActive(dto.getIsActive());

        ViettelService updated = serviceRepository.save(service);
        return toDTO(updated);
    }

    public void deleteService(Long id) {
        if (!serviceRepository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy dịch vụ Viettel với ID: " + id);
        }
        serviceRepository.deleteById(id);
    }

    private ResServiceDTO toDTO(ViettelService s) {
        ResServiceDTO dto = new ResServiceDTO();
        dto.setId(s.getId());
        dto.setServiceCode(s.getServiceCode());
        dto.setServiceName(s.getServiceName());
        dto.setDescription(s.getDescription());
        dto.setIsActive(s.getIsActive());
        dto.setCreatedAt(s.getCreatedAt());
        dto.setUpdatedAt(s.getUpdatedAt());
        return dto;
    }
}
