package vn.viettel.khdn.crm_DN_VNR20K_2K.controller;

import java.time.Instant;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.RestResponse;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.LoginDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.model.dto.ResLoginDTO;
import vn.viettel.khdn.crm_DN_VNR20K_2K.service.RevokedTokenService;
import vn.viettel.khdn.crm_DN_VNR20K_2K.util.SecurityUtil;

@RestController
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SecurityUtil securityUtil;
    private final RevokedTokenService revokedTokenService;

    public AuthController(AuthenticationManager authenticationManager,
            SecurityUtil securityUtil,
            RevokedTokenService revokedTokenService) {
        this.authenticationManager = authenticationManager;
        this.securityUtil = securityUtil;
        this.revokedTokenService = revokedTokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<RestResponse<ResLoginDTO>> login(@Valid @RequestBody LoginDTO loginDTO) {
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                loginDTO.getUsername(), loginDTO.getPassword());
        Authentication authentication = authenticationManager.authenticate(authenticationToken);

        String accessToken = this.securityUtil.createToken(authentication);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        ResLoginDTO data = new ResLoginDTO();
        data.setAccessToken(accessToken);

        RestResponse<ResLoginDTO> res = new RestResponse<>();
        res.setStatusCode(HttpStatus.OK.value());
        res.setMessage("Đăng nhập thành công");
        res.setData(data);

        return ResponseEntity.ok().body(res);
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            Jwt jwt = jwtAuthenticationToken.getToken();
            Instant expiresAt = jwt.getExpiresAt();
            revokedTokenService.revoke(jwt.getTokenValue(), expiresAt != null ? expiresAt : Instant.now());
        }
        SecurityContextHolder.clearContext();
        revokedTokenService.purgeExpired();
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công"));
    }
}
