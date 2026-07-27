package vn.viettel.khdn.crm_DN_VNR20K_2K.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.UserRepository;

@Component
public class AdminInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminInitializer(UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        userRepository.findByEmail("admin@viettel.com").orElseGet(() -> {
            vn.viettel.khdn.crm_DN_VNR20K_2K.model.User admin = new vn.viettel.khdn.crm_DN_VNR20K_2K.model.User();
            admin.setFullName("System Administrator");
            admin.setEmail("admin@viettel.com");
            admin.setPassword(passwordEncoder.encode("123456"));
            admin.setStatus("ACTIVE");
            admin.setRole(vn.viettel.khdn.crm_DN_VNR20K_2K.model.enums.RoleEnum.ADMIN);
            return userRepository.save(admin);
        });
    }
}
