package com.leavemanagement.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MongoIndexInitializer implements CommandLineRunner {

    private final MongoTemplate mongoTemplate;

    @Override
    public void run(String... args) {
        try {
            for (Document index : mongoTemplate.getCollection("users").listIndexes()) {
                String name = index.getString("name");
                if (name != null && (name.contains("userId") || name.startsWith("userId_"))) {
                    log.info("Dropping legacy index: {}", name);
                    mongoTemplate.getCollection("users").dropIndex(name);
                }
            }
        } catch (Exception e) {
            log.warn("Notice: check on legacy indexes: {}", e.getMessage());
        }
    }
}
