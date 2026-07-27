package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO trả về danh sách doanh nghiệp kèm thống kê tiếp xúc.
 * Dùng cho trang "Quản lý tiếp xúc" với phân trang phía server.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResEnterpriseInteractionSummaryDTO {

    private Long enterpriseId;
    private String enterpriseName;

    /** Tổng số lần tiếp xúc của doanh nghiệp */
    private Long interactionCount;

    /** Thời gian tiếp xúc gần nhất */
    private Instant latestInteractionDate;

    /** Nhân viên phụ trách tiếp xúc gần nhất */
    private String consultantName;
}
