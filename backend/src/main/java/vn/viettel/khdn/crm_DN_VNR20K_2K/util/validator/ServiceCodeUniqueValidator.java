package vn.viettel.khdn.crm_DN_VNR20K_2K.util.validator;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import vn.viettel.khdn.crm_DN_VNR20K_2K.repository.ViettelServiceRepository;

@Component
public class ServiceCodeUniqueValidator implements ConstraintValidator<ServiceCodeUnique, String> {

    @Autowired
    private ViettelServiceRepository serviceRepository;

    @Override
    public boolean isValid(String code, ConstraintValidatorContext context) {
        if (code == null || code.isEmpty()) {
            return true;
        }
        return !serviceRepository.existsByServiceCodeIgnoreCase(code.trim());
    }
}
