package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.time.Instant;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionResult;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionType;

@Getter
@Setter
public class ReqInteractionCreateDTO {

    @NotNull(message = "ID Doanh nghiệp không được để trống")
    private Long enterpriseId;

    private Long contactId; // Optional

    @NotNull(message = "Loại tương tác không được để trống")
    private InteractionType interactionType;

    private InteractionResult result;

    @NotNull(message = "Thời gian tương tác không được để trống")
    private Instant interactionTime;

    @Size(max = 255, message = "Địa điểm tối đa 255 ký tự")
    private String location;

    private String description;

    private Long consultantId;

    @Valid
    private List<ReqUsageCreateDTO> newUsages;
}
