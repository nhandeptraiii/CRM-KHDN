package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.time.Instant;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionResult;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.InteractionType;

@Getter
@Setter
public class ReqInteractionUpdateDTO {

    private InteractionType interactionType;

    private InteractionResult result;

    private Instant interactionTime;

    @Size(max = 255, message = "Địa điểm tối đa 255 ký tự")
    private String location;

    private String description;
}
