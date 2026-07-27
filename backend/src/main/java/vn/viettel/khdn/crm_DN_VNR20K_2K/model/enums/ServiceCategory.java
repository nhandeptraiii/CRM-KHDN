package vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums;

public enum ServiceCategory {
    ESSENTIAL_PRODUCT("Sản phẩm thiết yếu"),
    ENTERPRISE_MANAGEMENT("Quản trị doanh nghiệp"),
    VIETTEL_CLOUD("Viettel Cloud"),
    SPECIALIZED_PRODUCT("Sản phẩm chuyên ngành");

    private final String description;

    ServiceCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
