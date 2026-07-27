package vn.viettel.khdn.crm_DN_VNR20K_2K.util.validator;

import org.springframework.beans.factory.annotation.Autowired;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.UserRepository;
import org.springframework.stereotype.Component;

@Component
public class EmailUniqueValidator implements ConstraintValidator<EmailUnique, String> {

    @Autowired
    private UserRepository userRepository;

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        if (email == null || email.isEmpty()) {
            return true; // Let @NotBlank handle this
        }
        return !userRepository.existsByEmailIgnoreCase(email.trim());
    }
}
