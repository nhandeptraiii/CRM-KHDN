package vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;

@Getter
@Setter
public class ReqUserUpdateDTO {

    @Size(max = 150, message = "Họ tên tối đa 150 ký tự")
    private String fullName;

    @Pattern(regexp = "^\\d{10}$", message = "Số điện thoại phải gồm đúng 10 chữ số")
    private String phone;

    private String gender;

    @JsonAlias({ "date_of_birth", "dateOfBirth" })
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy")
    private LocalDate dateOfBirth;

    private String status;

    private RoleEnum role;
    private RegionEnum region;
    private java.util.List<Long> communeIds;
}
