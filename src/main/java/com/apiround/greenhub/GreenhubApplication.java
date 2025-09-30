package com.apiround.greenhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan // ★ properties 바인딩 스캔
public class GreenhubApplication {
    public static void main(String[] args) {
        SpringApplication.run(GreenhubApplication.class, args);
    }
}
