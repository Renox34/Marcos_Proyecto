package com.vestry.Repository;

import com.vestry.Model.Outfit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OutfitRepository extends JpaRepository<Outfit, Long> {
    List<Outfit> findByUserId(Long userId);
}
