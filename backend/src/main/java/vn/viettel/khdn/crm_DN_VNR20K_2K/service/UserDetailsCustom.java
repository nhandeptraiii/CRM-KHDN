package vn.viettel.khdn.crm_DN_VNR20K_2K.service;

import java.util.Set;

import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import vn.viettel.khdn.crm_DN_VNR20K_2K.model.User;

@Component("userDetailService")
public class UserDetailsCustom implements UserDetailsService {
    final UserService userService;

    public UserDetailsCustom(UserService userService) {
        this.userService = userService;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userService.handleGetUserByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("Email hoặc mật khẩu không hợp lệ");
        }
        String normalizedStatus = user.getStatus() == null ? "ACTIVE" : user.getStatus().trim().toUpperCase();
        if ("INACTIVE".equals(normalizedStatus)) {
            throw new DisabledException("Tài khoản đang tạm ngưng. Vui lòng liên hệ quản trị viên.");
        }
        if ("BANNED".equals(normalizedStatus)) {
            throw new DisabledException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }
        Set<SimpleGrantedAuthority> authorities = new java.util.HashSet<>();
        if (user.getRole() != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        } else {
            authorities.add(new SimpleGrantedAuthority("ROLE_CONSULTANT"));
        }
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPassword(), authorities);
    }
}
