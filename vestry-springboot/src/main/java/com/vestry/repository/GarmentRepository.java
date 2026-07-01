package com.vestry.repository;

import com.vestry.model.Garment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface GarmentRepository extends JpaRepository<Garment, Long> {
    List<Garment> findByUserId(Long userId);

    @Query("SELECT g FROM Garment g WHERE g.user.id = :userId AND (g.lastWorn IS NULL OR g.lastWorn < :cutoff)")
    List<Garment> findDormant(Long userId, LocalDate cutoff);
}
