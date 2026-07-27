package vn.viettel.khdn.crm_DN_VNR20K_2K.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqAppointmentCreateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqAppointmentUpdateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResAppointmentDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResInteractionDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionResult;
import vn.viettel.khdn.crm_DN_VNR20K_2K.service.AppointmentService;
import vn.viettel.khdn.crm_DN_VNR20K_2K.util.error.IdInvalidException;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    /**
     * POST /appointments
     * Tạo lịch hẹn mới. scheduledTime phải ở tương lai (@Future trong DTO).
     */
    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<ResAppointmentDTO> create(
            @Valid @RequestBody ReqAppointmentCreateDTO dto) throws Exception {
        ResAppointmentDTO created = appointmentService.createAppointment(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * GET /appointments
     * Danh sách lịch hẹn có lọc + phân trang.
     * CONSULTANT chỉ thấy lịch hẹn của mình (xử lý ở service).
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<Page<ResAppointmentDTO>> list(
            @RequestParam(value = "enterpriseId", required = false) Long enterpriseId,
            @RequestParam(value = "consultantId", required = false) Long consultantId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) throws Exception {

        int safeSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(
                Math.max(page, 0), safeSize,
                Sort.by(Sort.Order.asc("scheduledTime")));

        return ResponseEntity.ok(
                appointmentService.searchAppointments(enterpriseId, consultantId, status, pageable));
    }

    /**
     * GET /appointments/{id}
     * Chi tiết 1 lịch hẹn. Kiểm tra quyền truy cập ở service.
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<ResAppointmentDTO> getById(
            @PathVariable("id") Long id) throws Exception {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    /**
     * PUT /appointments/{id}
     * Cập nhật lịch hẹn. Chỉ khi status = SCHEDULED / REMINDED.
     */
    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{id}")
    public ResponseEntity<ResAppointmentDTO> update(
            @PathVariable("id") Long id,
            @Valid @RequestBody ReqAppointmentUpdateDTO dto) throws Exception {
        return ResponseEntity.ok(appointmentService.updateAppointment(id, dto));
    }

    /**
     * DELETE /appointments/{id}
     * Huỷ/Từ chối lịch hẹn (đặt status = REJECTED, không xoá DB).
     */
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{id}")
    public ResponseEntity<ResAppointmentDTO> reject(
            @PathVariable("id") Long id) throws Exception {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id));
    }

    /**
     * POST /appointments/{id}/confirm  (multipart/form-data)
     * Xác nhận hoàn thành cuộc hẹn — Phương án B:
     *   - result      : InteractionResult (bắt buộc)
     *   - description : String (tuỳ chọn, ghi chú sau khi gặp)
     *   - photos      : MultipartFile[] (tuỳ chọn, ảnh gặp mặt)
     *
     * → Tự động tạo bản ghi Interaction và trả về ResInteractionDTO.
     */
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR','MANAGER','ACCOUNT_MANAGER','CONSULTANT')")
    @PostMapping(value = "/{id}/confirm", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResInteractionDTO> confirm(
            @PathVariable("id") Long id,
            @RequestParam("result") String resultStr,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "newUsages", required = false) String newUsagesJson,
            @RequestPart(value = "photos", required = false) MultipartFile[] photos) throws Exception {

        InteractionResult result = null;
        try {
            result = InteractionResult.valueOf(resultStr.trim().toUpperCase());
        } catch (Exception e) {
            throw new IdInvalidException("Kết quả cuộc hẹn không hợp lệ: [" + resultStr + "]");
        }

        ResInteractionDTO interactionDTO = appointmentService.confirmAppointment(id, result, description, newUsagesJson, photos);
        return ResponseEntity.ok(interactionDTO);
    }
}
