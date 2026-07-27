package vn.viettel.khdn.crm_DN_VNR20K_2K.config;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${crm.upload.path:uploads}")
    private String uploadBasePath;

    /**
     * Phục vụ file ảnh đã upload qua URL /uploads/**
     * Ví dụ: GET /uploads/appointments/1/uuid.jpg
     *
     * Resolve đường dẫn tuyệt đối từ working directory của JVM
     * để tránh bị map vào thư mục temp Tomcat.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path baseDir;
        Path configuredPath = Paths.get(uploadBasePath);
        if (configuredPath.isAbsolute()) {
            baseDir = configuredPath;
        } else {
            baseDir = Paths.get(System.getProperty("user.dir")).resolve(uploadBasePath);
        }

        // Thêm trailing separator để Spring nhận diện đây là thư mục
        String resourceLocation = baseDir.toAbsolutePath().toUri().toString();
        if (!resourceLocation.endsWith("/")) {
            resourceLocation += "/";
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation);
    }
}
