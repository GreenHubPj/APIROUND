// src/main/java/com/apiround/greenhub/config/StaticResourceConfig.java
package com.apiround.greenhub.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir:${user.home}/greenhub-uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 예: http://localhost:8000/uploads/파일명 으로 접근
        String location = "file:" + Paths.get(uploadDir).toAbsolutePath().toString() + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}
