package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.time.Instant;
import java.util.List;

import lombok.Getter;
import lombok.Setter;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionResult;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionType;

@Getter
@Setter
public class ResInteractionDTO {
    private Long id;

    private Long enterpriseId;
    private String enterpriseName;
    private String enterpriseEmail;

    private Long contactId;
    private String contactName;

    private Long consultantId;
    private String consultantName;

    private InteractionType interactionType;
    private InteractionResult result;

    // Trả về chuẩn ISO 8601 (vd: "2026-04-16T02:00:00Z") mặc định của Jackson
    // để JS parse bằng new Date() ở mọi nơi trong frontend một cách chính xác
    private Instant interactionTime;

    private String location;
    private String description;

    // Ảnh gặp mặt — được upload khi AM xác nhận lịch hẹn
    // Mỗi phần tử là đường dẫn public: "appointments/{id}/filename.jpg"
    private List<String> photoPaths;

    // Danh sách các dịch vụ hợp đồng đã ký trong quá trình tiếp xúc này
    private List<ResUsageDTO> usages;

    private Instant createdAt;

    private Instant updatedAt;
}
