package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ImportResultDTO {
    private int totalRows = 0;
    private int successCount = 0;
    private int failCount = 0;
    private List<RowErrorDTO> errors = new ArrayList<>();

    public void addError(int rowNumber, String errorMessage) {
        this.errors.add(new RowErrorDTO(rowNumber, errorMessage));
        this.failCount++;
    }

    public void incrementSuccess() {
        this.successCount++;
    }

    public void incrementTotal() {
        this.totalRows++;
    }
}
