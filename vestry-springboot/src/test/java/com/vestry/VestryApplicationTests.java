package com.vestry;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "app.jwt.secret=test_secret_at_least_64_chars_long_for_hmac_sha_algorithm_security",
    "app.anthropic.api-key=test-key",
    "app.upload.dir=target/uploads"
})
class VestryApplicationTests {

    @Test
    void contextLoads() {
    }
}
