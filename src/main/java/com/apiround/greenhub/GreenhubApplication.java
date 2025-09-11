package com.apiround.greenhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication // <- 이거 하나면 repository, entity 모두 com.apiround.greenhub.* 하위 자동스캔
public class GreenhubApplication {
    public static void main(String[] args) {
        SpringApplication.run(GreenhubApplication.class, args);
    }
}
