package com.vestry.Repository;

import com.vestry.Model.PurchaseRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PurchaseRecommendationRepository extends JpaRepository<PurchaseRecommendation, Long> {
    List<PurchaseRecommendation> findByUserId(Long userId);
}
