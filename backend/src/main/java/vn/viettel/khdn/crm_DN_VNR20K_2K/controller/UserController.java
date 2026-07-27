package vn.viettel.khdn.crm_DN_VNR20K_2K.controller;

import org.springframework.data.domain.Page;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqChangePasswordDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqResetPasswordDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqUserCreateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqUserUpdateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResUserDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.service.UserService;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ResponseEntity<ResUserDTO> getCurrentUser() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()
                .getName();
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @PostMapping
    public ResponseEntity<ResUserDTO> createUser(@Valid @RequestBody ReqUserCreateDTO dto) {
        ResUserDTO created = userService.createUser(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'MANAGER', 'CONSULTANT')")
    @GetMapping
    public ResponseEntity<Page<ResUserDTO>> getUsers(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "isActive", required = false) Boolean isActive,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        int safeSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Order.asc("fullName")));

        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword : search;

        vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum roleEnum = null;
        if (role != null && !role.trim().isEmpty() && !role.trim().equalsIgnoreCase("ALL")) {
            try {
                roleEnum = vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum.valueOf(role.trim().toUpperCase());
            } catch (Exception ignored) {
            }
        }

        String statusFilter = null;
        if (status != null && !status.trim().isEmpty() && !status.trim().equalsIgnoreCase("ALL")) {
            String st = status.trim();
            if (st.equalsIgnoreCase("true") || st.equalsIgnoreCase("ACTIVE")) {
                statusFilter = "ACTIVE";
            } else if (st.equalsIgnoreCase("false") || st.equalsIgnoreCase("INACTIVE")) {
                statusFilter = "INACTIVE";
            } else {
                statusFilter = st.toUpperCase();
            }
        } else if (statusFilter == null && isActive != null) {
            statusFilter = isActive ? "ACTIVE" : "INACTIVE";
        }

        Page<ResUserDTO> result = userService.searchUsers(roleEnum, statusFilter, kw, pageable);
        return ResponseEntity.ok(result);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<ResUserDTO> getUserById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @PutMapping("/{id}")
    public ResponseEntity<ResUserDTO> updateUser(@PathVariable("id") Long id,
            @Valid @RequestBody ReqUserUpdateDTO dto) {
        ResUserDTO updated = userService.updateUser(id, dto);
        return ResponseEntity.ok(updated);
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ReqChangePasswordDTO req) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()
                .getName();
        ResUserDTO currentUser = userService.getUserByEmail(email);
        userService.changePassword(currentUser.getId(), req.getOldPassword(), req.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công!"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@PathVariable("id") Long id,
            @Valid @RequestBody ReqResetPasswordDTO req) {
        userService.resetPassword(id, req.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công!"));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
