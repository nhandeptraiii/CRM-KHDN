package vn.viettel.khdn.crm_DN_VNR20K_2K.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.Appointment;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.Enterprise;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.EnterpriseContact;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.Interaction;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.User;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqAppointmentCreateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqAppointmentUpdateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqUsageCreateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResAppointmentDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResInteractionDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.AppointmentStatus;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionResult;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.AppointmentRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.EnterpriseContactRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.EnterpriseRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.InteractionRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.UserRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.util.error.IdInvalidException;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final EnterpriseRepository enterpriseRepository;
    private final EnterpriseContactRepository contactRepository;
    private final UserRepository userRepository;
    private final InteractionRepository interactionRepository;
    private final EmailService emailService;
    private final EnterpriseServiceUsageService usageService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Value("${crm.upload.path:uploads}")
    private String uploadBasePath;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            EnterpriseRepository enterpriseRepository,
            EnterpriseContactRepository contactRepository,
            UserRepository userRepository,
            InteractionRepository interactionRepository,
            EmailService emailService,
            EnterpriseServiceUsageService usageService,
            com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
        this.appointmentRepository = appointmentRepository;
        this.enterpriseRepository = enterpriseRepository;
        this.contactRepository = contactRepository;
        this.userRepository = userRepository;
        this.interactionRepository = interactionRepository;
        this.emailService = emailService;
        this.usageService = usageService;
        this.objectMapper = objectMapper;
    }

    // ===================== Lấy user hiện tại =====================

    private User getCurrentUser() throws IdInvalidException {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IdInvalidException("Không thể xác định người dùng hiện tại"));
    }

    // ===================== CRUD cơ bản =====================

    /**
     * Tạo lịch hẹn mới.
     * scheduledTime được validate @Future ở tầng DTO.
     */
    public ResAppointmentDTO createAppointment(ReqAppointmentCreateDTO dto) throws Exception {
        Enterprise enterprise = enterpriseRepository.findById(dto.getEnterpriseId())
                .orElseThrow(() -> new IdInvalidException(
                        "Không tìm thấy doanh nghiệp với ID: " + dto.getEnterpriseId()));

        EnterpriseContact contact = null;
        if (dto.getContactId() != null) {
            contact = contactRepository.findById(dto.getContactId())
                    .orElseThrow(() -> new IdInvalidException(
                            "Không tìm thấy người liên hệ với ID: " + dto.getContactId()));
            if (!contact.getEnterprise().getId().equals(enterprise.getId())) {
                throw new IdInvalidException("Người liên hệ ID " + dto.getContactId()
                        + " không thuộc Doanh nghiệp ID " + dto.getEnterpriseId());
            }
        }

        User consultant = getCurrentUser();

        Appointment appointment = new Appointment();
        appointment.setEnterprise(enterprise);
        appointment.setContact(contact);
        appointment.setConsultant(consultant);
        appointment.setAppointmentType(dto.getAppointmentType());
        appointment.setScheduledTime(dto.getScheduledTime());
        appointment.setLocation(dto.getLocation());
        appointment.setPurpose(dto.getPurpose());

        Appointment savedAppointment = appointmentRepository.save(appointment);

        // Gửi email xác nhận chạy ngầm (không đợi 5s SMTP timeout làm đơ API)
        new Thread(() -> {
            emailService.sendAppointmentConfirmation(consultant.getEmail(), savedAppointment);
        }).start();

        return toDTO(savedAppointment);
    }

    /**
     * Tìm kiếm lịch hẹn có lọc + phân trang.
     * CONSULTANT chỉ được thấy lịch hẹn của mình.
     */
    public Page<ResAppointmentDTO> searchAppointments(
            Long enterpriseId, Long consultantId, String statusStr, Pageable pageable) throws Exception {

        AppointmentStatus status = null;
        if (statusStr != null && !statusStr.isBlank()) {
            try {
                status = AppointmentStatus.valueOf(statusStr.toUpperCase());
            } catch (Exception ignored) {
            }
        }

        User currentUser = getCurrentUser();
        Long filterConsultantId = consultantId;

        vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum regionFilter = null;
        boolean hasRestrictTypes = false;
        java.util.List<vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.EnterpriseTypeEnum> restrictTypes = null;

        if (currentUser.getRole() == RoleEnum.MANAGER) {
            regionFilter = currentUser.getRegion();
        } else if (currentUser.getRole() == RoleEnum.ACCOUNT_MANAGER) {
            filterConsultantId = currentUser.getId();
        }

        return appointmentRepository
                .searchAppointments(enterpriseId, filterConsultantId, status, regionFilter, hasRestrictTypes, restrictTypes, pageable)
                .map(this::toDTO);
    }

    /**
     * Lấy chi tiết 1 lịch hẹn. Kiểm tra quyền truy cập.
     */
    public ResAppointmentDTO getAppointmentById(Long id) throws Exception {
        Appointment appointment = findAndCheckPermission(id);
        return toDTO(appointment);
    }

    /**
     * Cập nhật thông tin lịch hẹn — chỉ khi status là SCHEDULED hoặc REMINDED.
     */
    public ResAppointmentDTO updateAppointment(Long id, ReqAppointmentUpdateDTO dto) throws Exception {
        Appointment appointment = findAndCheckPermission(id);

        if (appointment.getStatus() == AppointmentStatus.CONFIRMED
                || appointment.getStatus() == AppointmentStatus.REJECTED) {
            throw new IdInvalidException("Không thể cập nhật lịch hẹn đã "
                    + (appointment.getStatus() == AppointmentStatus.CONFIRMED ? "xác nhận" : "bị từ chối"));
        }

        if (dto.getAppointmentType() != null)
            appointment.setAppointmentType(dto.getAppointmentType());
        if (dto.getScheduledTime() != null) {
            appointment.setScheduledTime(dto.getScheduledTime());
            // Reset flags khi dời lịch để scheduler gửi lại email
            appointment.setReminder24hSent(false);
            appointment.setReminder1hSent(false);
            appointment.setStatus(AppointmentStatus.SCHEDULED);
        }
        if (dto.getLocation() != null)
            appointment.setLocation(dto.getLocation());
        if (dto.getPurpose() != null)
            appointment.setPurpose(dto.getPurpose());

        return toDTO(appointmentRepository.save(appointment));
    }

    /**
     * Huỷ/Từ chối lịch hẹn — đặt status = REJECTED.
     */
    public ResAppointmentDTO cancelAppointment(Long id) throws Exception {
        Appointment appointment = findAndCheckPermission(id);

        if (appointment.getStatus() == AppointmentStatus.CONFIRMED) {
            throw new IdInvalidException("Không thể từ chối lịch hẹn đã xác nhận hoàn thành");
        }
        if (appointment.getStatus() == AppointmentStatus.REJECTED) {
            throw new IdInvalidException("Lịch hẹn đã bị từ chối/hủy trước đó");
        }

        appointment.setStatus(AppointmentStatus.REJECTED);
        return toDTO(appointmentRepository.save(appointment));
    }

    /**
     * Xác nhận hoàn thành cuộc hẹn (Phương án B).
     *
     * Luồng xử lý:
     *   1. Lưu ảnh vào uploads/appointments/{appointmentId}/
     *   2. Tạo Interaction với: result, description, photoPaths, và thông tin từ Appointment
     *   3. Cập nhật Appointment: status=CONFIRMED, liên kết interaction_id
     *   4. Trả về ResInteractionDTO
     */
    public ResInteractionDTO confirmAppointment(
            Long id,
            InteractionResult result,
            String description,
            String newUsagesJson,
            MultipartFile[] photos) throws Exception {

        Appointment appointment = findAndCheckPermission(id);

        if (appointment.getStatus() == AppointmentStatus.CONFIRMED) {
            throw new IdInvalidException("Lịch hẹn này đã được xác nhận trước đó");
        }
        if (appointment.getStatus() == AppointmentStatus.REJECTED) {
            throw new IdInvalidException("Không thể xác nhận lịch hẹn đã bị từ chối/hủy");
        }
        if (result == null) {
            throw new IdInvalidException("Kết quả cuộc hẹn (result) là bắt buộc khi xác nhận");
        }

        // 1. Lưu ảnh gặp mặt, đường dẫn sẽ được lưu vào Interaction
        List<String> savedPhotoPaths = savePhotos(id, photos);

        // 2. Tạo bản ghi Interaction — nơi chứa toàn bộ kết quả thực tế của cuộc hẹn
        Interaction interaction = new Interaction();
        interaction.setEnterprise(appointment.getEnterprise());
        interaction.setContact(appointment.getContact());
        interaction.setCreatedBy(getCurrentUser());
        interaction.setInteractionType(appointment.getAppointmentType());
        interaction.setInteractionTime(appointment.getScheduledTime());
        interaction.setLocation(appointment.getLocation());
        interaction.setResult(result);
        interaction.setDescription(description);
        // Lưu đường dẫn ảnh vào Interaction (không phải Appointment)
        if (!savedPhotoPaths.isEmpty()) {
            interaction.setPhotoPaths(String.join(",", savedPhotoPaths));
        }
        Interaction savedInteraction = interactionRepository.save(interaction);

        // Lưu hợp đồng dịch vụ nếu CLOSED_WON
        if (result == InteractionResult.CLOSED_WON) {
            if (newUsagesJson == null || newUsagesJson.isBlank()) {
                throw new IdInvalidException("Khi chốt hợp đồng thành công (CLOSED_WON), bắt buộc phải nhập ít nhất 1 dịch vụ đã ký.");
            }
            try {
                com.fasterxml.jackson.core.type.TypeReference<List<ReqUsageCreateDTO>> typeRef = new com.fasterxml.jackson.core.type.TypeReference<>() {};
                List<ReqUsageCreateDTO> usages = objectMapper.readValue(newUsagesJson, typeRef);
                if (usages.isEmpty()) {
                    throw new IdInvalidException("Danh sách dịch vụ đã ký không được trống.");
                }
                for (ReqUsageCreateDTO usageDto : usages) {
                    usageService.createUsage(appointment.getEnterprise().getId(), usageDto, savedInteraction);
                }
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                throw new IdInvalidException("Định dạng dữ liệu dịch vụ đã ký không hợp lệ: " + e.getMessage());
            }
        }

        // 3. Cập nhật Appointment: đánh dấu đã xác nhận và liên kết Interaction
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setInteraction(savedInteraction);
        appointmentRepository.save(appointment);

        // 4. Trả về ResInteractionDTO với đầy đủ thông tin kết quả
        return toInteractionDTO(savedInteraction);
    }

    // ===================== Upload ảnh =====================

    private List<String> savePhotos(Long appointmentId, MultipartFile[] photos) throws IOException {
        List<String> paths = new ArrayList<>();
        if (photos == null || photos.length == 0) {
            return paths;
        }

        // Resolve đường dẫn tuyệt đối để tránh bị resolve vào thư mục temp Tomcat
        // Khi uploadBasePath là đường dẫn tương đối (vd: "uploads"),
        // dùng System.getProperty("user.dir") để lấy working directory thực của JVM
        Path baseDir;
        Path configuredPath = Paths.get(uploadBasePath);
        if (configuredPath.isAbsolute()) {
            baseDir = configuredPath;
        } else {
            baseDir = Paths.get(System.getProperty("user.dir")).resolve(uploadBasePath);
        }

        // Thư mục: {uploadBasePath}/appointments/{appointmentId}/
        Path dir = baseDir.resolve("appointments").resolve(String.valueOf(appointmentId));
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

            // Dùng Files.copy(InputStream) thay vì transferTo(File) để tránh lỗi
            // FileNotFoundException khi file temp Tomcat bị xoá trước khi transfer
            try (InputStream inputStream = photo.getInputStream()) {
                Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            }

            // Đường dẫn public (phục vụ qua /uploads/**)
            paths.add("appointments/" + appointmentId + "/" + fileName);
        }

        return paths;
    }

    // ===================== Kiểm tra quyền =====================

    private Appointment findAndCheckPermission(Long id) throws Exception {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy lịch hẹn với ID: " + id));

        User currentUser = getCurrentUser();
        boolean isAdminOrOperator = currentUser.getRole() == RoleEnum.ADMIN || currentUser.getRole() == RoleEnum.OPERATOR;
        boolean isManagerAllowed = currentUser.getRole() == RoleEnum.MANAGER && appointment.getEnterprise().getRegion() == currentUser.getRegion();
        boolean isConsultantAllowed = currentUser.getRole() == RoleEnum.CONSULTANT;
        boolean isOwner = appointment.getConsultant().getId().equals(currentUser.getId());

        if (!isAdminOrOperator && !isManagerAllowed && !isConsultantAllowed && !isOwner) {
            throw new Exception("Bạn không có quyền truy cập lịch hẹn này!");
        }

        return appointment;
    }

    // ===================== Mapping DTO =====================

    public ResAppointmentDTO toDTO(Appointment a) {
        ResAppointmentDTO dto = new ResAppointmentDTO();
        dto.setId(a.getId());

        dto.setEnterpriseId(a.getEnterprise().getId());
        dto.setEnterpriseName(a.getEnterprise().getName());

        if (a.getContact() != null) {
            dto.setContactId(a.getContact().getId());
            dto.setContactName(a.getContact().getFullName());
        }

        dto.setConsultantId(a.getConsultant().getId());
        dto.setConsultantName(a.getConsultant().getFullName());
        dto.setConsultantEmail(a.getConsultant().getEmail());

        dto.setAppointmentType(a.getAppointmentType());
        dto.setScheduledTime(a.getScheduledTime());
        dto.setLocation(a.getLocation());
        dto.setPurpose(a.getPurpose());

        dto.setStatus(a.getStatus());
        dto.setReminder24hSent(a.getReminder24hSent());
        dto.setReminder1hSent(a.getReminder1hSent());

        // Sau khi xác nhận: interactionId để frontend truy vấn Interaction nếu cần
        if (a.getInteraction() != null) {
            dto.setInteractionId(a.getInteraction().getId());
        }

        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());

        return dto;
    }

    private ResInteractionDTO toInteractionDTO(Interaction i) {
        ResInteractionDTO dto = new ResInteractionDTO();
        dto.setId(i.getId());
        dto.setEnterpriseId(i.getEnterprise().getId());
        dto.setEnterpriseName(i.getEnterprise().getName());

        if (i.getContact() != null) {
            dto.setContactId(i.getContact().getId());
            dto.setContactName(i.getContact().getFullName());
        }

        vn.viettel.khdn.crm_DN_VNR20K_2K.model.User entConsultant = i.getEnterprise().getConsultant();
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

        // Chuyển photoPaths String → List<String>
        if (i.getPhotoPaths() != null && !i.getPhotoPaths().isBlank()) {
            dto.setPhotoPaths(Arrays.asList(i.getPhotoPaths().split(",")));
        } else {
            dto.setPhotoPaths(new ArrayList<>());
        }

        dto.setCreatedAt(i.getCreatedAt());
        dto.setUpdatedAt(i.getUpdatedAt());
        return dto;
    }
}
