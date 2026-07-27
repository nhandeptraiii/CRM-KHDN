package vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums;

import lombok.Getter;

@Getter
public enum RevenueRange {
    UNDER_500M("Dưới 500 triệu"),
    FROM_500M_TO_1B("Từ 500 triệu đến 1 tỷ"),
    OVER_1B("Trên 1 tỷ");

    private final String displayName;

    RevenueRange(String displayName) {
        this.displayName = displayName;
    }
}
