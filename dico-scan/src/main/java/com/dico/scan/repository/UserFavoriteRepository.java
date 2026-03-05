package com.dico.scan.repository;

import com.dico.scan.entity.UserFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserFavoriteRepository extends JpaRepository<UserFavorite, UUID> {

    /** All favorites for a user, newest first. */
    List<UserFavorite> findByUserIdOrderByAddedAtDesc(UUID userId);

    /** Check if a barcode is already in favorites. */
    Optional<UserFavorite> findByUserIdAndBarcode(UUID userId, String barcode);

    /** Remove a specific favorite by user + barcode. */
    @Modifying
    @Query("DELETE FROM UserFavorite f WHERE f.userId = :userId AND f.barcode = :barcode")
    void deleteByUserIdAndBarcode(@Param("userId") UUID userId, @Param("barcode") String barcode);

    /** Check existence efficiently. */
    boolean existsByUserIdAndBarcode(UUID userId, String barcode);
}
