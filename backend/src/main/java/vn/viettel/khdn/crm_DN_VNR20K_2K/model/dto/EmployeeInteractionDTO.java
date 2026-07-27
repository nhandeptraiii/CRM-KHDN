package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

public class EmployeeInteractionDTO {

    private String employeeName;
    private long interactionCount;

    public EmployeeInteractionDTO(String employeeName, long interactionCount) {
        this.employeeName = employeeName;
        this.interactionCount = interactionCount;
    }

    // Getter và Setter
    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public long getInteractionCount() {
        return interactionCount;
    }

    public void setInteractionCount(long interactionCount) {
        this.interactionCount = interactionCount;
    }
}
