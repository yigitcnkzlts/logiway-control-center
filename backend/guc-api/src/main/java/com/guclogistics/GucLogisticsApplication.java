package com.guclogistics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.guclogistics")
@EntityScan(basePackages = "com.guclogistics")
@EnableJpaRepositories(basePackages = "com.guclogistics")
public class GucLogisticsApplication {

    public static void main(String[] args) {
        SpringApplication.run(GucLogisticsApplication.class, args);
    }
}
