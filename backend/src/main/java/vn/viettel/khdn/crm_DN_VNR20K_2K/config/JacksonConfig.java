package vn.viettel.khdn.crm_DN_VNR20K_2K.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.cfg.CoercionAction;
import com.fasterxml.jackson.databind.cfg.CoercionInputShape;
import com.fasterxml.jackson.databind.type.LogicalType;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Cấu hình Jackson để xử lý các trường hợp đặc biệt khi parse JSON:
 * - Chuỗi rỗng "" sẽ được convert thành null thay vì throw lỗi (áp dụng cho
 * Enum).
 * - Unrecognized fields sẽ bị bỏ qua thay vì throw lỗi.
 */
@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Chuỗi rỗng "" → null cho tất cả Enum (thay vì lỗi CoercionNotAllowed)
        mapper.coercionConfigFor(LogicalType.Enum)
                .setCoercion(CoercionInputShape.EmptyString, CoercionAction.AsNull);

        // Bỏ qua các field không tồn tại trong DTO
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // Hỗ trợ Java 8 Time API (LocalDate, LocalDateTime, Instant...)
        mapper.registerModule(new JavaTimeModule());

        // Serialize Instant/LocalDateTime thành chuỗi ISO-8601 thay vì epoch number
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        return mapper;
    }
}
