package vn.viettel.khdn.crm_DN_VNR20K_2K.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.Enterprise;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.EnterpriseContact;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.Interaction;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.User;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqInteractionCreateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqInteractionUpdateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResInteractionDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionResult;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionType;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.EnterpriseContactRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.EnterpriseRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.InteractionRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.UserRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.util.error.IdInvalidException;

@Service
public class InteractionService {

    private final InteractionRepository interactionRepository;
    private final EnterpriseRepository enterpriseRepository;
    private final EnterpriseContactRepository contactRepository;
    private final UserRepository userRepository;
    private final EnterpriseServiceUsageService usageService;

    @Value("${crm.upload.path:uploads}")
    private String uploadBasePath;

    public InteractionService(InteractionRepository interactionRepository,
            EnterpriseRepository enterpriseRepository,
            EnterpriseContactRepository contactRepository,
            UserRepository userRepository,
            EnterpriseServiceUsageService usageService) {
        this.interactionRepository = interactionRepository;
        this.enterpriseRepository = enterpriseRepository;
        this.contactRepository = contactRepository;
        this.userRepository = userRepository;
        this.usageService = usageService;
    }

    private User getCurrentUser() throws IdInvalidException {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IdInvalidException("Không thể xác định người dùng hiện tại"));
    }

    public ResInteractionDTO createInteraction(ReqInteractionCreateDTO dto) throws Exception {
        return createInteraction(dto, null);
    }

    public ResInteractionDTO createInteraction(ReqInteractionCreateDTO dto, MultipartFile[] photos) throws Exception {
        Enterprise enterprise = enterpriseRepository.findById(dto.getEnterpriseId())
                .orElseThrow(
                        () -> new IdInvalidException("Không tìm thấy doanh nghiệp với ID: " + dto.getEnterpriseId()));

        EnterpriseContact contact = null;
        if (dto.getContactId() != null) {
            contact = contactRepository.findById(dto.getContactId())
                    .orElseThrow(
                            () -> new IdInvalidException("Không tìm thấy người liên hệ với ID: " + dto.getContactId()));

            if (!contact.getEnterprise().getId().equals(enterprise.getId())) {
                throw new IdInvalidException("Người liên hệ ID " + dto.getContactId() + " không thuộc Doanh nghiệp ID "
                        + dto.getEnterpriseId());
            }
        }

        User currentUser = getCurrentUser();

        User consultant = enterprise.getConsultant();
        if (consultant == null) {
            if (enterprise.getType() == vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseTypeEnum.VNR2000 || 
                enterprise.getType() == vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseTypeEnum.VNR20K) {
                if (dto.getConsultantId() == null) {
                    throw new IdInvalidException("Doanh nghiệp chưa có người phụ trách. Vui lòng chọn người phụ trách cho lượt tiếp xúc này.");
                }
                consultant = userRepository.findById(dto.getConsultantId())
                        .orElseThrow(() -> new IdInvalidException("Không tìm thấy người phụ trách với ID: " + dto.getConsultantId()));
                
                enterprise.setConsultant(consultant);
                enterpriseRepository.save(enterprise);
            }
        }

        Interaction interaction = new Interaction();
        interaction.setEnterprise(enterprise);
        interaction.setContact(contact);
        interaction.setCreatedBy(currentUser);
        interaction.setInteractionType(dto.getInteractionType());
        interaction.setResult(dto.getResult());
        interaction.setInteractionTime(dto.getInteractionTime());
        interaction.setLocation(dto.getLocation());
        interaction.setDescription(dto.getDescription());

        Interaction saved = interactionRepository.save(interaction);

        List<String> savedPhotoPaths = savePhotos(saved.getId(), photos);
        if (!savedPhotoPaths.isEmpty()) {
            saved.setPhotoPaths(String.join(",", savedPhotoPaths));
            saved = interactionRepository.save(saved);
        }

        // Xử lý lưu hợp đồng dịch vụ nếu là CLOSED_WON
        if (dto.getResult() == InteractionResult.CLOSED_WON) {
            if (dto.getNewUsages() == null || dto.getNewUsages().isEmpty()) {
                throw new IdInvalidException("Khi chốt hợp đồng thành công (CLOSED_WON), bắt buộc phải nhập ít nhất 1 dịch vụ đã ký.");
            }
            for (vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqUsageCreateDTO usageDto : dto.getNewUsages()) {
                usageService.createUsage(enterprise.getId(), usageDto, saved);
            }
        }

        return toDTO(saved);
    }

    private List<String> savePhotos(Long interactionId, MultipartFile[] photos) throws IOException {
        List<String> paths = new ArrayList<>();
        if (photos == null || photos.length == 0) {
            return paths;
        }

        Path baseDir;
        Path configuredPath = Paths.get(uploadBasePath);
        if (configuredPath.isAbsolute()) {
            baseDir = configuredPath;
        } else {
            baseDir = Paths.get(System.getProperty("user.dir")).resolve(uploadBasePath);
        }

        Path dir = baseDir.resolve("interactions").resolve(String.valueOf(interactionId));
        Files.createDirectories(dir);

        for (MultipartFile photo : photos) {
            if (photo == null || photo.isEmpty()) continue;

            String originalName = photo.getOriginalFilename();
            String ext = "";
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf("."));
            }

            String fileName = UUID.randomUUID().toString() + ext;
            Path filePath = dir.resolve(fileName);

            try (InputStream inputStream = photo.getInputStream()) {
                Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            }

            paths.add("interactions/" + interactionId + "/" + fileName);
        }

        return paths;
    }

    public Page<ResInteractionDTO> searchInteractions(Long enterpriseId, Long consultantId, String typeStr,
            String resultStr, Pageable pageable) throws Exception {
        InteractionType type = null;
        InteractionResult result = null;

        if (typeStr != null && !typeStr.isBlank()) {
            try {
                type = InteractionType.valueOf(typeStr.toUpperCase());
            } catch (Exception ignored) {
            }
        }
        if (resultStr != null && !resultStr.isBlank()) {
            try {
                result = InteractionResult.valueOf(resultStr.toUpperCase());
            } catch (Exception ignored) {
            }
        }

        User currentUser = getCurrentUser();
        Long filterConsultantId = consultantId;

        vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum regionFilter = null;
        boolean hasRestrictTypes = false;
        java.util.List<vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseTypeEnum> restrictTypes = null;

        if (currentUser.getRole() == vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum.MANAGER) {
            regionFilter = currentUser.getRegion();
        } else if (currentUser.getRole() == vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum.ACCOUNT_MANAGER) {
            filterConsultantId = currentUser.getId();
        }

        Page<Interaction> page = interactionRepository.searchInteractions(enterpriseId, filterConsultantId, type,
                result, regionFilter, hasRestrictTypes, restrictTypes, pageable);
        return page.map(this::toDTO);
    }

    /**
     * Trả về danh sách doanh nghiệp kèm thống kê tiếp xúc (phân trang phía server).
     * Mỗi dòng = 1 doanh nghiệp: tên, số lần tiếp xúc, ngày tiếp xúc gần nhất.
     */
    public org.springframework.data.domain.Page<vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResEnterpriseInteractionSummaryDTO>
            getEnterpriseInteractionSummary(Pageable pageable) throws Exception {

        User currentUser = getCurrentUser();
        Long filterConsultantId = null;
        vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum regionFilter = null;
        boolean hasRestrictTypes = false;
        java.util.List<vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseTypeEnum> restrictTypes = null;

        if (currentUser.getRole() == vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum.MANAGER) {
            regionFilter = currentUser.getRegion();
        } else if (currentUser.getRole() == vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum.ACCOUNT_MANAGER) {
            filterConsultantId = currentUser.getId();
        }

        org.springframework.data.domain.Page<Object[]> rawPage = interactionRepository
                .searchEnterpriseInteractionSummary(
                        filterConsultantId, regionFilter,
                        hasRestrictTypes, restrictTypes, pageable);

        return rawPage.map(row -> {
            vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResEnterpriseInteractionSummaryDTO dto =
                new vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResEnterpriseInteractionSummaryDTO();
            dto.setEnterpriseId(((Number) row[0]).longValue());
            dto.setEnterpriseName((String) row[1]);
            dto.setInteractionCount(((Number) row[2]).longValue());
            dto.setLatestInteractionDate((java.time.Instant) row[3]);
            dto.setConsultantName((String) row[4]);
            return dto;
        });
    }

    public ResInteractionDTO getInteractionById(Long id) throws Exception {
        Interaction interaction = interactionRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy nhật ký tương tác với ID: " + id));
        checkPermission(interaction);
        return toDTO(interaction);
    }

    public ResInteractionDTO updateInteraction(Long id, ReqInteractionUpdateDTO dto) throws Exception {
        return updateInteraction(id, dto, null);
    }

    public ResInteractionDTO updateInteraction(Long id, ReqInteractionUpdateDTO dto, MultipartFile[] photos) throws Exception {
        Interaction interaction = interactionRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy nhật ký tương tác với ID: " + id));

        checkPermission(interaction);

        // Tối ưu: Chỉ cho phép sửa các trường thông tin phụ trợ (sửa lỗi gõ sai)
        // Tuyệt đối không cập nhật interactionType và result để bảo vệ tính toàn vẹn lịch sử CRM
        if (dto.getInteractionTime() != null)
            interaction.setInteractionTime(dto.getInteractionTime());
        if (dto.getLocation() != null)
            interaction.setLocation(dto.getLocation());
        if (dto.getDescription() != null)
            interaction.setDescription(dto.getDescription());

        // Xử lý lưu ảnh tiếp xúc bổ sung / cập nhật
        List<String> savedPhotoPaths = savePhotos(interaction.getId(), photos);
        if (!savedPhotoPaths.isEmpty()) {
            String existingPhotos = interaction.getPhotoPaths();
            if (existingPhotos != null && !existingPhotos.isBlank()) {
                interaction.setPhotoPaths(existingPhotos + "," + String.join(",", savedPhotoPaths));
            } else {
                interaction.setPhotoPaths(String.join(",", savedPhotoPaths));
            }
        }

        Interaction updated = interactionRepository.save(interaction);
        return toDTO(updated);
    }

    public void deleteInteraction(Long id) throws IdInvalidException {
        if (!interactionRepository.existsById(id)) {
            throw new IdInvalidException("Không tìm thấy nhật ký tương tác với ID: " + id);
        }
        interactionRepository.deleteById(id);
    }

    private void checkPermission(Interaction interaction) throws Exception {
        User currentUser = getCurrentUser();
        boolean isAdminOrOperator = currentUser.getRole() == vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum.ADMIN || currentUser.getRole() == vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum.OPERATOR;
        boolean isManagerAllowed = currentUser.getRole() == vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum.MANAGER && interaction.getEnterprise().getRegion() == currentUser.getRegion();
        boolean isConsultantAllowed = currentUser.getRole() == vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum.CONSULTANT;
        User entConsultant = interaction.getEnterprise().getConsultant();
        boolean isOwner = (entConsultant != null && entConsultant.getId().equals(currentUser.getId())) 
                       || interaction.getCreatedBy().getId().equals(currentUser.getId());

        if (!isAdminOrOperator && !isManagerAllowed && !isConsultantAllowed && !isOwner) {
            throw new Exception("Bạn không có quyền truy cập nhật ký tương tác này!");
        }
    }

    private ResInteractionDTO toDTO(Interaction i) {
        ResInteractionDTO dto = new ResInteractionDTO();
        dto.setId(i.getId());
        dto.setEnterpriseId(i.getEnterprise().getId());
        dto.setEnterpriseName(i.getEnterprise().getName());
        dto.setEnterpriseEmail(i.getEnterprise().getEmail());

        if (i.getContact() != null) {
            dto.setContactId(i.getContact().getId());
            dto.setContactName(i.getContact().getFullName());
        }

        User entConsultant = i.getEnterprise().getConsultant();
        if (entConsultant != null) {
            dto.setConsultantId(entConsultant.getId());
            dto.setConsultantName(entConsultant.getFullName());
        } else {
            dto.setConsultantId(null);
            dto.setConsultantName(null);
        }

        dto.setInteractionType(i.getInteractionType());
        dto.setResult(i.getResult());
        dto.setInteractionTime(i.getInteractionTime());
        dto.setLocation(i.getLocation());
        dto.setDescription(i.getDescription());

        // Chuyển chuỗi đường dẫn ảnh thành danh sách
        if (i.getPhotoPaths() != null && !i.getPhotoPaths().isBlank()) {
            dto.setPhotoPaths(java.util.Arrays.asList(i.getPhotoPaths().split(",")));
        } else {
            dto.setPhotoPaths(new java.util.ArrayList<>());
        }

        dto.setCreatedAt(i.getCreatedAt());
        dto.setUpdatedAt(i.getUpdatedAt());

        // Map usages
        if (i.getUsages() != null && !i.getUsages().isEmpty()) {
            java.util.List<vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResUsageDTO> usageDTOs = i.getUsages().stream().map(u -> {
                vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResUsageDTO uDto = new vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResUsageDTO();
                uDto.setId(u.getId());
                uDto.setEnterpriseId(u.getEnterprise().getId());
                uDto.setEnterpriseName(u.getEnterprise().getName());
                uDto.setViettelServiceId(u.getViettelService().getId());
                uDto.setServiceCode(u.getViettelService().getServiceCode());
                uDto.setServiceName(u.getViettelService().getServiceName());
                uDto.setContractNumber(u.getContractNumber());
                uDto.setStartDate(u.getStartDate());
                uDto.setQuantity(u.getQuantity());
                uDto.setStatus(u.getStatus());
                uDto.setInteractionId(i.getId());
                uDto.setInteractionType(i.getInteractionType());
                uDto.setCreatedAt(u.getCreatedAt());
                uDto.setUpdatedAt(u.getUpdatedAt());
                return uDto;
            }).collect(java.util.stream.Collectors.toList());
            dto.setUsages(usageDTOs);
        } else {
            dto.setUsages(new java.util.ArrayList<>());
        }

        return dto;
    }
}
