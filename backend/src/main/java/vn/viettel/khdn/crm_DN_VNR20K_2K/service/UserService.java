package vn.viettel.khdn.crm_DN_VNR20K_2K.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.User;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqUserCreateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ReqUserUpdateDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResUserDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.UserRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.CommuneRepository;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.Commune;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CommuneRepository communeRepository;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            CommuneRepository communeRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.communeRepository = communeRepository;
    }

    public User handleGetUserByUsername(String username) {
        return userRepository.findByEmail(username).orElse(null);
    }

    public ResUserDTO createUser(ReqUserCreateDTO dto) {
        User user = new User();
        user.setFullName(dto.getFullName());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setPhone(dto.getPhone());
        user.setGender(dto.getGender());
        user.setDateOfBirth(dto.getDateOfBirth());
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()
                .getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User không tồn tại"));

        RoleEnum assignedRole = dto.getRole() != null ? dto.getRole() : RoleEnum.CONSULTANT;

        if (currentUser.getRole() == RoleEnum.OPERATOR && assignedRole == RoleEnum.ADMIN) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Quản lý điều hành không thể tạo tài khoản ADMIN.");
        }

        user.setRole(assignedRole);

        applyRoleConstraints(user, assignedRole, dto.getRegion(), dto.getCommuneIds());

        user.setStatus("ACTIVE");

        User saved = userRepository.save(user);
        return convertToResUserDTO(saved);
    }

    @Transactional(readOnly = true)
    public ResUserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User không tồn tại: " + id));
        return convertToResUserDTO(user);
    }

    @Transactional(readOnly = true)
    public ResUserDTO getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User không tồn tại: " + email));
        return convertToResUserDTO(user);
    }

    @Transactional(readOnly = true)
    public java.util.List<ResUserDTO> findAll() {
        return userRepository.findAll().stream().map(this::convertToResUserDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<ResUserDTO> searchUsers(
            vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum role, String status, String keyword,
            org.springframework.data.domain.Pageable pageable) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()
                .getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User không tồn tại"));

        vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum regionFilter = null;
        if (currentUser.getRole() == RoleEnum.MANAGER || currentUser.getRole() == RoleEnum.CONSULTANT) {
            regionFilter = currentUser.getRegion();
        }

        String kwFilter = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        org.springframework.data.domain.Page<User> page = userRepository.searchUsers(role, status, kwFilter, regionFilter,
                pageable);
        return page.map(this::convertToResUserDTO);
    }

    public ResUserDTO updateUser(Long id, ReqUserUpdateDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User không tồn tại: " + id));

        if (dto.getFullName() != null) {
            user.setFullName(dto.getFullName());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }
        if (dto.getGender() != null) {
            user.setGender(dto.getGender());
        }
        if (dto.getDateOfBirth() != null) {
            user.setDateOfBirth(dto.getDateOfBirth());
        }
        if (dto.getStatus() != null) {
            user.setStatus(dto.getStatus());
        }
        if (dto.getRole() != null) {
            user.setRole(dto.getRole());
        }

        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()
                .getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User không tồn tại"));

        if (currentUser.getRole() == RoleEnum.OPERATOR) {
            if (user.getRole() == RoleEnum.ADMIN || dto.getRole() == RoleEnum.ADMIN) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN,
                        "Quản lý điều hành không thể sửa tài khoản ADMIN hoặc cấp quyền ADMIN.");
            }
        }

        RoleEnum tempRole = user.getRole();
        applyRoleConstraints(user, tempRole, dto.getRegion(), dto.getCommuneIds());

        User saved = userRepository.save(user);
        return convertToResUserDTO(saved);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User không tồn tại: " + id));

        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()
                .getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User không tồn tại"));

        if (currentUser.getRole() == RoleEnum.OPERATOR && user.getRole() == RoleEnum.ADMIN) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Quản lý điều hành không thể xóa tài khoản ADMIN.");
        }

        userRepository.delete(user);
    }

    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User không tồn tại: " + userId));
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu cũ không đúng");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void resetPassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User không tồn tại: " + userId));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private ResUserDTO convertToResUserDTO(User user) {
        ResUserDTO dto = new ResUserDTO();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setGender(user.getGender());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setStatus(user.getStatus());
        dto.setRole(user.getRole());
        dto.setRegion(user.getRegion());
        if (user.getManagedCommunes() != null && !user.getManagedCommunes().isEmpty()) {
            dto.setCommuneIds(user.getManagedCommunes().stream().map(Commune::getId).collect(Collectors.toList()));
        }
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    /**
     * Áp dụng ràng buộc dữ liệu theo Role:
     * - MANAGER : Bắt buộc region, KHÔNG có communes (tự động xóa nếu có).
     * - ACCOUNT_MANAGER: Bắt buộc region VÀ communes.
     * - ADMIN / OPERATOR / CONSULTANT: KHÔNG cho phép region và communes (tự động
     * xóa).
     */
    private void applyRoleConstraints(User user, RoleEnum role,
            vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RegionEnum region,
            java.util.List<Long> communeIds) {

        switch (role) {
            case MANAGER -> {
                if (region == null && user.getRegion() == null) {
                    throw new IllegalArgumentException(
                            "[MANAGER] Bắt buộc phải chọn Tỉnh/Vùng (region) cho tài khoản Quản lý.");
                }
                if (region != null) {
                    user.setRegion(region);
                }
                user.setManagedCommunes(new HashSet<>());
            }
            case ACCOUNT_MANAGER -> {
                if (region == null && user.getRegion() == null) {
                    throw new IllegalArgumentException(
                            "[ACCOUNT_MANAGER] Bắt buộc phải chọn Tỉnh/Vùng (region).");
                }
                if (region != null) {
                    user.setRegion(region);
                }
                if (communeIds != null) {
                    if (communeIds.isEmpty()) {
                        throw new IllegalArgumentException(
                                "[ACCOUNT_MANAGER] Bắt buộc phải chọn ít nhất 1 Xã quản lý.");
                    }
                    Set<Commune> communes = new HashSet<>(communeRepository.findAllById(communeIds));
                    if (communes.size() != communeIds.size()) {
                        throw new IllegalArgumentException("Một vài ID Xã không hợp lệ hoặc không tồn tại.");
                    }
                    user.setManagedCommunes(communes);
                } else if (user.getManagedCommunes() == null || user.getManagedCommunes().isEmpty()) {
                    throw new IllegalArgumentException(
                            "[ACCOUNT_MANAGER] Bắt buộc phải chọn ít nhất 1 Xã quản lý.");
                }
            }
            case ADMIN, OPERATOR, CONSULTANT -> {
                if (region != null) {
                    throw new IllegalArgumentException(
                            "[" + role + "] Role này không được phép chọn Tỉnh/Vùng (region).");
                }
                if (communeIds != null && !communeIds.isEmpty()) {
                    throw new IllegalArgumentException(
                            "[" + role + "] Role này không được phép chọn danh sách Xã (communeIds).");
                }
                user.setRegion(null);
                user.setManagedCommunes(new HashSet<>());
            }
        }
    }
}
