package com.vestry.repository;

import com.vestry.model.PurchaseRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PurchaseRecommendationRepository extends JpaRepository<PurchaseRecommendation, Long> {
    List<PurchaseRecommendation> findByUserId(Long userId);
}
