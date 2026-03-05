package com.dico.scan;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * One-shot utility test to print BCrypt hashes for seed data.
 * Run with: ./mvnw test -Dtest=BcryptHashGeneratorTest -DfailIfNoTests=false
 */
class BcryptHashGeneratorTest {

    @Test
    void generateHashes() {
        BCryptPasswordEncoder enc = new BCryptPasswordEncoder(10);
        String password = "Test@1234";
        String hash = enc.encode(password);
        System.out.println("\n========== BCRYPT HASH ==========");
        System.out.println("Password : " + password);
        System.out.println("Hash     : " + hash);
        System.out.println("Verify   : " + enc.matches(password, hash));
        System.out.println("=================================\n");
    }
}
