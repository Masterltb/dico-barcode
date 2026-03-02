package com.dico.scan.repository;

import com.dico.scan.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    /**
     * Targeted update of JSONB preferences.
     * Uses a JPQL partial update so we don't fetch and re-save the full entity.
     */
    @Modifying
    @Query("UPDATE User u SET u.preferences = :preferences, u.updatedAt = CURRENT_TIMESTAMP WHERE u.id = :id")
    int updatePreferences(@Param("id") UUID id, @Param("preferences") java.util.Map<String, Object> preferences);
}
