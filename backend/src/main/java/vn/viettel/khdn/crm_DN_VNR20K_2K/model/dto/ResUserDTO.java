package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.time.Instant;
import java.time.LocalDate;

import lombok.Getter;
import lombok.Setter;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;

@Getter
@Setter
public class ResUserDTO {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String gender;

    @JsonAlias({ "date_of_birth", "dateOfBirth" })
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy")
    private LocalDate dateOfBirth;

    private String status;
    private RoleEnum role;
    private RegionEnum region;
    private java.util.List<Long> communeIds;
    private Instant createdAt;
    private Instant updatedAt;
}
